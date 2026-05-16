"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, FileText, ExternalLink, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

interface AuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  /** Convex _id of the entity (string) — used to query audit events */
  entityId: string;
  /** Human-readable label shown in the drawer header */
  entityLabel?: string;
}

const ACTION_LABELS: Record<string, string> = {
  "farm.create": "Farm registered",
  "farm.eudrScore.compute": "EUDR score computed",
  "farm.verificationStatus.update": "Verification status updated",
  "farm.polygon.upload": "GPS polygon uploaded",
  "farm.attachPolygon": "GPS polygon attached",
  "farmer.create": "Farmer registered",
  "batch.create": "Batch created",
  "batch.export": "Prepared for export",
  "batch.received": "Receipt confirmed",
};

function labelFor(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  return (
    d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
    " EAT"
  );
}

export default function AuditDrawer({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityLabel,
}: AuditDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const events = useQuery(
    api.audit.recentForEntity,
    isOpen ? { entityType, entityId } : "skip",
  );

  // Focus close button on open
  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isLoading = events === undefined;
  const isEmpty = events !== undefined && events.length === 0;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Audit trail for ${entityType} ${entityLabel ?? entityId}`}
        className="absolute right-0 top-0 h-full w-96 max-w-full bg-white shadow-lg flex flex-col"
        style={{ transition: "transform 200ms ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 flex-shrink-0">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-0.5">
              Audit trail
            </div>
            <div className="font-semibold text-stone-900 text-sm leading-tight">
              {entityType}{" "}
              <span className="font-mono text-stone-500">{entityLabel ?? entityId.slice(0, 12)}</span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close audit drawer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 hover:bg-stone-100 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Event list */}
        <div className="flex-1 overflow-y-auto py-4 px-5">
          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-stone-200 animate-pulse mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-stone-200 animate-pulse rounded w-3/4" />
                    <div className="h-2.5 bg-stone-100 animate-pulse rounded w-1/2" />
                    <div className="h-2 bg-stone-100 animate-pulse rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <FileText size={32} className="text-stone-300 mb-2" aria-hidden="true" />
              <p className="text-sm text-stone-500">No audit events recorded yet.</p>
            </div>
          )}

          {/* Loaded */}
          {events && events.length > 0 && (
            <ol className="space-y-0" aria-label="Audit events">
              {events.map((event, i) => (
                <li key={event._id} className="flex items-start gap-3">
                  {/* Timeline spine */}
                  <div className="flex flex-col items-center flex-shrink-0 mt-1.5">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        event.action.includes("received") ? "bg-emerald-600" : "bg-emerald-400"
                      }`}
                    />
                    {i < events.length - 1 && (
                      <div className="w-px bg-stone-200 flex-1 min-h-[2.5rem] mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-stone-900">
                          {labelFor(event.action)}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5 font-mono">
                          actor:{" "}
                          <span className="text-stone-400">
                            {(event.actor as string).slice(-8)}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`#trace-${event.traceId}`}
                        className="inline-flex items-center gap-0.5 text-xs text-stone-400 hover:text-emerald-700 transition flex-shrink-0 mt-0.5"
                        aria-label={`Open trace ${event.traceId.slice(0, 8)}`}
                      >
                        <FileText size={11} aria-hidden="true" />
                        <ExternalLink size={10} aria-hidden="true" />
                      </a>
                    </div>

                    <div className="text-xs font-mono text-stone-400 mt-1">
                      {formatTimestamp(event.at)}
                    </div>
                    <div className="text-[10px] font-mono text-stone-300 mt-0.5 truncate">
                      tr_{event.traceId.slice(0, 16)}
                    </div>

                    {/* Diff */}
                    {event.diff && typeof event.diff === "object" && Object.keys(event.diff as object).length > 0 && (
                      <div className="mt-2 rounded-lg bg-stone-50 border border-stone-100 px-2.5 py-2 space-y-0.5">
                        {Object.entries(event.diff as Record<string, { from: unknown; to: unknown }>).map(([field, change]) => (
                          <div key={field} className="text-xs font-mono">
                            <span className="text-stone-400">{field}:</span>{" "}
                            {change?.from !== undefined && (
                              <>
                                <span className="text-red-500 line-through">{String(change.from)}</span>{" "}
                                <span className="text-stone-400">→</span>{" "}
                              </>
                            )}
                            <span className="text-emerald-700">
                              {change?.to !== undefined ? String(change.to) : String(change)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {event.action.includes("received") && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <CheckCircle2 size={12} aria-hidden="true" />
                        Cryptographically confirmed
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 flex-shrink-0">
          {events && (
            <p className="text-xs text-stone-400 font-mono">
              {events.length} event{events.length !== 1 ? "s" : ""} · tamper-evident via SHA-256
            </p>
          )}
          {isLoading && (
            <p className="text-xs text-stone-300 font-mono flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" aria-hidden="true" />
              Loading audit trail…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
