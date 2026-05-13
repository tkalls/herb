"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  queueDb,
  dequeue,
  patchPayload,
  markAttempted,
  pendingCount,
  type FarmerCreatePayload,
  type FarmCreatePayload,
  type AttachPolygonPayload,
  type QueuedMutation,
} from "./queue";

export interface SyncStatus {
  online: boolean;
  queued: number;
  draining: boolean;
  lastError: string | null;
}

const MAX_ATTEMPTS = 5;

function isValidationError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  // Convex surfaces 4xx-class errors with these patterns
  return (
    err.message.includes("ArgumentValidationError") ||
    err.message.includes("invalid") ||
    err.message.includes("required")
  );
}

function backoffMs(attempts: number): number {
  return Math.min(500 * 2 ** attempts, 30_000);
}

export function useSyncQueue(): SyncStatus {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [queued, setQueued] = useState(0);
  const [draining, setDraining] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const drainingRef = useRef(false);

  // Real Convex mutations
  const farmerCreate = useMutation(api.farmers.create);
  const attachPolygon = useMutation(api.farms.attachPolygon);

  // HANDOFF: api.farms.create not yet available — see HANDOFF.md Request 1.
  // Stub fails gracefully: items stay queued until Lane 1 ships the mutation.
  const farmCreateStub = useCallback(
    async (_args: {
      farmerId: Id<"farmers">;
      code: string;
      crop: "coffee" | "avocado" | "macadamia";
      variety: string;
      estimatedAreaHa: number;
      certifications: string[];
    }): Promise<{ id: string; traceId: string }> => {
      throw new Error("api.farms.create not yet available — see HANDOFF.md");
    },
    [],
  );

  // Keep queued count fresh
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const n = await pendingCount();
      if (!cancelled) setQueued(n);
    };
    refresh();
    const interval = setInterval(refresh, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Track network state
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => {
      setOnline(false);
      setDraining(false);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Drain when coming online
  useEffect(() => {
    if (!online || drainingRef.current) return;

    let cancelled = false;

    const drain = async () => {
      const count = await pendingCount();
      if (count === 0) return;

      drainingRef.current = true;
      setDraining(true);

      const rows = await queueDb.mutations.orderBy("createdAt").toArray();

      for (const row of rows) {
        if (cancelled || !navigator.onLine) break;
        if (row.id === undefined) continue;
        if (row.attempts >= MAX_ATTEMPTS) continue;

        if (row.attempts > 0) {
          await new Promise((r) => setTimeout(r, backoffMs(row.attempts)));
        }

        try {
          await drainRow(row);
          await dequeue(row.id);
          setLastError(null);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await markAttempted(row.id, msg);
          setLastError(msg);
          if (isValidationError(err)) {
            // 4xx: stop drain, surface error, do not retry
            break;
          }
          // 5xx / network: continue to next row, backoff will apply on retry
        }

        const remaining = await pendingCount();
        if (!cancelled) setQueued(remaining);
      }

      const final = await pendingCount();
      if (!cancelled) {
        setQueued(final);
        setDraining(false);
      }
      drainingRef.current = false;
    };

    drain();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  // ── Per-row drain logic ──────────────────────────────────────────────────

  async function drainRow(row: QueuedMutation): Promise<void> {
    switch (row.type) {
      case "farmer.create": {
        const p = row.payload as FarmerCreatePayload;
        const result = await farmerCreate({
          cooperativeId: p.cooperativeId as Id<"cooperatives">,
          code: p.farmerCode,
          fullName: p.fullName,
          phone: p.phone,
          nationalId: p.nationalId,
          village: p.village,
          district: p.district,
          region: p.region,
        });

        // Thread the resolved farmerId into any pending farm.create rows
        const dependents = await queueDb.mutations
          .filter((r) => r.type === "farm.create")
          .toArray();
        for (const dep of dependents) {
          const dp = dep.payload as FarmCreatePayload;
          if (dp.farmerCode === p.farmerCode && dep.id !== undefined) {
            await patchPayload(dep.id, { resolvedFarmerId: result.id } as Partial<FarmCreatePayload>);
          }
        }
        break;
      }

      case "farm.create": {
        const p = row.payload as FarmCreatePayload;
        if (!p.resolvedFarmerId) {
          throw new Error(
            `farm.create blocked: farmer ${p.farmerCode} not yet synced`,
          );
        }
        const result = await farmCreateStub({
          farmerId: p.resolvedFarmerId as Id<"farmers">,
          code: p.farmCode,
          crop: p.crop,
          variety: p.variety,
          estimatedAreaHa: p.estimatedAreaHa,
          certifications: p.certifications,
        });

        // Thread the resolved farmId into any pending farm.attachPolygon rows
        const dependents = await queueDb.mutations
          .filter((r) => r.type === "farm.attachPolygon")
          .toArray();
        for (const dep of dependents) {
          const dp = dep.payload as AttachPolygonPayload;
          if (dp.farmCode === p.farmCode && dep.id !== undefined) {
            await patchPayload(dep.id, { resolvedFarmId: result.id } as Partial<AttachPolygonPayload>);
          }
        }
        break;
      }

      case "farm.attachPolygon": {
        const p = row.payload as AttachPolygonPayload;
        if (!p.resolvedFarmId) {
          throw new Error(
            `farm.attachPolygon blocked: farm ${p.farmCode} not yet synced`,
          );
        }
        await attachPolygon({
          farmId: p.resolvedFarmId as Id<"farms">,
          r2Key: "",   // inline path; r2Key optional pending HANDOFF.md Request 2
          polygonInline: p.polygonInline,
          areaHa: p.areaHa,
        });
        break;
      }
    }
  }

  return { online, queued, draining, lastError };
}
