"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Package,
  MapPin,
  Users,
  Shield,
  Coffee,
  Leaf,
  Globe,
  ArrowUpRight,
  Filter,
  Download,
  RefreshCw,
} from "lucide-react";
import { statusConfig, batchStatusConfig, type VerificationStatus } from "@/lib/data";

function ComplianceGauge({ score, label }: { score: number; label: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e7e5e4" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-stone-900">{score}</span>
          <span className="text-xs text-stone-400">/ 100</span>
        </div>
      </div>
      <div className="text-sm font-medium text-stone-600 mt-2 text-center">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full bg-stone-100 rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const cropFilter = ["all", "coffee", "avocado"] as const;

export default function DashboardPage() {
  const [activeCrop, setActiveCrop] = useState<"all" | "coffee" | "avocado">("all");
  const [activeTab, setActiveTab] = useState<"overview" | "farms" | "batches" | "buyers">("overview");

  // ── Convex queries ───────────────────────────────────────────────────────────
  const coopDoc = useQuery(api.cooperatives.getByCode, { code: "KNCU" });
  const coopId = coopDoc?._id;
  const rawFarmers = useQuery(api.farmers.listByCoop, coopId ? { cooperativeId: coopId } : "skip");
  const rawFarms = useQuery(api.farms.listByCoop, coopId ? { cooperativeId: coopId } : "skip");
  const rawBatches = useQuery(api.batches.listByCoop, coopId ? { cooperativeId: coopId } : "skip");

  const isLoading = !coopDoc || !rawFarmers || !rawFarms || !rawBatches;

  // ── Transform to UI shapes ───────────────────────────────────────────────────
  const farmerById = useMemo(() => {
    const m = new Map<string, { name: string; village: string }>();
    rawFarmers?.forEach((f) => m.set(f._id, { name: f.fullName, village: f.village }));
    return m;
  }, [rawFarmers]);

  const farms = useMemo(() => {
    if (!rawFarms) return [];
    return rawFarms
      .filter((f) => f.crop === "coffee" || f.crop === "avocado")
      .map((f) => {
        const farmer = farmerById.get(f.farmerId as string);
        return {
          id: f.code,
          farmerId: f.farmerId as string,
          farmerName: farmer?.name ?? "—",
          cropType: f.crop as "coffee" | "avocado",
          variety: f.variety,
          areaHa: f.estimatedAreaHa,
          verificationStatus: f.verificationStatus as VerificationStatus,
          eudrCompliant: f.eudrCompliant,
          deforestationRisk: (f.deforestationRisk === "none" ? "low" : f.deforestationRisk) as "low" | "medium" | "high",
          lastSynced: new Date(f.lastSyncedAt).toISOString(),
          village: farmer?.village ?? "—",
          district: coopDoc?.district ?? "—",
          region: coopDoc?.region ?? "—",
          certifications: f.certifications,
          notes: f.notes,
        };
      });
  }, [rawFarms, farmerById, coopDoc]);

  const batches = useMemo(() => {
    if (!rawBatches || !rawFarms) return [];
    const farmMap = new Map(rawFarms.map((f) => [f._id as string, f.farmerId as string]));
    return rawBatches
      .filter((b) => b.crop === "coffee" || b.crop === "avocado")
      .map((b) => {
        const uniqueFarmerIds = new Set(b.farmIds.map((fid) => farmMap.get(fid as string)).filter(Boolean));
        return {
          id: b.code,
          farmIds: b.farmIds as string[],
          farmerCount: uniqueFarmerIds.size || b.farmIds.length,
          cropType: b.crop as "coffee" | "avocado",
          variety: b.description,
          processingDate: new Date(b._creationTime).toISOString().split("T")[0],
          exportReadiness: b.exportReadiness,
          traceabilityScore: b.traceScore,
          buyer: b.buyerName,
          buyerCountry: b.buyerCountry,
          weightKg: b.weightKg,
          status: b.status as "preparing" | "ready" | "in_transit" | "delivered",
          eudrDeclarationId: b.eudrDeclarationId,
        };
      });
  }, [rawBatches, rawFarms]);

  const cooperative = useMemo(() => {
    if (!coopDoc) return null;
    const eudrCompliantCount = farms.filter((f) => f.eudrCompliant).length;
    const avgScore = rawFarms && rawFarms.length > 0
      ? Math.round(rawFarms.reduce((s, f) => s + f.eudrScore, 0) / rawFarms.length)
      : 0;
    return {
      id: coopDoc._id as string,
      name: coopDoc.name,
      shortName: coopDoc.code,
      region: coopDoc.region,
      district: coopDoc.district,
      country: coopDoc.country,
      farmerCount: rawFarmers?.length ?? 0,
      farmCount: farms.length,
      totalAreaHa: parseFloat(farms.reduce((s, f) => s + f.areaHa, 0).toFixed(1)),
      complianceScore: avgScore,
      eudrReadiness: farms.length > 0 ? Math.round((eudrCompliantCount / farms.length) * 100) : 0,
      verifiedFarms: farms.filter((f) => f.verificationStatus === "verified").length,
      pendingFarms: farms.filter((f) => f.verificationStatus === "pending").length,
      needsReviewFarms: farms.filter((f) => f.verificationStatus === "needs_review").length,
      unverifiedFarms: farms.filter((f) => f.verificationStatus === "unverified").length,
      activeBatches: batches.filter((b) => b.status !== "delivered").length,
      primaryCrops: ["coffee", "avocado"] as const,
    };
  }, [coopDoc, farms, batches, rawFarms, rawFarmers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Loading…</div>
      </div>
    );
  }
  if (!cooperative) return null;

  // ── Derived UI values ────────────────────────────────────────────────────────
  const filteredFarms = farms.filter((f) => activeCrop === "all" || f.cropType === activeCrop);
  const filteredBatches = batches.filter((b) => activeCrop === "all" || b.cropType === activeCrop);

  const verifiedCount = cooperative.verifiedFarms;
  const pendingCount = cooperative.pendingFarms;
  const reviewCount = cooperative.needsReviewFarms;
  const unverifiedCount = cooperative.unverifiedFarms;
  const eudrCount = farms.filter((f) => f.eudrCompliant).length;
  const totalArea = cooperative.totalAreaHa.toString();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  {cooperative.district} · {cooperative.region} · {cooperative.country}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-stone-900">{cooperative.name}</h1>
              <p className="text-sm text-stone-500 mt-0.5">
                {cooperative.shortName} · {cooperative.farmerCount.toLocaleString()} farmers ·{" "}
                {cooperative.farmCount.toLocaleString()} farms · {cooperative.totalAreaHa.toLocaleString()} ha
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Dashboard
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 text-sm hover:bg-stone-50 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-600 text-sm hover:bg-stone-50 transition-colors">
                <RefreshCw className="w-4 h-4" />
                Sync
              </button>
            </div>
          </div>

          {/* Crop filter tabs */}
          <div className="flex items-center gap-1 border-t border-stone-100 pt-2 pb-0">
            {cropFilter.map((f) => (
              <button
                key={f}
                onClick={() => setActiveCrop(f)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${
                  activeCrop === f
                    ? "bg-stone-50 text-stone-900 border-b-2 border-emerald-600"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {f === "all" ? "All Crops" : f === "coffee" ? "☕ Coffee" : "🥑 Avocado"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-white border-b border-stone-200 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {(["overview", "farms", "batches", "buyers"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-stone-500 hover:text-stone-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Farms (demo)", value: farms.length, sub: `${totalArea} ha mapped`, icon: MapPin, color: "text-stone-700", bg: "bg-stone-100" },
                { label: "Verified", value: verifiedCount, sub: `${Math.round((verifiedCount / farms.length) * 100)}% of registered`, icon: CheckCircle, color: "text-emerald-700", bg: "bg-emerald-50" },
                { label: "EUDR Compliant", value: eudrCount, sub: `${farms.length - eudrCount} farms need action`, icon: Shield, color: "text-blue-700", bg: "bg-blue-50" },
                { label: "Active Batches", value: cooperative.activeBatches, sub: "pending + in transit", icon: Package, color: "text-amber-700", bg: "bg-amber-50" },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} style={{ width: "18px", height: "18px" }} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-stone-900 mb-0.5">{kpi.value}</div>
                  <div className="text-sm font-medium text-stone-600">{kpi.label}</div>
                  <div className="text-xs text-stone-400 mt-1">{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Compliance gauges + verification breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <h3 className="font-semibold text-stone-900 mb-6">Compliance Scores</h3>
                <div className="flex justify-around">
                  <ComplianceGauge score={cooperative.complianceScore} label="Overall" />
                  <ComplianceGauge score={cooperative.eudrReadiness} label="EUDR Ready" />
                </div>
                <div className="mt-6 pt-5 border-t border-stone-100 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Documentation</span>
                    <div className="flex items-center gap-2">
                      <ScoreBar value={82} />
                      <span className="font-mono text-stone-700 w-8 text-right text-xs">82%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">GPS Coverage</span>
                    <div className="flex items-center gap-2">
                      <ScoreBar value={74} />
                      <span className="font-mono text-stone-700 w-8 text-right text-xs">74%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Deforestation Check</span>
                    <div className="flex items-center gap-2">
                      <ScoreBar value={91} />
                      <span className="font-mono text-stone-700 w-8 text-right text-xs">91%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500">Certification</span>
                    <div className="flex items-center gap-2">
                      <ScoreBar value={58} />
                      <span className="font-mono text-stone-700 w-8 text-right text-xs">58%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <h3 className="font-semibold text-stone-900 mb-4">Farm Verification Status</h3>
                <div className="space-y-3 mb-6">
                  {[
                    { label: "Verified", count: cooperative.verifiedFarms, total: cooperative.farmCount, color: "bg-emerald-500", text: "text-emerald-700" },
                    { label: "Pending Review", count: cooperative.pendingFarms, total: cooperative.farmCount, color: "bg-amber-500", text: "text-amber-700" },
                    { label: "Needs Action", count: cooperative.needsReviewFarms, total: cooperative.farmCount, color: "bg-red-500", text: "text-red-700" },
                    { label: "Unverified", count: cooperative.unverifiedFarms, total: cooperative.farmCount, color: "bg-stone-400", text: "text-stone-600" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-stone-600">{row.label}</span>
                        <span className={`font-semibold ${row.text}`}>
                          {row.count.toLocaleString()}
                          <span className="text-stone-400 font-normal ml-1">
                            ({Math.round((row.count / row.total) * 100)}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2">
                        <div
                          className={`${row.color} h-2 rounded-full`}
                          style={{ width: `${(row.count / row.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* EUDR action needed */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-900 text-sm">EUDR Compliance Gap</div>
                      <div className="text-sm text-amber-800 mt-1">
                        <strong>{cooperative.farmCount - Math.round(cooperative.farmCount * cooperative.eudrReadiness / 100)}</strong> farms
                        ({100 - cooperative.eudrReadiness}%) are not yet EUDR-compliant. At current rate,
                        85% readiness will be reached by November 2025 — cutting it close for the December deadline.
                      </div>
                      <button className="mt-2 text-xs font-semibold text-amber-700 underline">
                        View remediation plan →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent batches summary */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="font-semibold text-stone-900">Active Export Batches</h3>
                <button
                  onClick={() => setActiveTab("batches")}
                  className="text-sm text-emerald-700 font-medium flex items-center gap-1 hover:text-emerald-800"
                >
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-stone-100">
                {batches.slice(0, 3).map((batch) => {
                  const bsCfg = batchStatusConfig[batch.status];
                  return (
                    <div key={batch.id} className="px-6 py-4 flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${batch.cropType === "coffee" ? "bg-amber-50" : "bg-emerald-50"}`}>
                        {batch.cropType === "coffee"
                          ? <Coffee className="w-4.5 h-4.5 text-amber-600" style={{ width: "18px", height: "18px" }} />
                          : <Leaf className="w-4.5 h-4.5 text-emerald-600" style={{ width: "18px", height: "18px" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-stone-400">{batch.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bsCfg.bg} ${bsCfg.color}`}>
                            {bsCfg.label}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-stone-800 mt-0.5 truncate">{batch.variety}</div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {batch.weightKg.toLocaleString()} kg · {batch.farmerCount} farmers · {batch.buyer}
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-stone-900">{batch.traceabilityScore}</div>
                        <div className="text-xs text-stone-400">trace score</div>
                      </div>
                      <ScoreBar value={batch.traceabilityScore} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* FARMS TAB */}
        {activeTab === "farms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-500">{filteredFarms.length} farms shown</p>
              <button className="flex items-center gap-1.5 text-sm text-stone-600 border border-stone-300 rounded-lg px-3 py-1.5 hover:bg-stone-50">
                <Filter className="w-3.5 h-3.5" />
                Filter
              </button>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Farm</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Farmer</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Crop</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Area</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">EUDR</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">Risk</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden lg:table-cell">Last Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredFarms.map((farm) => (
                      <tr key={farm.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-stone-500">{farm.id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-stone-800">{farm.farmerName}</div>
                            <div className="text-xs text-stone-400">{farm.village}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {farm.cropType === "coffee"
                              ? <Coffee className="w-3.5 h-3.5 text-amber-600" />
                              : <Leaf className="w-3.5 h-3.5 text-emerald-600" />}
                            <div>
                              <div className="text-sm text-stone-700 capitalize">{farm.cropType}</div>
                              <div className="text-xs text-stone-400">{farm.variety}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-stone-700">{farm.areaHa} ha</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={farm.verificationStatus} />
                        </td>
                        <td className="px-4 py-3">
                          {farm.eudrCompliant ? (
                            <CheckCircle className="w-4.5 h-4.5 text-emerald-500" style={{ width: "18px", height: "18px" }} />
                          ) : (
                            <XCircle className="w-4.5 h-4.5 text-red-400" style={{ width: "18px", height: "18px" }} />
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            farm.deforestationRisk === "low"
                              ? "bg-emerald-50 text-emerald-700"
                              : farm.deforestationRisk === "medium"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                          }`}>
                            {farm.deforestationRisk}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="text-xs text-stone-400">
                            {new Date(farm.lastSynced).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes for farms needing attention */}
            {filteredFarms.filter(f => f.notes).map((farm) => (
              <div key={`note-${farm.id}`} className={`rounded-xl border p-4 flex items-start gap-3 ${
                farm.verificationStatus === "needs_review"
                  ? "bg-red-50 border-red-200"
                  : "bg-amber-50 border-amber-200"
              }`}>
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  farm.verificationStatus === "needs_review" ? "text-red-500" : "text-amber-500"
                }`} />
                <div>
                  <div className="text-sm font-medium text-stone-800">
                    {farm.id} · {farm.farmerName}
                  </div>
                  <div className="text-sm text-stone-600 mt-0.5">{farm.notes}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BATCHES TAB */}
        {activeTab === "batches" && (
          <div className="space-y-4">
            {filteredBatches.map((batch) => {
              const bsCfg = batchStatusConfig[batch.status];
              return (
                <div key={batch.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-stone-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${batch.cropType === "coffee" ? "bg-amber-50" : "bg-emerald-50"}`}>
                          {batch.cropType === "coffee"
                            ? <Coffee className="w-5 h-5 text-amber-600" />
                            : <Leaf className="w-5 h-5 text-emerald-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-stone-800">{batch.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${bsCfg.bg} ${bsCfg.color}`}>
                              {bsCfg.label}
                            </span>
                          </div>
                          <div className="text-sm text-stone-500 mt-0.5">{batch.variety}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {batch.eudrDeclarationId && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <Shield className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-mono text-emerald-700">{batch.eudrDeclarationId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-stone-400 mb-0.5">Weight</div>
                        <div className="text-sm font-semibold text-stone-800">{batch.weightKg.toLocaleString()} kg</div>
                      </div>
                      <div>
                        <div className="text-xs text-stone-400 mb-0.5">Farmers</div>
                        <div className="text-sm font-semibold text-stone-800">{batch.farmerCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-stone-400 mb-0.5">Processing Date</div>
                        <div className="text-sm font-semibold text-stone-800">
                          {new Date(batch.processingDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-stone-400 mb-0.5">Destination</div>
                        <div className="text-sm font-semibold text-stone-800">{batch.buyer}</div>
                        <div className="text-xs text-stone-400">{batch.buyerCountry}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-stone-500">Traceability Score</span>
                          <span className="font-bold text-stone-900">{batch.traceabilityScore}/100</span>
                        </div>
                        <ScoreBar value={batch.traceabilityScore} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-stone-500">Export Readiness</span>
                          <span className="font-bold text-stone-900">{batch.exportReadiness}/100</span>
                        </div>
                        <ScoreBar value={batch.exportReadiness} />
                      </div>
                    </div>

                    {batch.exportReadiness < 80 && (
                      <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {batch.exportReadiness < 70
                          ? "Missing GPS polygons for 2 contributing farms. EUDR declaration cannot be issued until resolved."
                          : "Minor documentation gaps. All critical checks passed. Declaration ready within 48 hrs."}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BUYERS TAB */}
        {activeTab === "buyers" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <h3 className="font-semibold text-stone-900 mb-1">Export Pipeline</h3>
              <p className="text-sm text-stone-500 mb-6">Current buyer relationships and readiness status</p>
              <div className="space-y-4">
                {filteredBatches.map((b) => (
                  <div key={b.id} className="rounded-xl border border-stone-200 p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${b.cropType === "coffee" ? "bg-amber-50" : "bg-emerald-50"}`}>
                        {b.cropType === "coffee" ? "☕" : "🥑"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div>
                            <div className="font-semibold text-stone-900">{b.buyer}</div>
                            <div className="text-sm text-stone-500 flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              {b.buyerCountry}
                              <span className="mx-1">·</span>
                              <span className="font-mono text-xs">{b.id}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-stone-700">{b.weightKg.toLocaleString()} kg</div>
                            <div className="text-xs text-stone-400">batch weight</div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-stone-500">Export Readiness</span>
                            <span className="font-semibold">{b.exportReadiness}%</span>
                          </div>
                          <ScoreBar value={b.exportReadiness} />
                        </div>
                        <div className="flex items-center justify-end">
                          {b.exportReadiness >= 80 ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" />
                              EUDR Declaration Ready
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              Pending documentation
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Future marketplace teaser */}
            <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center">
              <TrendingUp className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <h3 className="font-semibold text-stone-600 mb-1">Buyer Marketplace — Coming Soon</h3>
              <p className="text-sm text-stone-400 max-w-sm mx-auto">
                Direct RFQ from verified EU, Middle East, and US buyers. Transparent pricing,
                EUDR documentation auto-attached. Part of Herb&apos;s 12-month roadmap.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
