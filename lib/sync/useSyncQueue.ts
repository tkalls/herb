"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useAction } from "convex/react";
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

export interface ConflictInfo {
  id: number;
  entity: string;
  message: string;
}

export interface SyncStatus {
  online: boolean;
  queued: number;
  draining: boolean;
  lastError: string | null;
  conflict: ConflictInfo | null;
  resolveConflict: (action: "skip" | "retry", id: number) => Promise<void>;
}

const MAX_ATTEMPTS = 5;

function isValidationError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes("ArgumentValidationError") ||
    err.message.includes("invalid") ||
    err.message.includes("required")
  );
}

function isConflictError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.message.includes("already exists") ||
    err.message.includes("duplicate") ||
    err.message.includes("unique constraint") ||
    err.message.includes("ConflictError")
  );
}

function backoffMs(attempts: number): number {
  return Math.min(500 * 2 ** attempts, 30_000);
}

// Retry transient failures (e.g. Convex WS not yet reconnected after coming online)
// without incrementing the persistent attempts counter. Conflict/validation errors
// are re-thrown immediately so the caller handles them as permanent failures.
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (isConflictError(err) || isValidationError(err)) throw err;
      lastErr = err;
      if (i < maxRetries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

export function useSyncQueue(): SyncStatus {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [queued, setQueued] = useState(0);
  const [draining, setDraining] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const [drainVersion, setDrainVersion] = useState(0);
  const drainingRef = useRef(false);

  // Real Convex mutations + R2 presign action
  const farmerCreate = useMutation(api.farmers.create);
  const farmCreate = useMutation(api.farms.create);
  const attachPolygon = useMutation(api.farms.attachPolygon);
  const presignPolygonUpload = useAction(api.r2.presignPolygonUpload);

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

  // Drain when coming online or after conflict resolution
  useEffect(() => {
    if (!online || drainingRef.current) return;

    let cancelled = false;

    const drain = async () => {
      const count = await pendingCount();
      if (count === 0) return;

      // Give Convex WS time to reconnect before firing mutations — the browser
      // `online` event fires before the WebSocket handshake completes.
      await new Promise((r) => setTimeout(r, 500));
      if (cancelled || !navigator.onLine) return;

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
          await withRetry(() => drainRow(row));
          await dequeue(row.id);
          setLastError(null);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await markAttempted(row.id, msg);
          if (isConflictError(err)) {
            if (!cancelled) {
              setConflict({ id: row.id, entity: row.type, message: msg });
            }
            break;
          }
          setLastError(msg);
          if (isValidationError(err)) {
            break;
          }
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
  }, [online, drainVersion]);

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
        const result = await farmCreate({
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

        // Try R2 upload; fall back to inline polygon if R2 is unavailable
        let r2Key: string | undefined;
        try {
          const { key, url } = await presignPolygonUpload({ farmCode: p.farmCode });
          const geojson = {
            type: "Polygon" as const,
            coordinates: [p.polygonInline.map(({ lat, lng }) => [lng, lat])],
          };
          const res = await fetch(url, {
            method: "PUT",
            body: JSON.stringify(geojson),
            headers: { "Content-Type": "application/geo+json" },
          });
          if (res.ok) r2Key = key;
        } catch {
          // R2 unavailable — polygonInline used as fallback below
        }

        await attachPolygon({
          farmId: p.resolvedFarmId as Id<"farms">,
          ...(r2Key ? { r2Key } : { polygonInline: p.polygonInline }),
          areaHa: p.areaHa,
        });
        break;
      }
    }
  }

  const resolveConflict = useCallback(async (action: "skip" | "retry", id: number) => {
    if (action === "skip") {
      await dequeue(id);
    } else {
      await queueDb.mutations
        .where("id")
        .equals(id)
        .modify((row: QueuedMutation) => {
          row.attempts = 0;
          row.lastError = undefined;
        });
    }
    setConflict(null);
    setLastError(null);
    setDrainVersion((v) => v + 1);
  }, []);

  return { online, queued, draining, lastError, conflict, resolveConflict };
}
