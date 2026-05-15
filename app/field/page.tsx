"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  MapPin,
  User,
  Leaf,
  Coffee,
  Nut,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  Phone,
  Hash,
  Building2,
  Loader2,
} from "lucide-react";
import SyncBadge from "@/components/sync/SyncBadge";
import ConflictModal from "@/components/sync/ConflictModal";
import { useSyncQueue } from "@/lib/sync/useSyncQueue";
import { enqueue } from "@/lib/sync/queue";
import type { PolygonCaptureProps, GeoJSONPolygon } from "@/components/map/PolygonCapture";

const PolygonCapture = dynamic<PolygonCaptureProps>(
  () => import("@/components/map/PolygonCapture"),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[4/3] rounded-xl bg-stone-100 animate-pulse" />
    ),
  },
);

// ── Village centre lookup (lat/lng for PolygonCapture seed) ─────────────────
const VILLAGE_CENTRES: Record<string, { lat: number; lng: number }> = {
  kibosho: { lat: -3.2691, lng: 37.3311 },
  lyamungu: { lat: -3.2500, lng: 37.3450 },
  marangu: { lat: -3.2300, lng: 37.5200 },
  uru: { lat: -3.2100, lng: 37.2800 },
};
const DEFAULT_CENTRE = { lat: -3.2691, lng: 37.3311 };

function villageCenter(village: string): { lat: number; lng: number } {
  return VILLAGE_CENTRES[village.toLowerCase().trim()] ?? DEFAULT_CENTRE;
}

// Simple hash for deterministic polygon seed
function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── Types ───────────────────────────────────────────────────────────────────
type Step = 0 | 1 | 2 | 3;
type CropType = "coffee" | "avocado" | "macadamia";

interface FarmerForm {
  name: string;
  phone: string;
  nationalId: string;
  village: string;
  district: string;
  region: string;
}

interface CropForm {
  cropType: CropType | "";
  variety: string;
  estimatedArea: string;
  certifications: string[];
}

// ── Constants ───────────────────────────────────────────────────────────────
const COOP_CODE = "KNCU";
const COOP_NAME = "Kilimanjaro Native Cooperative Union";
const COOP_REGION = "Kilimanjaro";

const COFFEE_VARIETIES = ["Arabica SL28", "Arabica N39", "Arabica Kent", "Arabica Bourbon", "Robusta"];
const AVOCADO_VARIETIES = ["Hass", "Fuerte", "Reed", "Puebla"];
const MACADAMIA_VARIETIES = ["Beaumont", "NCRP 2", "NCRP 10", "A4", "816"];
const CERT_OPTIONS = ["UTZ Certified", "Rainforest Alliance", "Fair Trade", "GlobalG.A.P.", "Organic"];

function varietiesFor(crop: CropType | ""): string[] {
  if (crop === "coffee") return COFFEE_VARIETIES;
  if (crop === "avocado") return AVOCADO_VARIETIES;
  if (crop === "macadamia") return MACADAMIA_VARIETIES;
  return [];
}

// ── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 bg-white">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < current
                ? "bg-emerald-600 text-white"
                : i === current
                  ? "bg-emerald-700 text-white ring-2 ring-emerald-300 ring-offset-1"
                  : "bg-stone-200 text-stone-500"
            }`}
          >
            {i < current ? (
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
            ) : (
              i + 1
            )}
          </div>
          {i < total - 1 && (
            <div
              className={`h-0.5 w-8 ${i < current ? "bg-emerald-500" : "bg-stone-200"}`}
            />
          )}
        </div>
      ))}
      <div className="ml-2 text-xs text-stone-500 font-mono">
        {current + 1} / {total}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function FieldPage() {
  const syncStatus = useSyncQueue();

  // Load cooperative (KNCU) for cooperativeId
  const coop = useQuery(api.cooperatives.getByCode, { code: COOP_CODE });

  // Load all KNCU farmers for search (client-side filter)
  const allFarmers = useQuery(
    api.farmers.listByCoop,
    coop ? { cooperativeId: coop._id } : "skip",
  );

  // ── Local state ────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submittedFarmCode, setSubmittedFarmCode] = useState<string | null>(null);

  const [farmer, setFarmer] = useState<FarmerForm>({
    name: "",
    phone: "",
    nationalId: "",
    village: "",
    district: "",
    region: COOP_REGION,
  });

  const [crop, setCrop] = useState<CropForm>({
    cropType: "",
    variety: "",
    estimatedArea: "",
    certifications: [],
  });

  const [capturedPolygon, setCapturedPolygon] = useState<{
    type: "Polygon";
    coordinates: number[][][];
  } | null>(null);
  const [capturedAreaHa, setCapturedAreaHa] = useState<number | null>(null);

  // Farmer search: filter by typed name (≥ 2 chars)
  const farmerMatches =
    farmer.name.length >= 2 && allFarmers
      ? allFarmers.filter((f) =>
          f.fullName.toLowerCase().includes(farmer.name.toLowerCase()),
        )
      : [];

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!coop) return;
    setSubmitting(true);

    const ts = Date.now();
    const farmerCode = `F-tmp-${ts}`;
    const farmCode = `FM-tmp-${ts}`;

    // Convert GeoJSON ring to lat/lng objects for Convex
    const polygonInline = capturedPolygon
      ? capturedPolygon.coordinates[0].map(([lng, lat]) => ({ lat, lng }))
      : [];

    // Enqueue 3 mutations in dependency order.
    // The drain in useSyncQueue threads IDs through after each succeeds.
    await enqueue("farmer.create", {
      farmerCode,
      cooperativeId: coop._id as string,
      fullName: farmer.name,
      phone: farmer.phone,
      nationalId: farmer.nationalId || `TZ-${ts}`,
      village: farmer.village,
      district: farmer.district,
      region: farmer.region,
    });

    await enqueue("farm.create", {
      farmCode,
      farmerCode,
      crop: (crop.cropType || "coffee") as CropType,
      variety: crop.variety,
      estimatedAreaHa: parseFloat(crop.estimatedArea) || capturedAreaHa || 0,
      certifications: crop.certifications,
    });

    if (polygonInline.length > 0) {
      await enqueue("farm.attachPolygon", {
        farmCode,
        polygonInline,
        areaHa: capturedAreaHa ?? 0,
      });
    }

    setSubmitting(false);
    setSubmittedFarmCode(farmCode);
  }, [coop, farmer, crop, capturedPolygon, capturedAreaHa]);

  function resetForm() {
    setSubmittedFarmCode(null);
    setStep(0);
    setFarmer({ name: "", phone: "", nationalId: "", village: "", district: "", region: COOP_REGION });
    setCrop({ cropType: "", variety: "", estimatedArea: "", certifications: [] });
    setCapturedPolygon(null);
    setCapturedAreaHa(null);
  }

  // ── Confirmation screen ────────────────────────────────────────────────
  if (submittedFarmCode) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        {syncStatus.conflict && (
          <ConflictModal
            conflict={syncStatus.conflict}
            onSkip={() => syncStatus.resolveConflict("skip", syncStatus.conflict!.id)}
            onRetry={() => syncStatus.resolveConflict("retry", syncStatus.conflict!.id)}
          />
        )}
        <div className="px-4 pt-3">
          <SyncBadge status={syncStatus} />
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2
                className="w-10 h-10 text-emerald-600"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-2xl font-semibold text-stone-900 mb-2">
              Farm registered
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              <strong className="text-stone-700">{farmer.name}</strong>&apos;s{" "}
              {crop.cropType || "farm"} plot is queued for sync.
            </p>
            <div className="rounded-xl bg-stone-100 p-4 text-left mb-6 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Farm ID</span>
                <span className="font-mono font-semibold text-stone-800 text-xs">
                  {submittedFarmCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Verification</span>
                <span className="text-amber-600 font-medium">Pending</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">EUDR status</span>
                <span className="text-stone-500">Awaiting polygon review</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Boundary</span>
                {capturedAreaHa !== null ? (
                  <span className="font-mono text-stone-800">
                    {capturedAreaHa.toFixed(2)} ha · 12 pts
                  </span>
                ) : (
                  <span className="text-stone-400">Not recorded</span>
                )}
              </div>
            </div>
            <button
              onClick={resetForm}
              className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
            >
              Register another farm
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {syncStatus.conflict && (
        <ConflictModal
          conflict={syncStatus.conflict}
          onSkip={() => syncStatus.resolveConflict("skip", syncStatus.conflict!.id)}
          onRetry={() => syncStatus.resolveConflict("retry", syncStatus.conflict!.id)}
        />
      )}
      <div className="px-4 pt-3">
        <SyncBadge status={syncStatus} />
      </div>

      <div className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-stone-900">
            Farm Registration
          </h1>
          <p className="text-xs text-stone-500">{COOP_NAME}</p>
        </div>
      </div>

      <StepIndicator current={step} total={4} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-4 pb-28">

          {/* ── Step 0: Farmer ─────────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-stone-900">Farmer details</h2>
                    <p className="text-xs text-stone-500">Search existing or register new</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="farmer-name"
                      className="block text-sm font-medium text-stone-800 mb-1.5"
                    >
                      Full name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                        aria-hidden="true"
                      />
                      <input
                        id="farmer-name"
                        type="text"
                        placeholder="e.g. Amina Wanjiku Mbeki"
                        value={farmer.name}
                        onChange={(e) =>
                          setFarmer({ ...farmer, name: e.target.value })
                        }
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-300 text-sm bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 min-h-12"
                      />
                    </div>
                  </div>

                  {/* Existing-farmer match chip */}
                  {farmerMatches.length > 0 && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 space-y-2">
                      <p className="text-xs font-medium text-emerald-800">
                        Existing farmers found
                      </p>
                      {farmerMatches.slice(0, 3).map((f) => (
                        <button
                          key={f._id}
                          onClick={() =>
                            setFarmer({
                              name: f.fullName,
                              phone: f.phone,
                              nationalId: f.nationalId,
                              village: f.village,
                              district: f.district,
                              region: f.region ?? COOP_REGION,
                            })
                          }
                          className="w-full flex items-start gap-2 text-left hover:bg-emerald-100 rounded-lg p-2 transition"
                        >
                          <CheckCircle2
                            className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <div>
                            <span className="text-sm font-medium text-emerald-900">
                              {f.fullName}
                            </span>
                            <span className="text-xs text-emerald-600 ml-2">
                              · {f.code} · {f.village}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="farmer-phone"
                      className="block text-sm font-medium text-stone-800 mb-1.5"
                    >
                      Phone number
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                        aria-hidden="true"
                      />
                      <input
                        id="farmer-phone"
                        type="tel"
                        placeholder="+255 712 345 678"
                        value={farmer.phone}
                        onChange={(e) =>
                          setFarmer({ ...farmer, phone: e.target.value })
                        }
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-300 text-sm bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 min-h-12"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="farmer-nid"
                      className="block text-sm font-medium text-stone-800 mb-1.5"
                    >
                      National ID
                    </label>
                    <div className="relative">
                      <Hash
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                        aria-hidden="true"
                      />
                      <input
                        id="farmer-nid"
                        type="text"
                        placeholder="TZ-YYYYMMDD-XXX"
                        value={farmer.nationalId}
                        onChange={(e) =>
                          setFarmer({ ...farmer, nationalId: e.target.value })
                        }
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-300 text-sm font-mono bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 min-h-12"
                      />
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      Leave blank to auto-assign on verification
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="farmer-village"
                        className="block text-sm font-medium text-stone-800 mb-1.5"
                      >
                        Village
                      </label>
                      <div className="relative">
                        <MapPin
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                          aria-hidden="true"
                        />
                        <input
                          id="farmer-village"
                          type="text"
                          placeholder="e.g. Kibosho"
                          value={farmer.village}
                          onChange={(e) =>
                            setFarmer({ ...farmer, village: e.target.value })
                          }
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-stone-300 text-sm bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 min-h-12"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="farmer-district"
                        className="block text-sm font-medium text-stone-800 mb-1.5"
                      >
                        District
                      </label>
                      <input
                        id="farmer-district"
                        type="text"
                        placeholder="e.g. Moshi Rural"
                        value={farmer.district}
                        onChange={(e) =>
                          setFarmer({ ...farmer, district: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 min-h-12"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="farmer-coop"
                      className="block text-sm font-medium text-stone-800 mb-1.5"
                    >
                      Cooperative
                    </label>
                    <div className="relative">
                      <Building2
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                        aria-hidden="true"
                      />
                      <div
                        id="farmer-coop"
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 text-sm bg-stone-50 text-stone-700 min-h-12 flex items-center"
                      >
                        {coop ? coop.name : (
                          <span className="text-stone-400">Loading…</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Crop profile ────────────────────────────────────── */}
          {step === 1 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-amber-600" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-900">Crop profile</h2>
                  <p className="text-xs text-stone-500">
                    What is grown on this farm plot?
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-stone-800 mb-2">
                      Crop type
                    </legend>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { type: "coffee", icon: Coffee, sub: "Arabica · Robusta" },
                          { type: "avocado", icon: Leaf, sub: "Hass · Fuerte" },
                          { type: "macadamia", icon: Nut, sub: "Beaumont · A4" },
                        ] as const
                      ).map(({ type, icon: Icon, sub }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setCrop({ ...crop, cropType: type, variety: "" })
                          }
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 ${
                            crop.cropType === type
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${crop.cropType === type ? "text-emerald-600" : "text-stone-400"}`}
                            aria-hidden="true"
                          />
                          <span
                            className={`text-xs font-semibold capitalize ${crop.cropType === type ? "text-emerald-700" : "text-stone-700"}`}
                          >
                            {type}
                          </span>
                          <span className="text-[10px] text-stone-400">{sub}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {crop.cropType && (
                  <>
                    <div>
                      <label
                        htmlFor="crop-variety"
                        className="block text-sm font-medium text-stone-800 mb-1.5"
                      >
                        Variety
                      </label>
                      <select
                        id="crop-variety"
                        value={crop.variety}
                        onChange={(e) =>
                          setCrop({ ...crop, variety: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 min-h-12"
                      >
                        <option value="">Select variety</option>
                        {varietiesFor(crop.cropType).map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="crop-area"
                        className="block text-sm font-medium text-stone-800 mb-1.5"
                      >
                        Estimated area (ha)
                      </label>
                      <input
                        id="crop-area"
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="e.g. 0.8"
                        value={crop.estimatedArea}
                        onChange={(e) =>
                          setCrop({ ...crop, estimatedArea: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 min-h-12"
                      />
                      <p className="text-xs text-stone-600 mt-1">
                        Confirmed by polygon capture in the next step
                      </p>
                    </div>

                    <fieldset>
                      <legend className="block text-sm font-medium text-stone-800 mb-2">
                        Existing certifications
                      </legend>
                      <div className="flex flex-wrap gap-2">
                        {CERT_OPTIONS.map((cert) => (
                          <button
                            key={cert}
                            type="button"
                            onClick={() => {
                              const has = crop.certifications.includes(cert);
                              setCrop({
                                ...crop,
                                certifications: has
                                  ? crop.certifications.filter((c) => c !== cert)
                                  : [...crop.certifications, cert],
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 ${
                              crop.certifications.includes(cert)
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-stone-600 border-stone-300 hover:border-stone-400"
                            }`}
                          >
                            {cert}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Farm boundary ───────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                <div className="p-5 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <MapPin
                        className="w-5 h-5 text-emerald-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h2 className="font-semibold text-stone-900">Farm boundary</h2>
                      <p className="text-xs text-stone-500">
                        Walk the perimeter to record the polygon
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <PolygonCapture
                    villageCenter={villageCenter(farmer.village)}
                    seed={strHash(farmer.name + farmer.village)}
                    mode="simulated"
                    onComplete={(geojson: GeoJSONPolygon, areaHa: number) => {
                      setCapturedPolygon(geojson);
                      setCapturedAreaHa(areaHa);
                    }}
                  />
                </div>

                {capturedPolygon && (
                  <div className="mx-4 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-emerald-800">
                        Boundary recorded —{" "}
                        <span className="font-mono tabular-nums">
                          {capturedAreaHa?.toFixed(2)} ha
                        </span>{" "}
                        · 12 points
                      </span>
                    </div>
                  </div>
                )}

                <div className="mx-4 mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <AlertCircle
                    className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-amber-700">
                    Walk slowly along the farm boundary. Capture works offline —
                    points are stored locally and uploaded when signal returns.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Review & submit ─────────────────────────────────── */}
          {step === 3 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                  <Upload
                    className="w-5 h-5 text-stone-600"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="font-semibold text-stone-900">Review &amp; submit</h2>
                  <p className="text-xs text-stone-500">
                    Confirm before queueing for verification
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Farmer */}
                <div className="rounded-xl bg-stone-50 p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3">
                    Farmer
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-stone-500">Name</span>
                    <span className="font-medium text-stone-900">
                      {farmer.name || "—"}
                    </span>
                    <span className="text-stone-500">Phone</span>
                    <span className="font-medium text-stone-900 font-mono text-xs">
                      {farmer.phone || "—"}
                    </span>
                    <span className="text-stone-500">Village</span>
                    <span className="font-medium text-stone-900">
                      {farmer.village || "—"}
                    </span>
                    <span className="text-stone-500">Cooperative</span>
                    <span className="font-medium text-stone-900 text-xs">
                      {coop?.name ?? COOP_NAME}
                    </span>
                  </div>
                </div>

                {/* Crop */}
                <div className="rounded-xl bg-stone-50 p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3">
                    Crop
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-stone-500">Type</span>
                    <span className="font-medium text-stone-900 capitalize">
                      {crop.cropType || "—"}
                    </span>
                    <span className="text-stone-500">Variety</span>
                    <span className="font-medium text-stone-900">
                      {crop.variety || "—"}
                    </span>
                    <span className="text-stone-500">Estimated area</span>
                    <span className="font-mono tabular-nums text-stone-900">
                      {crop.estimatedArea ? `${crop.estimatedArea} ha` : "—"}
                    </span>
                  </div>
                  {crop.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {crop.certifications.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Boundary */}
                <div className="rounded-xl bg-stone-50 p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-stone-500 mb-3">
                    Farm boundary
                  </div>
                  <div className="flex items-center gap-2">
                    {capturedPolygon ? (
                      <>
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-500"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-emerald-700">
                          Recorded ·{" "}
                          <span className="font-mono tabular-nums">
                            {capturedAreaHa?.toFixed(2)} ha
                          </span>{" "}
                          · 12 points
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle
                          className="w-4 h-4 text-amber-500"
                          aria-hidden="true"
                        />
                        <span className="text-sm text-amber-700">
                          Not recorded — verification will be delayed
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* What happens next */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-700 mb-2">
                    What happens next
                  </div>
                  <ul className="space-y-1.5">
                    {[
                      "Record saved locally and queued for sync",
                      "Cooperative reviews polygon on dashboard",
                      "Deforestation cross-check runs automatically",
                      "Farmer receives SMS with verification status",
                      "Eligible for batch inclusion once verified",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs text-emerald-800"
                      >
                        <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Sticky stepper ─────────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-stone-50 border-t border-stone-200 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-stone-300 bg-white text-stone-700 font-medium text-sm hover:bg-stone-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
            >
              {["Farmer", "Crop", "Map", "Submit"][step + 1]}
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !coop}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
            >
              {submitting ? (
                <>
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  Queuing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  Submit registration
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
