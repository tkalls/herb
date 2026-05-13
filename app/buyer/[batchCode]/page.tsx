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
} from "lucide-react";
import { BatchTraceMap, SignatureButton } from "./_components";
import { batches, farms, farmers } from "@/lib/data";

export const metadata = {
  robots: "noindex, nofollow",
};

// ── Mock data shapes ─────────────────────────────────────────────────────────

interface BatchEvent {
  stage: string;
  stageLabel: string;
  actorName: string;
  actorRole: string;
  location: string;
  at: number;
  evidenceLabel?: string;
  signatureHash?: string;
}

interface DocumentRow {
  name: string;
  size: string;
  type: string;
}

// Convert "Amina Wanjiku Mbeki" → "A.W.M." — zero PII on public page
function toInitials(fullName: string): string {
  return (
    fullName
      .split(" ")
      .map((n) => n[0])
      .join(".") + "."
  );
}

function formatDate(isoOrMs: string | number): string {
  const d = typeof isoOrMs === "number" ? new Date(isoOrMs) : new Date(isoOrMs);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(ms: number): string {
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

const STAGE_ICONS: Record<string, typeof Ship> = {
  harvest: Leaf,
  village_collection: MapPin,
  cooperative_intake: Package,
  processing: Coffee,
  export_prep: Package,
  in_transit: Ship,
  received: CheckCircle2,
};

function mockBatchEvents(batchId: string): BatchEvent[] {
  const base = Date.now() - 86_400_000 * 10;
  return [
    {
      stage: "harvest",
      stageLabel: "Harvest",
      actorName: "Kibosho Farmers",
      actorRole: "Farming collective",
      location: "Kibosho, Kilimanjaro, Tanzania",
      at: base,
    },
    {
      stage: "village_collection",
      stageLabel: "Village collection",
      actorName: "Amani Tarimo",
      actorRole: "Field agent",
      location: "Kibosho collection point, Tanzania",
      at: base + 86_400_000 * 1.5,
      evidenceLabel: "Weight ticket — 2,840 kg gross",
    },
    {
      stage: "cooperative_intake",
      stageLabel: "Cooperative intake",
      actorName: "KNCU Intake Team",
      actorRole: "Cooperative",
      location: "KNCU Processing Centre, Moshi, Tanzania",
      at: base + 86_400_000 * 3,
      evidenceLabel: "Scale receipt — 2,840 kg",
      signatureHash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    },
    {
      stage: "processing",
      stageLabel: "Wet processing",
      actorName: "KNCU Wet Mill",
      actorRole: "Processor",
      location: "KNCU Wet Mill, Moshi, Tanzania",
      at: base + 86_400_000 * 5,
      evidenceLabel: "Grading report — Grade A",
    },
    {
      stage: "export_prep",
      stageLabel: "Export preparation",
      actorName: "TZ Ports Authority",
      actorRole: "Exporter",
      location: "Dar es Salaam Port, Tanzania",
      at: base + 86_400_000 * 8,
      evidenceLabel: "Phytosanitary certificate",
      signatureHash: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    },
    {
      stage: "in_transit",
      stageLabel: "In transit",
      actorName: "MV Zanzibar Star",
      actorRole: "Vessel",
      location: "Indian Ocean — bound for Rotterdam",
      at: base + 86_400_000 * 9,
    },
  ];
}

function mockDocuments(): DocumentRow[] {
  return [
    { name: "EUDR Declaration — EUDR-2024-TZ-00447", size: "142 KB", type: "PDF" },
    { name: "Phytosanitary Certificate", size: "89 KB", type: "PDF" },
    { name: "Quality Grading Report — Grade A", size: "211 KB", type: "PDF" },
  ];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BuyerTracePage({
  params,
}: {
  params: Promise<{ batchCode: string }>;
}) {
  const { batchCode } = await params;

  const batch = batches.find((b) => b.id === batchCode) ?? batches[0];
  const batchFarms = farms.filter((f) => batch.farmIds.includes(f.id));
  const farmerIds = [...new Set(batchFarms.map((f) => f.farmerId))];
  const batchFarmers = farmers.filter((f) => farmerIds.includes(f.id));

  const batchEvents = mockBatchEvents(batch.id);
  const documents = mockDocuments();

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

  const cropIcon = batch.cropType === "coffee" ? Coffee : Leaf;
  const CropIcon = cropIcon;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Header band ───────────────────────────────────────────────────── */}
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
                  {batch.id}
                </div>
                <div className="text-sm text-stone-300 mt-0.5">{batch.variety}</div>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start sm:self-auto ${statusPalette[batch.status]}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-current"
                aria-hidden="true"
              />
              {statusLabel[batch.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Section 1 — Summary KPIs ──────────────────────────────────── */}
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
            <div className="p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-1">
                Net weight
              </div>
              <div className="text-3xl font-mono font-semibold text-stone-900 tabular-nums">
                {batch.weightKg.toLocaleString()}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">kg</div>
            </div>
            <div className="p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-1">
                Origin
              </div>
              <div className="text-2xl font-semibold text-stone-900">
                Kilimanjaro
              </div>
              <div className="text-xs text-stone-500 mt-0.5">Tanzania, East Africa</div>
            </div>
            <div className="p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-1">
                Buyer
              </div>
              <div className="text-xl font-semibold text-stone-900 leading-snug">
                {batch.buyer}
              </div>
              <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                <Globe2 size={10} aria-hidden="true" />
                {batch.buyerCountry}
              </div>
            </div>
          </div>

          {/* EUDR badge */}
          {batch.eudrDeclarationId && (
            <div className="px-5 py-3 border-t border-stone-100 flex items-center gap-2 bg-emerald-50">
              <ShieldCheck size={16} className="text-emerald-700" aria-hidden="true" />
              <span className="text-xs font-medium text-emerald-800">
                EUDR Declaration filed
              </span>
              <span className="font-mono text-xs text-emerald-700 ml-1">
                {batch.eudrDeclarationId}
              </span>
            </div>
          )}
        </div>

        {/* ── Transit map ──────────────────────────────────────────────── */}
        <BatchTraceMap
          batchId={batch.id}
          className=""
        />

        {/* ── Section 2 — Origin farms (zero PII) ─────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            Origin farms
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {batchFarms.map((farm) => {
              const farmer = batchFarmers.find((f) => f.id === farm.farmerId);
              const farmerInitials = farmer ? toInitials(farmer.name) : "—";
              const eudrColor =
                farm.eudrCompliant
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200";

              return (
                <div
                  key={farm.id}
                  className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-stone-600" aria-hidden="true" />
                      </div>
                      <div>
                        {/* Initials only — no full name, no phone, no national ID */}
                        <div
                          className="font-mono font-semibold text-stone-900 text-sm"
                          title="Farmer identity withheld for privacy"
                        >
                          {farmerInitials}
                        </div>
                        <div className="text-xs text-stone-500">{farm.village}</div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${eudrColor}`}
                    >
                      <ShieldCheck size={10} aria-hidden="true" />
                      {farm.eudrCompliant ? "EUDR compliant" : "Pending"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Crop</span>
                      <span className="font-medium text-stone-800 capitalize">
                        {farm.cropType} · {farm.variety}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Area</span>
                      <span className="font-mono text-stone-800 tabular-nums">
                        {farm.areaHa} ha
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Farm ID</span>
                      <span className="font-mono text-xs text-stone-500">
                        {farm.id}
                      </span>
                    </div>
                    {farm.certifications.length > 0 && (
                      <div className="flex items-start justify-between gap-2 pt-1">
                        <span className="text-stone-500">Certifications</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {farm.certifications.map((c) => (
                            <span
                              key={c}
                              className="inline-block bg-stone-100 text-stone-700 rounded px-1.5 py-0.5 text-xs"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 3 — Chain of custody ────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">
            Chain of custody
          </h2>
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <ol aria-label="Chain of custody events">
              {batchEvents.map((event, i) => {
                const isLatest = i === batchEvents.length - 1;
                const StageIcon = STAGE_ICONS[event.stage] ?? Ship;
                return (
                  <li
                    key={event.stage}
                    className={`flex items-start gap-4 px-6 py-5 ${
                      isLatest ? "bg-emerald-50" : ""
                    } ${i > 0 ? "border-t border-stone-100" : ""}`}
                  >
                    {/* Timeline spine */}
                    <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isLatest
                            ? "bg-emerald-100"
                            : "bg-stone-100"
                        }`}
                      >
                        <StageIcon
                          size={16}
                          className={isLatest ? "text-emerald-700" : "text-stone-500"}
                          aria-hidden="true"
                        />
                      </div>
                      {i < batchEvents.length - 1 && (
                        <div className="w-px flex-1 bg-stone-200 mt-1 min-h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-stone-900 text-sm">
                            {event.stageLabel}
                          </div>
                          <div className="text-sm text-stone-600 mt-0.5">
                            {event.actorName}
                            <span className="text-stone-400 mx-1">·</span>
                            <span className="text-stone-500 text-xs">
                              {event.actorRole}
                            </span>
                          </div>
                          <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                            <MapPin size={10} aria-hidden="true" />
                            {event.location}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-mono text-stone-500 tabular-nums">
                            {formatDateTime(event.at)}
                          </div>
                        </div>
                      </div>

                      {event.evidenceLabel && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100 rounded-lg px-2.5 py-1">
                          <FileText size={11} aria-hidden="true" />
                          {event.evidenceLabel}
                        </div>
                      )}

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
        </div>

        {/* ── Section 4 — Receipt (SignatureButton) ───────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-2">Receipt</h2>
          <p className="text-sm text-stone-500 mb-4">
            Confirm receipt of this batch to close the traceability loop. Your
            signature is recorded permanently against this trace.
          </p>
          <SignatureButton batchCode={batch.id} />
        </div>

        {/* ── Section 5 — Documents ───────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Documents</h2>
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden divide-y divide-stone-100">
            {documents.map((doc) => (
              <div
                key={doc.name}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-stone-500" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-800 truncate">
                    {doc.name}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {doc.type} · {doc.size}
                  </div>
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

      {/* ── Footer band ─────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 mt-8 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs font-mono text-stone-500">
            Audited by Herb · Verified against trace{" "}
            <span className="text-stone-700">tr_{batch.id.toLowerCase()}</span>
          </p>
          <p className="text-xs text-stone-400">
            Last updated {formatDate(Date.now())} · Kilimanjaro, Tanzania
          </p>
        </div>
      </footer>
    </div>
  );
}
