"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import distance from "@turf/distance";
import { point } from "@turf/helpers";
import {
  ShieldCheck,
  Ship,
  MapPin,
  CheckCircle2,
  FileText,
  Globe2,
  Coffee,
  Leaf,
  User,
  Package,
  AlertTriangle,
} from "lucide-react";
import SignatureButtonInner from "@/components/signature/SignatureButton";

const ROTTERDAM = point([4.4792, 51.9225]); // destination port [lng, lat]
const PROXIMITY_KM = 10;

// BatchTraceMap is SSR-unsafe (MapLibre) — keep the dynamic wrapper
export const BatchTraceMap = dynamic(
  () => import("@/components/map/BatchTraceMap"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl bg-stone-200 animate-pulse aspect-[4/3] md:aspect-[16/10]" />
    ),
  },
);

export { default as SignatureButton } from "@/components/signature/SignatureButton";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

const STAGE_ICONS: Record<string, typeof Ship> = {
  harvest: Leaf,
  village_collection: MapPin,
  cooperative_intake: Package,
  processing: Coffee,
  export_prep: Package,
  in_transit: Ship,
  received: CheckCircle2,
};

const STAGE_LABELS: Record<string, string> = {
  harvest: "Harvest",
  village_collection: "Village collection",
  cooperative_intake: "Cooperative intake",
  processing: "Processing",
  export_prep: "Export preparation",
  in_transit: "In transit",
  received: "Receipt confirmed",
};

const statusLabel: Record<string, string> = {
  preparing: "Preparing",
  ready: "Export ready",
  in_transit: "In transit",
  delivered: "Delivered",
};

const statusPalette: Record<string, string> = {
  preparing: "bg-amber-50 text-amber-800 border-amber-200",
  ready: "bg-emerald-50 text-emerald-800 border-emerald-200",
  in_transit: "bg-sky-50 text-sky-800 border-sky-200",
  delivered: "bg-stone-100 text-stone-700 border-stone-200",
};

// ── BuyerTraceContent ─────────────────────────────────────────────────────────

export function BuyerTraceContent({ batchCode }: { batchCode: string }) {
  const trace = useQuery(api.buyer.traceByCode, { code: batchCode });
  const batchDoc = useQuery(api.batches.getByCode, { code: batchCode });
  const confirmReceipt = useMutation(api.buyer.confirmReceipt);

  // Loading state — skeletons, no page-load spinner (per §6)
  if (trace === undefined || batchDoc === undefined) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="bg-stone-900 h-24 animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-stone-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 space-y-2">
                  <div className="h-3 bg-stone-200 animate-pulse rounded w-1/2" />
                  <div className="h-8 bg-stone-200 animate-pulse rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-stone-200 animate-pulse aspect-[4/3] md:aspect-[16/10]" />
          <div className="space-y-3">
            <div className="h-5 bg-stone-200 animate-pulse rounded w-32" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-stone-200 bg-white p-5 h-20 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (trace === null || batchDoc === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 max-w-md text-center">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-3" aria-hidden="true" />
          <h1 className="font-semibold text-stone-900 mb-1">Batch not found</h1>
          <p className="text-sm text-stone-600">
            No trace record exists for batch{" "}
            <span className="font-mono text-stone-800">{batchCode}</span>.
          </p>
        </div>
      </div>
    );
  }

  const CropIcon = trace.crop === "coffee" ? Coffee : Leaf;
  const batchId = batchDoc._id as Id<"batches">;

  // Proximity gate: show SignatureButton only when within 10 km of Rotterdam
  const canSign = useMemo(() => {
    if (!trace.lastPing) return false;
    const current = point([trace.lastPing.lng, trace.lastPing.lat]);
    return distance(current, ROTTERDAM, { units: "kilometers" }) <= PROXIMITY_KM;
  }, [trace.lastPing]);

  // Build signed state from trace data if batch is already delivered
  const initialSigned =
    batchDoc.status === "delivered" && batchDoc.receiptSigner && batchDoc.receiptHash && batchDoc.receiptAt
      ? { signerName: batchDoc.receiptSigner, hash: batchDoc.receiptHash, at: batchDoc.receiptAt }
      : undefined;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header band */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center flex-shrink-0">
                <CropIcon size={22} className="text-emerald-300" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-0.5">
                  Kilimanjaro Native Cooperative Union · Tanzania
                </div>
                <div className="text-lg font-mono font-semibold tracking-tight">
                  {trace.code}
                </div>
                <div className="text-sm text-stone-300 mt-0.5">{trace.description}</div>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start sm:self-auto ${statusPalette[trace.status]}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
              {statusLabel[trace.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Section 1 — Summary KPIs */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
            <div className="p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-1">Net weight</div>
              <div className="text-3xl font-mono font-semibold text-stone-900 tabular-nums">
                {trace.weightKg.toLocaleString()}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">kg</div>
            </div>
            <div className="p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-1">Origin</div>
              <div className="text-2xl font-semibold text-stone-900">Kilimanjaro</div>
              <div className="text-xs text-stone-500 mt-0.5">Tanzania, East Africa</div>
            </div>
            <div className="p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-1">Buyer</div>
              <div className="text-xl font-semibold text-stone-900 leading-snug">
                {batchDoc.buyerName}
              </div>
              <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                <Globe2 size={10} aria-hidden="true" />
                {batchDoc.buyerCountry}
              </div>
            </div>
          </div>
          {trace.eudrDeclarationId && (
            <div className="px-5 py-3 border-t border-stone-100 flex items-center gap-2 bg-emerald-50">
              <ShieldCheck size={16} className="text-emerald-700" aria-hidden="true" />
              <span className="text-xs font-medium text-emerald-800">EUDR Declaration filed</span>
              <span className="font-mono text-xs text-emerald-700 ml-1">{trace.eudrDeclarationId}</span>
            </div>
          )}
        </div>

        {/* Transit map */}
        <BatchTraceMap batchId={batchId} />

        {/* Section 2 — Origin farms (zero PII) */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Origin farms</h2>
          {trace.farmCount === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
              <Package size={32} className="text-stone-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-stone-500">No farms linked to this batch yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trace.farmerInitials.map((initials, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-stone-600" aria-hidden="true" />
                    </div>
                    <div>
                      <div
                        className="font-mono font-semibold text-stone-900 text-sm"
                        title="Farmer identity withheld for privacy"
                      >
                        {initials}
                      </div>
                      <div className="text-xs text-stone-500">Contributing farmer</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3 — Chain of custody */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Chain of custody</h2>
          {trace.chainOfCustody.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-6 text-center">
              <FileText size={32} className="text-stone-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-stone-500">No custody events recorded yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
              <ol aria-label="Chain of custody events">
                {trace.chainOfCustody.map((event, i) => {
                  const isLatest = i === trace.chainOfCustody.length - 1;
                  const StageIcon = STAGE_ICONS[event.stage] ?? Ship;
                  return (
                    <li
                      key={`${event.stage}-${i}`}
                      className={`flex items-start gap-4 px-6 py-5 ${isLatest ? "bg-emerald-50" : ""} ${i > 0 ? "border-t border-stone-100" : ""}`}
                    >
                      <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLatest ? "bg-emerald-100" : "bg-stone-100"}`}>
                          <StageIcon
                            size={16}
                            className={isLatest ? "text-emerald-700" : "text-stone-500"}
                            aria-hidden="true"
                          />
                        </div>
                        {i < trace.chainOfCustody.length - 1 && (
                          <div className="w-px flex-1 bg-stone-200 mt-1 min-h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-stone-900 text-sm">
                              {STAGE_LABELS[event.stage] ?? event.stage}
                            </div>
                            <div className="text-xs text-stone-500 mt-0.5 capitalize">
                              {event.actorRole}
                            </div>
                            {event.location && (
                              <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                                <MapPin size={10} aria-hidden="true" />
                                {event.location.place}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-mono text-stone-500 tabular-nums">
                              {formatDateTime(event.at)}
                            </div>
                          </div>
                        </div>
                        {event.signatureHash && (
                          <div className="mt-2 text-[10px] font-mono text-stone-400 truncate">
                            sig:{event.signatureHash.slice(0, 32)}…
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>

        {/* Section 4 — Receipt */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-2">Receipt</h2>
          <p className="text-sm text-stone-500 mb-4">
            Confirm receipt of this batch to close the traceability loop. Your signature
            is recorded permanently against this trace.
          </p>
          {(canSign || trace.status === "delivered") ? (
            <SignatureButtonInner
              batchCode={batchCode}
              initialSigned={initialSigned}
              onConfirm={async (signerName) => {
                const result = await confirmReceipt({ batchId, signerName });
                return { hash: result.hash, at: result.at };
              }}
            />
          ) : (
            <div className="rounded-xl bg-stone-50 border border-stone-200 p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                <Ship size={18} className="text-stone-400" aria-hidden="true" />
              </div>
              <div>
                <div className="font-medium text-stone-700 text-sm">Awaiting arrival</div>
                <p className="text-sm text-stone-500 mt-1">
                  Receipt signature becomes available when the shipment reaches within{" "}
                  {PROXIMITY_KM} km of the destination port. Track progress on the map above.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section 5 — Documents (static — R2 links wired in Phase 3) */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Documents</h2>
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden divide-y divide-stone-100">
            {[
              { name: `EUDR Declaration — ${trace.eudrDeclarationId ?? "pending"}`, size: "142 KB", type: "PDF" },
              { name: "Phytosanitary Certificate", size: "89 KB", type: "PDF" },
              { name: "Quality Grading Report — Grade A", size: "211 KB", type: "PDF" },
            ].map((doc) => (
              <div key={doc.name} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-stone-500" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800 truncate">{doc.name}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{doc.type} · {doc.size}</div>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-stone-700 transition hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                  aria-label={`Open ${doc.name}`}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer band */}
      <footer className="border-t border-stone-200 mt-8 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs font-mono text-stone-500">
            Audited by Herb · Verified against trace{" "}
            <span className="text-stone-700">tr_{batchCode.toLowerCase()}</span>
          </p>
          <p className="text-xs text-stone-400">
            Last updated {formatDate(Date.now())} · Kilimanjaro, Tanzania
          </p>
        </div>
      </footer>
    </div>
  );
}
