"use client";

import { useEffect, useRef, useState } from "react";
import { queueDb, dequeue, markAttempted, pendingCount } from "./queue";

export interface SyncStatus {
  online: boolean;
  queued: number;
  draining: boolean;
  lastError: string | null;
}

// Stubbed until Lane 1 schema is ready. Swap for real useMutation calls in Phase 2.
type MutationFn = (payload: unknown) => Promise<{ ok: boolean }>;
const stubMutation: MutationFn = () => Promise.resolve({ ok: true });

const MAX_ATTEMPTS = 5;

function backoffMs(attempts: number): number {
  return Math.min(1000 * 2 ** attempts, 30_000);
}

export function useSyncQueue(): SyncStatus {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [queued, setQueued] = useState(0);
  const [draining, setDraining] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const drainingRef = useRef(false);

  // Keep queued count in sync with Dexie
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const n = await pendingCount();
      if (!cancelled) setQueued(n);
    };
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Track online/offline
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => { setOnline(false); setDraining(false); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Drain when online
  useEffect(() => {
    if (!online || drainingRef.current) return;

    let cancelled = false;

    const drain = async () => {
      if (drainingRef.current) return;
      const count = await pendingCount();
      if (count === 0) return;

      drainingRef.current = true;
      setDraining(true);

      const rows = await queueDb.mutations.orderBy("createdAt").toArray();
      for (const row of rows) {
        if (cancelled || !navigator.onLine) break;
        if (row.attempts >= MAX_ATTEMPTS) continue;
        if (row.id === undefined) continue;

        // Back off if retrying
        if (row.attempts > 0) {
          await new Promise((r) => setTimeout(r, backoffMs(row.attempts)));
        }

        try {
          await stubMutation(row.payload);
          await dequeue(row.id);
          setLastError(null);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          await markAttempted(row.id, msg);
          setLastError(msg);
        }
      }

      const remaining = await pendingCount();
      if (!cancelled) {
        setQueued(remaining);
        setDraining(false);
      }
      drainingRef.current = false;
    };

    drain();
    return () => { cancelled = true; };
  }, [online]);

  return { online, queued, draining, lastError };
}
