"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { History, AlertTriangle, FileText, ShieldCheck } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  "farm.create": "Farm registered",
  "farm.eudrScore.compute": "EUDR score computed",
  "farm.verificationStatus.update": "Verification status updated",
  "farm.attachPolygon": "GPS polygon attached",
  "farmer.create": "Farmer registered",
  "batch.create": "Batch created",
  "batch.export": "Prepared for export",
  "batch.received": "Receipt confirmed",
};

function labelFor(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
    " EAT"
  );
}

export default function AuditPage() {
  const events = useQuery(api.audit.recentAll, { limit: 200 });

  // Loading state — skeletons, no page-load spinner (per §6)
  if (events === undefined) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="bg-white border-b border-stone-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-200 animate-pulse" />
            <div>
              <div className="h-5 bg-stone-200 animate-pulse rounded w-32 mb-1" />
              <div className="h-3 bg-stone-100 animate-pulse rounded w-56" />
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-stone-200 bg-white p-4 h-20 animate-pulse" />
            ))}
          </div>
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="px-4 py-3 border-b border-stone-100 flex gap-4">
                <div className="h-4 bg-stone-200 animate-pulse rounded w-40" />
                <div className="h-4 bg-stone-100 animate-pulse rounded w-24" />
                <div className="h-4 bg-stone-100 animate-pulse rounded w-32 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Access denied (empty array returned by recentAll when not coop_admin)
  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-8 max-w-md text-center">
          <ShieldCheck size={40} className="text-amber-500 mx-auto mb-4" aria-hidden="true" />
          <h1 className="font-semibold text-stone-900 mb-2">Audit log restricted</h1>
          <p className="text-sm text-stone-600">
            This view is available to cooperative administrators only.
            Sign in with a coop_admin account to access the full audit trail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
              <History size={20} className="text-stone-600" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-stone-900">Audit Log</h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Tamper-evident record of all system writes · KNCU
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total events", value: events.length },
            { label: "Entities touched", value: new Set(events.map((e) => e.entityId)).size },
            { label: "Actors", value: new Set(events.map((e) => e.actor)).size },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm text-center">
              <div className="text-2xl font-mono font-semibold text-stone-900 tabular-nums">{stat.value}</div>
              <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Event table */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 bg-stone-50 flex items-center gap-2">
            <FileText size={14} className="text-stone-500" aria-hidden="true" />
            <span className="text-xs font-mono uppercase tracking-wider text-stone-600">
              {events.length} events · newest first
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600">Action</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600">Entity</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600 hidden md:table-cell">Actor</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600">Timestamp</th>
                  <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600 hidden lg:table-cell">Trace ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm text-stone-800 font-medium">{labelFor(event.action)}</div>
                      <div className="text-xs text-stone-400 font-mono mt-0.5">{event.action}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-stone-600 capitalize">{event.entityType}</div>
                      <div className="text-[10px] font-mono text-stone-400 truncate max-w-[120px]">{event.entityId.slice(-10)}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-xs font-mono text-stone-500">{(event.actor as string).slice(-8)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-stone-600 tabular-nums whitespace-nowrap">
                        {formatDateTime(event.at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-[10px] font-mono text-stone-400 truncate max-w-[160px]">
                        tr_{event.traceId.slice(0, 16)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 flex items-center gap-2 text-xs text-stone-400 font-mono">
          <AlertTriangle size={12} aria-hidden="true" />
          Audit records are append-only. No event can be modified or deleted.
          Each entry includes an OpenTelemetry trace ID linking to SignOz.
        </div>
      </div>
    </div>
  );
}
