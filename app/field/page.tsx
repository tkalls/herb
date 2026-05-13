"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  User,
  Leaf,
  Coffee,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  Phone,
  Hash,
  Building2,
} from "lucide-react";
import SyncBadge from "@/components/sync/SyncBadge";
import type { SyncStatus } from "@/lib/sync/useSyncQueue";

const PolygonCapture = dynamic(
  () => import("@/components/map/PolygonCapture"),
  { ssr: false, loading: () => <div className="aspect-[4/3] rounded-xl bg-stone-100 animate-pulse" /> },
);

// Phase 2: swap this for useSyncQueue once Lane 1 installs dexie
function useSyncStatus(): SyncStatus {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return { online, queued: 0, draining: false, lastError: null };
}

type Step = 0 | 1 | 2 | 3;

interface FarmerForm {
  name: string;
  phone: string;
  nationalId: string;
  village: string;
  district: string;
  cooperative: string;
}

interface CropForm {
  cropType: "coffee" | "avocado" | "";
  variety: string;
  estimatedArea: string;
  certifications: string[];
  existingPlots: string;
}

const cooperatives = [
  "Kilimanjaro Native Cooperative Union (KNCU)",
  "Mbinga Coffee Cooperative",
  "Mbeya Coffee Cooperative",
  "Arusha Coffee Cooperative",
  "Other",
];

const coffeeVarieties = ["Arabica SL28", "Arabica N39", "Arabica Kent", "Arabica Bourbon", "Robusta", "Other"];
const avocadoVarieties = ["Hass", "Fuerte", "Reed", "Puebla", "Other"];
const certOptions = ["UTZ Certified", "Rainforest Alliance", "Fair Trade", "GlobalG.A.P.", "Organic", "None"];

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
            {i < current ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 ${i < current ? "bg-emerald-500" : "bg-stone-200"}`} />
          )}
        </div>
      ))}
      <div className="ml-2 text-xs text-stone-500">
        Step {current + 1} of {total}
      </div>
    </div>
  );
}

export default function FieldPage() {
  const syncStatus = useSyncStatus();
  const [step, setStep] = useState<Step>(0);
  const [submitted, setSubmitted] = useState(false);
  const [capturedPolygon, setCapturedPolygon] = useState<{ type: "Polygon"; coordinates: number[][][] } | null>(null);
  const [capturedAreaHa, setCapturedAreaHa] = useState<number | null>(null);

  const [farmer, setFarmer] = useState<FarmerForm>({
    name: "",
    phone: "",
    nationalId: "",
    village: "",
    district: "",
    cooperative: "",
  });

  const [crop, setCrop] = useState<CropForm>({
    cropType: "",
    variety: "",
    estimatedArea: "",
    certifications: [],
    existingPlots: "",
  });

  function handleSubmit() {
    setSubmitted(true);
  }

  const stepLabels = ["Farmer", "Crop", "Map", "Submit"];

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <div className="px-4 pt-3"><SyncBadge status={syncStatus} /></div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-2">Farm Registered</h2>
            <p className="text-stone-500 mb-6">
              <strong className="text-stone-700">{farmer.name || "Farmer"}</strong>&apos;s {crop.cropType || "farm"} plot has
              been saved locally and queued for sync.
            </p>
            <div className="bg-stone-100 rounded-xl p-4 text-left mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Farm ID</span>
                <span className="font-mono font-semibold text-stone-800">FM{Date.now().toString().slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Verification</span>
                <span className="text-amber-600 font-medium">Pending</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">EUDR Status</span>
                <span className="text-stone-500">Awaiting polygon review</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Sync</span>
                <span className="text-emerald-600 font-medium">Queued ✓</span>
              </div>
            </div>
            <button
              onClick={() => { setSubmitted(false); setStep(0); setFarmer({ name: "", phone: "", nationalId: "", village: "", district: "", cooperative: "" }); setCrop({ cropType: "", variety: "", estimatedArea: "", certifications: [], existingPlots: "" }); setCapturedPolygon(null); setCapturedAreaHa(null); }}
              className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
            >
              Register Another Farm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <div className="px-4 pt-3"><SyncBadge status={syncStatus} /></div>

      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-stone-900">Farm Registration</h1>
          <p className="text-sm text-stone-500">Kilimanjaro Native Cooperative Union</p>
        </div>
      </div>

      <StepIndicator current={step} total={4} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">

          {/* Step 0: Farmer Registration */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-stone-900">Farmer Details</h2>
                    <p className="text-xs text-stone-500">Search existing or register new</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        placeholder="e.g. Amina Wanjiku Mbeki"
                        value={farmer.name}
                        onChange={(e) => setFarmer({ ...farmer, name: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="tel"
                        placeholder="+255 7XX XXX XXX"
                        value={farmer.phone}
                        onChange={(e) => setFarmer({ ...farmer, phone: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">National ID</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        placeholder="TZ-YYYYMMDD-XXX"
                        value={farmer.nationalId}
                        onChange={(e) => setFarmer({ ...farmer, nationalId: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">Village</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type="text"
                          placeholder="e.g. Kibosho"
                          value={farmer.village}
                          onChange={(e) => setFarmer({ ...farmer, village: e.target.value })}
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">District</label>
                      <input
                        type="text"
                        placeholder="e.g. Moshi Rural"
                        value={farmer.district}
                        onChange={(e) => setFarmer({ ...farmer, district: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Cooperative</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <select
                        value={farmer.cooperative}
                        onChange={(e) => setFarmer({ ...farmer, cooperative: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white appearance-none"
                      >
                        <option value="">Select cooperative</option>
                        {cooperatives.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing farmer suggestion */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">Existing Farmer Found</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Amina Wanjiku Mbeki · F001 · Kibosho · 2 farms registered
                    </p>
                    <button className="text-xs font-semibold text-emerald-700 mt-1 underline">
                      Load existing record →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Crop Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-stone-900">Crop Profile</h2>
                    <p className="text-xs text-stone-500">What is grown on this farm plot?</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Crop type toggle */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Crop Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["coffee", "avocado"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setCrop({ ...crop, cropType: type, variety: "" })}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            crop.cropType === type
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          {type === "coffee" ? (
                            <Coffee className={`w-6 h-6 ${crop.cropType === type ? "text-emerald-600" : "text-stone-400"}`} />
                          ) : (
                            <Leaf className={`w-6 h-6 ${crop.cropType === type ? "text-emerald-600" : "text-stone-400"}`} />
                          )}
                          <div className="text-left">
                            <div className={`text-sm font-semibold capitalize ${crop.cropType === type ? "text-emerald-700" : "text-stone-700"}`}>
                              {type}
                            </div>
                            <div className="text-xs text-stone-400">
                              {type === "coffee" ? "Arabica / Robusta" : "Hass / Fuerte"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {crop.cropType && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">Variety</label>
                        <select
                          value={crop.variety}
                          onChange={(e) => setCrop({ ...crop, variety: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="">Select variety</option>
                          {(crop.cropType === "coffee" ? coffeeVarieties : avocadoVarieties).map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">
                          Estimated Area (hectares)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="e.g. 1.5"
                          value={crop.estimatedArea}
                          onChange={(e) => setCrop({ ...crop, estimatedArea: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <p className="text-xs text-stone-400 mt-1">Will be confirmed by GPS polygon capture in the next step</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Existing Certifications
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {certOptions.map((cert) => (
                            <button
                              key={cert}
                              onClick={() => {
                                const has = crop.certifications.includes(cert);
                                setCrop({
                                  ...crop,
                                  certifications: has
                                    ? crop.certifications.filter((c) => c !== cert)
                                    : [...crop.certifications, cert],
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                crop.certifications.includes(cert)
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-white text-stone-600 border-stone-300 hover:border-stone-400"
                              }`}
                            >
                              {cert}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Farm Boundary */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="p-5 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-stone-900">Farm Boundary</h2>
                      <p className="text-xs text-stone-500">Walk the perimeter to record the polygon</p>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <PolygonCapture
                    villageCenter={{ lat: -3.2691, lng: 37.3311 }}
                    seed={Date.now() % 1000}
                    mode="simulated"
                    onComplete={(geojson, areaHa) => {
                      setCapturedPolygon(geojson);
                      setCapturedAreaHa(areaHa);
                    }}
                  />
                </div>

                {capturedPolygon && (
                  <div className="mx-4 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      <span className="text-sm font-medium text-emerald-800">
                        Boundary recorded —{" "}
                        <span className="font-mono tabular-nums">
                          {capturedAreaHa?.toFixed(2)} ha
                        </span>
                        {" · "}12 points
                      </span>
                    </div>
                  </div>
                )}

                <div className="mx-4 mb-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-amber-700">
                    Walk slowly along the farm boundary. Capture works offline — points are stored
                    locally and uploaded when signal returns.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
                    <Upload className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-stone-900">Review & Submit</h2>
                    <p className="text-xs text-stone-500">Confirm before queueing for verification</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Farmer summary */}
                  <div className="rounded-xl bg-stone-50 p-4 space-y-2">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Farmer</div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-stone-500">Name</span>
                      <span className="font-medium text-stone-800">{farmer.name || "—"}</span>
                      <span className="text-stone-500">Phone</span>
                      <span className="font-medium text-stone-800">{farmer.phone || "—"}</span>
                      <span className="text-stone-500">Village</span>
                      <span className="font-medium text-stone-800">{farmer.village || "—"}</span>
                      <span className="text-stone-500">Cooperative</span>
                      <span className="font-medium text-stone-800 text-xs">{farmer.cooperative || "—"}</span>
                    </div>
                  </div>

                  {/* Crop summary */}
                  <div className="rounded-xl bg-stone-50 p-4 space-y-2">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Crop</div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="text-stone-500">Type</span>
                      <span className="font-medium text-stone-800 capitalize">{crop.cropType || "—"}</span>
                      <span className="text-stone-500">Variety</span>
                      <span className="font-medium text-stone-800">{crop.variety || "—"}</span>
                      <span className="text-stone-500">Est. Area</span>
                      <span className="font-medium text-stone-800">{crop.estimatedArea ? `${crop.estimatedArea} ha` : "—"}</span>
                    </div>
                    {crop.certifications.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {crop.certifications.map((c) => (
                          <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GPS summary */}
                  <div className="rounded-xl bg-stone-50 p-4">
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Farm Boundary</div>
                    <div className="flex items-center gap-2">
                      {capturedPolygon ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                          <span className="text-sm text-emerald-700 font-medium">
                            Recorded ·{" "}
                            <span className="font-mono tabular-nums">{capturedAreaHa?.toFixed(2)} ha</span>
                            {" · "}12 points
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-500" aria-hidden="true" />
                          <span className="text-sm text-amber-700">Not recorded — verification will be delayed</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* What happens next */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">What Happens Next</div>
                    <ul className="space-y-1.5">
                      {[
                        "Record saved locally and queued for sync",
                        "Cooperative reviews polygon on dashboard",
                        "Deforestation cross-check runs automatically",
                        "Farmer receives SMS with verification status",
                        "Eligible for batch inclusion once verified",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs text-emerald-800">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 bg-white border-t border-stone-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-stone-300 text-stone-700 font-medium text-sm hover:bg-stone-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-colors"
            >
              {stepLabels[step + 1]}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Submit Farm Registration
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
