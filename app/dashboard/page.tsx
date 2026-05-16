"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import dynamic from "next/dynamic";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Package,
  MapPin,
  Shield,
  Coffee,
  Leaf,
  Globe,
  ArrowUpRight,
  Filter,
  Download,
  History,
  Truck,
} from "lucide-react";
import { statusConfig, batchStatusConfig, type VerificationStatus } from "@/lib/data";
import KpiTile from "@/components/dashboard/KpiTile";
import ScoreGauge from "@/components/dashboard/ScoreGauge";
import AuditDrawer from "@/components/dashboard/AuditDrawer";

// BatchTraceMap is SSR-unsafe (MapLibre) — lazy-load client-only
const BatchTraceMap = dynamic(
  () => import("@/components/map/BatchTraceMap"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl bg-stone-200 animate-pulse aspect-[4/3] md:aspect-[16/10]" />
    ),
  },
);

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
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditEntity, setAuditEntity] = useState<{ type: string; id: string; label: string } | null>(null);

  // ── Convex queries ────────────────────────────────────────────────────────
  const coopDoc = useQuery(api.cooperatives.getByCode, { code: "KNCU" });
  const coopId = coopDoc?._id;
  const rawFarmers = useQuery(api.farmers.listByCoop, coopId ? { cooperativeId: coopId } : "skip");
  const rawFarms = useQuery(api.farms.listByCoop, coopId ? { cooperativeId: coopId } : "skip");
  const rawBatches = useQuery(api.batches.listByCoop, coopId ? { cooperativeId: coopId } : "skip");

  const simulateTransit = useMutation(api.transit.simulateBatchTransit);
  const advanceTransit = useAction(api.transit.advanceTransit);

  const isLoading = !coopDoc || !rawFarmers || !rawFarms || !rawBatches;

  // ── Transform to UI shapes ────────────────────────────────────────────────
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
          convexId: f._id as string,
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
          convexId: b._id as string,
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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="bg-white border-b border-stone-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-4 bg-stone-200 animate-pulse rounded w-48 mb-2" />
            <div className="h-7 bg-stone-200 animate-pulse rounded w-80 mb-1" />
            <div className="h-3 bg-stone-100 animate-pulse rounded w-64" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                <div className="h-3 bg-stone-200 animate-pulse rounded w-2/3 mb-3" />
                <div className="h-8 bg-stone-200 animate-pulse rounded w-1/2 mb-1" />
                <div className="h-3 bg-stone-100 animate-pulse rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cooperative) return null;

  // ── Derived UI values ─────────────────────────────────────────────────────
  const filteredFarms = farms.filter((f) => activeCrop === "all" || f.cropType === activeCrop);
  const filteredBatches = batches.filter((b) => activeCrop === "all" || b.cropType === activeCrop);

  const eudrCount = farms.filter((f) => f.eudrCompliant).length;

  function openAudit(entityType: string, entityId: string, label: string) {
    setAuditEntity({ type: entityType, id: entityId, label });
    setAuditOpen(true);
  }

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
                {f === "all" ? "All Crops" : f === "coffee" ? "Coffee" : "Avocado"}
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
            {/* KPI row — shared KpiTile component */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiTile
                label="Total Farms"
                value={farms.length}
                sub={`${cooperative.totalAreaHa} ha mapped`}
              />
              <KpiTile
                label="Verified"
                value={cooperative.verifiedFarms}
                sub={`${farms.length > 0 ? Math.round((cooperative.verifiedFarms / farms.length) * 100) : 0}% of registered`}
              />
              <KpiTile
                label="EUDR Compliant"
                value={eudrCount}
                sub={`${farms.length - eudrCount} farms need action`}
              />
              <KpiTile
                label="Active Batches"
                value={cooperative.activeBatches}
                sub="pending + in transit"
              />
            </div>

            {/* Compliance gauges — shared ScoreGauge component */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <h3 className="font-semibold text-stone-900 mb-6">Compliance Scores</h3>
                <div className="flex justify-around">
                  <ScoreGauge
                    score={cooperative.complianceScore}
                    label="Overall"
                  />
                  <ScoreGauge
                    score={cooperative.eudrReadiness}
                    label="EUDR Ready"
                  />
                </div>
                <div className="mt-6 pt-5 border-t border-stone-100 space-y-2">
                  {[
                    { label: "Documentation", value: 82 },
                    { label: "GPS Coverage", value: 74 },
                    { label: "Deforestation Check", value: 91 },
                    { label: "Certification", value: 58 },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-sm">
                      <span className="text-stone-500">{s.label}</span>
                      <div className="flex items-center gap-2 w-32">
                        <ScoreBar value={s.value} />
                        <span className="font-mono text-stone-700 w-8 text-right text-xs tabular-nums">{s.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
                <h3 className="font-semibold text-stone-900 mb-4">Farm Verification Status</h3>
                <div className="space-y-3 mb-6">
                  {[
                    { label: "Verified", count: cooperative.verifiedFarms, color: "bg-emerald-500", text: "text-emerald-700" },
                    { label: "Pending Review", count: cooperative.pendingFarms, color: "bg-amber-500", text: "text-amber-700" },
                    { label: "Needs Action", count: cooperative.needsReviewFarms, color: "bg-red-500", text: "text-red-700" },
                    { label: "Unverified", count: cooperative.unverifiedFarms, color: "bg-stone-400", text: "text-stone-600" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-stone-600">{row.label}</span>
                        <span className={`font-semibold ${row.text}`}>
                          {row.count.toLocaleString()}
                          <span className="text-stone-400 font-normal ml-1">
                            ({cooperative.farmCount > 0 ? Math.round((row.count / cooperative.farmCount) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2">
                        <div
                          className={`${row.color} h-2 rounded-full`}
                          style={{ width: cooperative.farmCount > 0 ? `${(row.count / cooperative.farmCount) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-900 text-sm">EUDR Compliance Gap</div>
                      <div className="text-sm text-amber-800 mt-1">
                        <strong>{cooperative.farmCount - eudrCount}</strong> farms ({100 - cooperative.eudrReadiness}%)
                        are not yet EUDR-compliant. The December 2025 regulation requires full traceability to
                        sub-hectare polygon level for all EU-bound exports.
                      </div>
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
              {batches.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-stone-500">No active batches.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {batches.slice(0, 3).map((batch) => {
                    const bsCfg = batchStatusConfig[batch.status];
                    return (
                      <div key={batch.id} className="px-6 py-4 flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${batch.cropType === "coffee" ? "bg-amber-50" : "bg-emerald-50"}`}>
                          {batch.cropType === "coffee"
                            ? <Coffee className="text-amber-600" style={{ width: "18px", height: "18px" }} />
                            : <Leaf className="text-emerald-600" style={{ width: "18px", height: "18px" }} />}
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
                        <div className="w-20">
                          <ScoreBar value={batch.traceabilityScore} />
                          <div className="text-xs font-mono tabular-nums text-stone-500 mt-1 text-right">{batch.traceabilityScore}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

            {filteredFarms.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
                <MapPin className="w-8 h-8 text-stone-300 mx-auto mb-3" aria-hidden="true" />
                {farms.length === 0 ? (
                  <>
                    <p className="text-sm font-medium text-stone-600 mb-1">No farms registered yet.</p>
                    <p className="text-xs text-stone-400">Use the field app to register the first farm and it will appear here within seconds.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-stone-600 mb-1">No {activeCrop === "all" ? "" : activeCrop + " "}farms match the current filter.</p>
                    <p className="text-xs text-stone-400">Try selecting a different crop using the tabs above.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-100 bg-stone-50 sticky top-0 z-10">
                        <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600">Farm</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600">Farmer</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600">Crop</th>
                        <th scope="col" className="text-right px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600">Area</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600">Status</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600">EUDR</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600 hidden md:table-cell">Risk</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-stone-600 hidden lg:table-cell">Last Sync</th>
                        <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
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
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-mono text-stone-700 tabular-nums">{farm.areaHa} ha</span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={farm.verificationStatus} />
                          </td>
                          <td className="px-4 py-3">
                            {farm.eudrCompliant ? (
                              <CheckCircle className="text-emerald-500" style={{ width: "18px", height: "18px" }} />
                            ) : (
                              <XCircle className="text-red-400" style={{ width: "18px", height: "18px" }} />
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
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openAudit("farm", farm.convexId, farm.id)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                              aria-label={`View audit trail for farm ${farm.id}`}
                            >
                              <History size={12} aria-hidden="true" />
                              Audit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                  <div className="text-sm font-medium text-stone-800">{farm.id} · {farm.farmerName}</div>
                  <div className="text-sm text-stone-600 mt-0.5">{farm.notes}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BATCHES TAB */}
        {activeTab === "batches" && (
          <div className="space-y-4">
            {filteredBatches.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
                <Package className="w-8 h-8 text-stone-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-stone-600 mb-1">No export batches yet.</p>
                <p className="text-xs text-stone-400">Batches are created once farms pass EUDR verification and are grouped for export.</p>
              </div>
            ) : (
              filteredBatches.map((batch) => {
                const bsCfg = batchStatusConfig[batch.status];
                const isExpanded = expandedBatchId === batch.convexId;
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
                        <div className="flex items-center gap-2 flex-wrap">
                          {batch.eudrDeclarationId && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                              <Shield className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-xs font-mono text-emerald-700">{batch.eudrDeclarationId}</span>
                            </div>
                          )}
                          {/* Dispatch button — only for ready batches */}
                          {batch.status === "ready" && (
                            <button
                              onClick={async () => {
                                await simulateTransit({ batchId: batch.convexId as Id<"batches"> });
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-800 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
                            >
                              <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                              Dispatch to {batch.buyer}
                            </button>
                          )}
                          {/* +30 min — dev/admin tool, advances transit simulator */}
                          {batch.status === "in_transit" && (
                            <button
                              onClick={async () => {
                                await advanceTransit({ batchId: batch.convexId as Id<"batches"> });
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-xs font-mono text-stone-600 hover:bg-stone-100 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                              title="Advance transit simulator by ~125 km (admin only)"
                            >
                              +30 min
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedBatchId(isExpanded ? null : batch.convexId)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-stone-600 border border-stone-300 hover:bg-stone-50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                          >
                            {isExpanded ? "Collapse" : "View map"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-stone-400 mb-0.5">Weight</div>
                          <div className="text-sm font-semibold font-mono tabular-nums text-stone-800">{batch.weightKg.toLocaleString()} kg</div>
                        </div>
                        <div>
                          <div className="text-xs text-stone-400 mb-0.5">Farmers</div>
                          <div className="text-sm font-semibold text-stone-800">{batch.farmerCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-stone-400 mb-0.5">Processing date</div>
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

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="text-stone-500">Traceability score</span>
                            <span className="font-mono font-bold tabular-nums text-stone-900">{batch.traceabilityScore}/100</span>
                          </div>
                          <ScoreBar value={batch.traceabilityScore} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="text-stone-500">Export readiness</span>
                            <span className="font-mono font-bold tabular-nums text-stone-900">{batch.exportReadiness}/100</span>
                          </div>
                          <ScoreBar value={batch.exportReadiness} />
                        </div>
                      </div>

                      {/* Expandable transit map */}
                      {isExpanded && (
                        <div className="mt-2">
                          <BatchTraceMap batchId={batch.convexId} />
                        </div>
                      )}

                      {batch.exportReadiness < 80 && (
                        <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          {batch.exportReadiness < 70
                            ? "Missing GPS polygons for contributing farms. EUDR declaration cannot be issued until resolved."
                            : "Minor documentation gaps. All critical checks passed. Declaration ready within 48 hrs."}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* BUYERS TAB */}
        {activeTab === "buyers" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <h3 className="font-semibold text-stone-900 mb-1">Export Pipeline</h3>
              <p className="text-sm text-stone-500 mb-6">Current buyer relationships and readiness status</p>
              {filteredBatches.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-8 h-8 text-stone-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-stone-500">No active buyer relationships.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBatches.map((b) => (
                    <div key={b.id} className="rounded-xl border border-stone-200 p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${b.cropType === "coffee" ? "bg-amber-50" : "bg-emerald-50"}`}>
                          {b.cropType === "coffee"
                            ? <Coffee className="w-5 h-5 text-amber-600" />
                            : <Leaf className="w-5 h-5 text-emerald-600" />}
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
                              <div className="text-sm font-semibold font-mono tabular-nums text-stone-700">{b.weightKg.toLocaleString()} kg</div>
                              <div className="text-xs text-stone-400">batch weight</div>
                            </div>
                          </div>
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-stone-500">Export readiness</span>
                              <span className="font-semibold font-mono tabular-nums">{b.exportReadiness}%</span>
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
              )}
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="text-stone-500" style={{ width: "18px", height: "18px" }} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-stone-800">Export coordinator</h3>
              </div>
              <p className="text-sm text-stone-500">
                To initiate a new buyer relationship or issue a direct RFQ, contact the KNCU export desk
                at <span className="font-mono text-stone-700">exports@kncu.coop.tz</span>.
                Verified EUDR documentation is attached automatically to every shipment.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Audit drawer — rendered at page level to avoid z-index issues */}
      {auditEntity && (
        <AuditDrawer
          isOpen={auditOpen}
          onClose={() => setAuditOpen(false)}
          entityType={auditEntity.type}
          entityId={auditEntity.id}
          entityLabel={auditEntity.label}
        />
      )}
    </div>
  );
}
