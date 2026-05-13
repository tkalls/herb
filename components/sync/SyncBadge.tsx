"use client";

import { AlertTriangle, Wifi, WifiOff } from "lucide-react";
import type { SyncStatus } from "@/lib/sync/useSyncQueue";

interface Props {
  status: SyncStatus;
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="w-3.5 h-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export default function SyncBadge({ status }: Props) {
  const { online, queued, draining, lastError } = status;

  let palette: string;
  let icon: React.ReactNode;
  let text: string;

  if (lastError) {
    palette = "bg-red-50 border-red-200 text-red-800";
    icon = <AlertTriangle size={14} aria-hidden="true" />;
    text = "Sync issue — tap to retry";
  } else if (!online) {
    palette = "bg-amber-50 border-amber-200 text-amber-800";
    icon = <WifiOff size={14} aria-hidden="true" />;
    text = `Offline${queued > 0 ? ` — ${queued} queued` : ""}`;
  } else if (draining) {
    palette = "bg-sky-50 border-sky-200 text-sky-800";
    icon = <Spinner />;
    text = `Syncing ${queued} item${queued === 1 ? "" : "s"}…`;
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
      {queued > 0 && (
        <span className="font-mono" aria-label={`${queued} items queued`}>
          {queued}
        </span>
      )}
    </div>
  );
}
