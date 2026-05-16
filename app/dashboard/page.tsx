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

const BatchTraceMap = dynamic(
  () => import("@/components/map/BatchTraceMap"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl bg-zinc-800 animate-pulse aspect-[4/3] md:aspect-[16/10]" />
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
    <div className="w-full bg-zinc-700 rounded-full h-1.5">
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

  const coopDoc = useQuery(api.cooperatives.getByCode, { code: "KNCU" });
  const coopId = coopDoc?._id;
  const rawFarmers = useQuery(api.farmers.listByCoop, coopId ? { cooperativeId: coopId } : "skip");
  const rawFarms = useQuery(api.farms.listByCoop, coopId ? { cooperativeId: coopId } : "skip");
  const rawBatches = useQuery(api.batches.listByCoop, coopId ? { cooperativeId: coopId } : "skip");

  const simulateTransit = useMutation(api.transit.simulateBatchTransit);
  const advanceTransit = useAction(api.transit.advanceTransit);

  const isLoading = !coopDoc || !rawFarmers || !rawFarms || !rawBatches;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="bg-zinc-950 border-b border-zinc-800 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-3 bg-zinc-800 animate-pulse rounded w-48 mb-2" />
            <div className="h-7 bg-zinc-800 animate-pulse rounded w-80 mb-1" />
            <div className="h-3 bg-zinc-900 animate-pulse rounded w-64" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="h-3 bg-zinc-800 animate-pulse rounded w-2/3 mb-3" />
                <div className="h-8 bg-zinc-700 animate-pulse rounded w-1/2 mb-1" />
                <div className="h-3 bg-zinc-800 animate-pulse rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cooperative) return null;

  const filteredFarms = farms.filter((f) => activeCrop === "all" || f.cropType === activeCrop);
  const filteredBatches = batches.filter((b) => activeCrop === "all" || b.cropType === activeCrop);
  const eudrCount = farms.filter((f) => f.eudrCompliant).length;

  function openAudit(entityType: string, entityId: string, label: string) {
    setAuditEntity({ type: entityType, id: entityId, label });
    setAuditOpen(true);
  }

  return (
    <div className="min-h-screen bg-black">

      {/* Header */}
      <div className="bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  {cooperative.district} · {cooperative.region} · {cooperative.country}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white">{cooperative.name}</h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                {cooperative.shortName} · {cooperative.farmerCount.toLocaleString()} farmers ·{" "}
                {cooperative.farmCount.toLocaleString()} farms · {cooperative.totalAreaHa.toLocaleString()} ha
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Crop filter */}
          <div className="flex items-center gap-1 border-t border-zinc-800 pt-2 pb-0">
            {cropFilter.map((f) => (
              <button
                key={f}
                onClick={() => setActiveCrop(f)}
                className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors capitalize ${
                  activeCrop === f
                    ? "bg-zinc-900 text-white border-b-2 border-amber-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {f === "all" ? "All Crops" : f === "coffee" ? "☕ Coffee" : "🥑 Avocado"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-zinc-950 border-b border-zinc-800 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {(["overview", "farms", "batches", "buyers"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-bold capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-amber-400 text-amber-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiTile label="Total Farms"     value={farms.length}                sub={`${cooperative.totalAreaHa} ha mapped`}                                                                         accent="amber"   />
              <KpiTile label="Verified"         value={cooperative.verifiedFarms}   sub={`${farms.length > 0 ? Math.round((cooperative.verifiedFarms / farms.length) * 100) : 0}% of registered`}       accent="emerald" />
              <KpiTile label="EUDR Compliant"   value={eudrCount}                   sub={`${farms.length - eudrCount} farms need action`}                                                                accent="blue"    />
              <KpiTile label="Active Batches"   value={cooperative.activeBatches}   sub="pending + in transit"                                                                                          accent="orange"  />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="font-black text-white mb-6">Compliance Scores</h3>
                <div className="flex justify-around">
                  <ScoreGauge score={cooperative.complianceScore} label="Overall" />
                  <ScoreGauge score={cooperative.eudrReadiness}   label="EUDR Ready" />
                </div>
                <div className="mt-6 pt-5 border-t border-zinc-800 space-y-2">
                  {[
                    { label: "Documentation",       value: 82 },
                    { label: "GPS Coverage",         value: 74 },
                    { label: "Deforestation Check",  value: 91 },
                    { label: "Certification",        value: 58 },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">{s.label}</span>
                      <div className="flex items-center gap-2 w-32">
                        <ScoreBar value={s.value} />
                        <span className="font-mono text-zinc-400 w-8 text-right text-xs tabular-nums">{s.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="font-black text-white mb-4">Farm Verification Status</h3>
                <div className="space-y-3 mb-6">
                  {[
                    { label: "Verified",       count: cooperative.verifiedFarms,    color: "bg-emerald-500", text: "text-emerald-400" },
                    { label: "Pending Review", count: cooperative.pendingFarms,     color: "bg-amber-500",   text: "text-amber-400"   },
                    { label: "Needs Action",   count: cooperative.needsReviewFarms, color: "bg-red-500",     text: "text-red-400"     },
                    { label: "Unverified",     count: cooperative.unverifiedFarms,  color: "bg-zinc-600",    text: "text-zinc-500"    },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-zinc-400">{row.label}</span>
                        <span className={`font-black ${row.text}`}>
                          {row.count.toLocaleString()}
                          <span className="text-zinc-600 font-normal ml-1">
                            ({cooperative.farmCount > 0 ? Math.round((row.count / cooperative.farmCount) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-2">
                        <div
                          className={`${row.color} h-2 rounded-full transition-all`}
                          style={{ width: cooperative.farmCount > 0 ? `${(row.count / cooperative.farmCount) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-red-500/[0.07] border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-red-400 text-sm">EUDR Compliance Gap</div>
                      <div className="text-sm text-zinc-400 mt-1">
                        <strong className="text-white">{cooperative.farmCount - eudrCount}</strong> farms ({100 - cooperative.eudrReadiness}%)
                        are not yet EUDR-compliant. Full traceability to sub-hectare polygon level required for all EU-bound exports.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent batches */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-black text-white">Active Export Batches</h3>
                <button onClick={() => setActiveTab("batches")} className="text-sm text-amber-400 font-bold flex items-center gap-1 hover:text-amber-300">
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {batches.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Package className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-600">No active batches.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {batches.slice(0, 3).map((batch) => {
                    const bsCfg = batchStatusConfig[batch.status];
                    return (
                      <div key={batch.id} className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-800/40 transition-colors">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${batch.cropType === "coffee" ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                          {batch.cropType === "coffee"
                            ? <Coffee className="text-amber-400" style={{ width: "18px", height: "18px" }} />
                            : <Leaf   className="text-emerald-400" style={{ width: "18px", height: "18px" }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-zinc-600">{batch.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${bsCfg.bg} ${bsCfg.color}`}>{bsCfg.label}</span>
                          </div>
                          <div className="text-sm font-bold text-white mt-0.5 truncate">{batch.variety}</div>
                          <div className="text-xs text-zinc-600 mt-0.5">{batch.weightKg.toLocaleString()} kg · {batch.farmerCount} farmers · {batch.buyer}</div>
                        </div>
                        <div className="w-20">
                          <ScoreBar value={batch.traceabilityScore} />
                          <div className="text-xs font-mono tabular-nums text-zinc-500 mt-1 text-right">{batch.traceabilityScore}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FARMS */}
        {activeTab === "farms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">{filteredFarms.length} farms shown</p>
              <button className="flex items-center gap-1.5 text-sm text-zinc-400 border border-zinc-700 rounded-lg px-3 py-1.5 hover:bg-zinc-800 transition-colors">
                <Filter className="w-3.5 h-3.5" />Filter
              </button>
            </div>
            {filteredFarms.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
                <MapPin className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                {farms.length === 0 ? (
                  <><p className="text-sm font-bold text-zinc-400 mb-1">No farms registered yet.</p><p className="text-xs text-zinc-600">Use the field app to register the first farm.</p></>
                ) : (
                  <><p className="text-sm font-bold text-zinc-400 mb-1">No {activeCrop === "all" ? "" : activeCrop + " "}farms match the current filter.</p><p className="text-xs text-zinc-600">Try selecting a different crop above.</p></>
                )}
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-800/50">
                        <th scope="col" className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">Farm</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">Farmer</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">Crop</th>
                        <th scope="col" className="text-right px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">Area</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">Status</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-500">EUDR</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-500 hidden md:table-cell">Risk</th>
                        <th scope="col" className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-500 hidden lg:table-cell">Last Sync</th>
                        <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filteredFarms.map((farm) => (
                        <tr key={farm.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3"><span className="font-mono text-xs text-zinc-600">{farm.id}</span></td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-bold text-white">{farm.farmerName}</div>
                            <div className="text-xs text-zinc-600">{farm.village}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {farm.cropType === "coffee" ? <Coffee className="w-3.5 h-3.5 text-amber-400" /> : <Leaf className="w-3.5 h-3.5 text-emerald-400" />}
                              <div>
                                <div className="text-sm text-zinc-300 capitalize">{farm.cropType}</div>
                                <div className="text-xs text-zinc-600">{farm.variety}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right"><span className="text-sm font-mono text-zinc-300 tabular-nums">{farm.areaHa} ha</span></td>
                          <td className="px-4 py-3"><StatusBadge status={farm.verificationStatus} /></td>
                          <td className="px-4 py-3">
                            {farm.eudrCompliant
                              ? <CheckCircle className="text-emerald-500" style={{ width: "18px", height: "18px" }} />
                              : <XCircle    className="text-red-500"     style={{ width: "18px", height: "18px" }} />}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              farm.deforestationRisk === "low"    ? "bg-emerald-500/10 text-emerald-400"
                            : farm.deforestationRisk === "medium" ? "bg-amber-500/10 text-amber-400"
                            :                                       "bg-red-500/10 text-red-400"}`}>
                              {farm.deforestationRisk}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="text-xs text-zinc-600">{new Date(farm.lastSynced).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openAudit("farm", farm.convexId, farm.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 transition" aria-label={`Audit ${farm.id}`}>
                              <History size={12} />Audit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {filteredFarms.filter(f => f.notes).map((farm) => (
              <div key={`note-${farm.id}`} className={`rounded-xl border p-4 flex items-start gap-3 ${farm.verificationStatus === "needs_review" ? "bg-red-500/[0.06] border-red-500/25" : "bg-amber-500/[0.06] border-amber-500/25"}`}>
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${farm.verificationStatus === "needs_review" ? "text-red-400" : "text-amber-400"}`} />
                <div>
                  <div className="text-sm font-bold text-white">{farm.id} · {farm.farmerName}</div>
                  <div className="text-sm text-zinc-400 mt-0.5">{farm.notes}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BATCHES */}
        {activeTab === "batches" && (
          <div className="space-y-4">
            {filteredBatches.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
                <Package className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-zinc-400 mb-1">No export batches yet.</p>
                <p className="text-xs text-zinc-600">Batches are created once farms pass EUDR verification.</p>
              </div>
            ) : filteredBatches.map((batch) => {
              const bsCfg = batchStatusConfig[batch.status];
              const isExpanded = expandedBatchId === batch.convexId;
              return (
                <div key={batch.id} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${batch.cropType === "coffee" ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                          {batch.cropType === "coffee" ? <Coffee className="w-5 h-5 text-amber-400" /> : <Leaf className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-white">{batch.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${bsCfg.bg} ${bsCfg.color}`}>{bsCfg.label}</span>
                          </div>
                          <div className="text-sm text-zinc-500 mt-0.5">{batch.variety}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {batch.eudrDeclarationId && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-xs font-mono text-emerald-400">{batch.eudrDeclarationId}</span>
                          </div>
                        )}
                        {batch.status === "ready" && (
                          <button onClick={async () => { await simulateTransit({ batchId: batch.convexId as Id<"batches"> }); }} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-black hover:bg-amber-400 transition">
                            <Truck className="w-3.5 h-3.5" />Dispatch to {batch.buyer}
                          </button>
                        )}
                        {batch.status === "in_transit" && (
                          <button onClick={async () => { await advanceTransit({ batchId: batch.convexId as Id<"batches"> }); }} className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-400 hover:bg-zinc-700 transition" title="Advance transit ~125km (admin)">
                            +30 min
                          </button>
                        )}
                        <button onClick={() => setExpandedBatchId(isExpanded ? null : batch.convexId)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition">
                          {isExpanded ? "Collapse" : "View map"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: "Weight",          val: `${batch.weightKg.toLocaleString()} kg` },
                        { label: "Farmers",         val: String(batch.farmerCount) },
                        { label: "Processing date", val: new Date(batch.processingDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
                        { label: "Destination",     val: batch.buyer, sub: batch.buyerCountry },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="text-xs text-zinc-600 mb-0.5">{item.label}</div>
                          <div className="text-sm font-black text-white">{item.val}</div>
                          {item.sub && <div className="text-xs text-zinc-600">{item.sub}</div>}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-zinc-500">Traceability score</span>
                          <span className="font-mono font-black tabular-nums text-white">{batch.traceabilityScore}/100</span>
                        </div>
                        <ScoreBar value={batch.traceabilityScore} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-zinc-500">Export readiness</span>
                          <span className="font-mono font-black tabular-nums text-white">{batch.exportReadiness}/100</span>
                        </div>
                        <ScoreBar value={batch.exportReadiness} />
                      </div>
                    </div>
                    {isExpanded && <div className="mt-2"><BatchTraceMap batchId={batch.convexId} /></div>}
                    {batch.exportReadiness < 80 && (
                      <div className="mt-3 flex items-start gap-2 p-3 bg-amber-500/[0.07] border border-amber-500/20 rounded-lg text-xs text-amber-400">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {batch.exportReadiness < 70 ? "Missing GPS polygons. EUDR declaration cannot be issued until resolved." : "Minor documentation gaps. Declaration ready within 48 hrs."}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BUYERS */}
        {activeTab === "buyers" && (
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="font-black text-white mb-1">Export Pipeline</h3>
              <p className="text-sm text-zinc-500 mb-6">Current buyer relationships and readiness status</p>
              {filteredBatches.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-600">No active buyer relationships.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBatches.map((b) => (
                    <div key={b.id} className="rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${b.cropType === "coffee" ? "bg-amber-500/10" : "bg-emerald-500/10"}`}>
                          {b.cropType === "coffee" ? <Coffee className="w-5 h-5 text-amber-400" /> : <Leaf className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div>
                              <div className="font-black text-white">{b.buyer}</div>
                              <div className="text-sm text-zinc-500 flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5" />{b.buyerCountry}<span className="mx-1">·</span><span className="font-mono text-xs">{b.id}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-black font-mono tabular-nums text-white">{b.weightKg.toLocaleString()} kg</div>
                              <div className="text-xs text-zinc-600">batch weight</div>
                            </div>
                          </div>
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-zinc-500">Export readiness</span>
                              <span className="font-black font-mono tabular-nums text-white">{b.exportReadiness}%</span>
                            </div>
                            <ScoreBar value={b.exportReadiness} />
                          </div>
                          <div className="flex items-center justify-end">
                            {b.exportReadiness >= 80
                              ? <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold"><CheckCircle className="w-3.5 h-3.5" />EUDR Declaration Ready</span>
                              : <span className="flex items-center gap-1 text-xs text-amber-400 font-bold"><Clock className="w-3.5 h-3.5" />Pending documentation</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="text-amber-400" style={{ width: "18px", height: "18px" }} />
                </div>
                <h3 className="font-black text-white">Export coordinator</h3>
              </div>
              <p className="text-sm text-zinc-500">
                To initiate a new buyer relationship or issue a direct RFQ, contact the KNCU export desk
                at <span className="font-mono text-amber-400">exports@kncu.coop.tz</span>.
                Verified EUDR documentation is attached automatically to every shipment.
              </p>
            </div>
          </div>
        )}
      </div>

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
