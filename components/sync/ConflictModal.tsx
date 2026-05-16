"use client";

import { AlertCircle } from "lucide-react";
import type { ConflictInfo } from "@/lib/sync/useSyncQueue";

const ENTITY_LABELS: Record<string, string> = {
  "farmer.create": "Farmer registration",
  "farm.create": "Farm record",
  "farm.attachPolygon": "Farm boundary",
};

interface Props {
  conflict: ConflictInfo;
  onSkip: () => void;
  onRetry: () => void;
}

export default function ConflictModal({ conflict, onSkip, onRetry }: Props) {
  const label = ENTITY_LABELS[conflict.entity] ?? conflict.entity;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
            </div>
            <div>
              <h2 id="conflict-title" className="font-semibold text-stone-900">
                Submission conflict
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">{label}</p>
            </div>
          </div>
          <p className="text-sm text-stone-600 rounded-xl bg-stone-50 px-3 py-2 font-mono break-words line-clamp-3">
            {conflict.message}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 px-6 pb-6">
          <button
            onClick={onSkip}
            className="py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 focus-visible:outline-offset-2"
          >
            Skip entry
          </button>
          <button
            onClick={onRetry}
            className="py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
