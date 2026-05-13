"use client";

import { useEffect, useRef } from "react";
import { X, FileText, ExternalLink, CheckCircle2 } from "lucide-react";

export interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  at: number;
  traceId: string;
  diff?: Record<string, { from: unknown; to: unknown }>;
}

interface AuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  events?: AuditEvent[];
}

// Phase 1 stub — replaced by api.audit.recentForEntity in Phase 2
function stubEvents(entityType: string, entityId: string): AuditEvent[] {
  const now = Date.now();
  return [
    {
      id: "ae-001",
      action: `${entityType}.create`,
      actor: "Amani Tarimo",
      at: now - 86_400_000 * 3,
      traceId: "7f2a1b9c3d4e5f6a8b9c0d1e",
    },
    {
      id: "ae-002",
      action: `${entityType}.eudrScore.compute`,
      actor: "system",
      at: now - 86_400_000 * 3 + 1_200,
      traceId: "8b3c2d1e4f5a6b7c9d0e1f2a",
      diff: {
        eudrScore: { from: 0, to: 87 },
        verificationStatus: { from: "unverified", to: "pending" },
      },
    },
    {
      id: "ae-003",
      action: `${entityType}.verificationStatus.update`,
      actor: "David Mushi",
      at: now - 86_400_000 * 1.5,
      traceId: "9c4d3e2f1a6b7c8d0e1f2a3b",
      diff: {
        verificationStatus: { from: "pending", to: "verified" },
      },
    },
    {
      id: "ae-004",
      action: `${entityType}.polygon.upload`,
      actor: "Amani Tarimo",
      at: now - 86_400_000,
      traceId: "0d5e4f3a2b7c8d9e1f2a3b4c",
    },
  ];
}

const ACTION_LABELS: Record<string, string> = {
  "farm.create": "Farm registered",
  "farm.eudrScore.compute": "EUDR score computed",
  "farm.verificationStatus.update": "Verification status updated",
  "farm.polygon.upload": "GPS polygon uploaded",
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
  events,
}: AuditDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const displayEvents = events ?? stubEvents(entityType, entityId);

  // Focus the close button on open
  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
        aria-label={`Audit trail for ${entityType} ${entityId}`}
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
              <span className="font-mono text-stone-500">{entityId}</span>
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
          {displayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <FileText size={32} className="text-stone-300 mb-2" aria-hidden="true" />
              <p className="text-sm text-stone-500">No audit events recorded yet.</p>
            </div>
          ) : (
            <ol className="space-y-0" aria-label="Audit events">
              {displayEvents.map((event, i) => (
                <li key={event.id} className="flex items-start gap-3">
                  {/* Timeline spine */}
                  <div className="flex flex-col items-center flex-shrink-0 mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                    {i < displayEvents.length - 1 && (
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
                        <div className="text-xs text-stone-500 mt-0.5">
                          by{" "}
                          <span className="font-medium text-stone-700">
                            {event.actor}
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
                    {event.diff && Object.keys(event.diff).length > 0 && (
                      <div className="mt-2 rounded-lg bg-stone-50 border border-stone-100 px-2.5 py-2 space-y-0.5">
                        {Object.entries(event.diff).map(([field, change]) => (
                          <div key={field} className="text-xs font-mono">
                            <span className="text-stone-400">{field}:</span>{" "}
                            <span className="text-red-500 line-through">
                              {String(change.from)}
                            </span>{" "}
                            <span className="text-stone-400">→</span>{" "}
                            <span className="text-emerald-700">
                              {String(change.to)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Confirmed events get a stamp */}
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
          <p className="text-xs text-stone-400 font-mono">
            {displayEvents.length} event{displayEvents.length !== 1 ? "s" : ""} ·
            tamper-evident via SHA-256
          </p>
        </div>
      </div>
    </div>
  );
}
