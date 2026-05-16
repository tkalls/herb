"use client";

import { Wifi, WifiOff, AlertTriangle, RefreshCw } from "lucide-react";
import type { SyncStatus } from "@/lib/sync/useSyncQueue";

export default function SyncBadge({ status }: { status: SyncStatus }) {
  const { online, queued, draining, lastError } = status;

  let palette: string;
  let icon: React.ReactNode;
  let text: string;

  if (lastError) {
    palette = "bg-red-50 border-red-200 text-red-800";
    icon = <AlertTriangle size={14} aria-hidden="true" />;
    text = "Sync issue — tap to retry";
  } else if (draining) {
    palette = "bg-sky-50 border-sky-200 text-sky-800";
    icon = <RefreshCw size={14} className="animate-spin" aria-hidden="true" />;
    text = `Syncing ${queued} item${queued !== 1 ? "s" : ""}…`;
  } else if (!online && queued > 0) {
    palette = "bg-amber-50 border-amber-200 text-amber-800";
    icon = <WifiOff size={14} aria-hidden="true" />;
    text = `Offline — ${queued} queued`;
  } else {
    palette = "bg-emerald-50 border-emerald-200 text-emerald-800";
    icon = <Wifi size={14} aria-hidden="true" />;
    text = "Online — synced";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${palette}`}
    >
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {text}
      </span>
      {queued > 0 && <span className="font-mono">{queued}</span>}
    </div>
  );
}
