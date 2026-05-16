import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Shield,
  TrendingUp,
  WifiOff,
  CheckCircle,
  Wifi,
  Coffee,
  Leaf,
  Globe,
  Clock,
  AlertTriangle,
} from "lucide-react";

const stats = [
  { value: "2.4M+", label: "Smallholder farmers in Tanzania", sub: "avg. farm size 1–3 ha" },
  { value: "87%", label: "Lack digital farm documentation", sub: "manual paper records only" },
  { value: "€150B", label: "EU agri-imports under EUDR", sub: "coffee & avocado at risk" },
  { value: "Dec 2025", label: "EUDR enforcement active", sub: "no docs = no EU access. Now." },
];

const steps = [
  {
    number: "01",
    title: "Register & Map",
    description: "Field agents register farmers and walk farm boundaries for GPS polygon mapping — offline-capable, works in 2G zones.",
    icon: MapPin,
  },
  {
    number: "02",
    title: "Verify & Score",
    description: "Farm polygons are cross-checked against deforestation baselines. Each farm receives an EUDR compliance score.",
    icon: Shield,
  },
  {
    number: "03",
    title: "Connect & Export",
    description: "Verified farms batch into traceable lots with EUDR-ready declarations. Buyers get full supply chain visibility.",
    icon: TrendingUp,
  },
];

const crops = [
  {
    name: "Coffee",
    icon: Coffee,
    origin: "Kilimanjaro & Mbeya",
    variety: "Arabica SL28, N39, Bourbon, Kent",
    eudrRisk: "High",
    marketSize: "$43B global specialty",
    insight: "Tanzania produces ~75,000 MT annually. Kilimanjaro Arabica commands premium prices in European specialty markets — but zero EUDR documentation means zero EU access from Dec 2025.",
    challenges: ["No GPS farm boundaries", "Paper-only certifications", "Fragmented cooperative records", "Deforestation adjacency risk"],
    accentColor: "amber",
  },
  {
    name: "Avocado",
    icon: Leaf,
    origin: "Kilimanjaro slopes, Iringa, Mbeya",
    variety: "Hass, Fuerte, Reed",
    eudrRisk: "Medium-High",
    marketSize: "$2.4B EA export opportunity",
    insight: "East Africa's avocado export has grown 400% in five years. EU buyers now demand full traceability from farm to port, not just phytosanitary certificates.",
    challenges: ["No soil/water data per-farm", "Mixed-farm tracking gaps", "Inconsistent GlobalG.A.P. adoption", "Cold chain visibility gaps"],
    accentColor: "emerald",
  },
];

const roadmap = [
  {
    phase: "Now",
    status: "live",
    items: ["Farmer & farm registration", "GPS polygon capture (offline)", "EUDR compliance scoring", "Batch traceability", "Cooperative dashboard"],
  },
  {
    phase: "Next 6 months",
    status: "building",
    items: ["Satellite deforestation cross-check", "Real-time sync with KNCU ERP", "Multi-cooperative federation", "Mobile app (React Native)", "SMS-based farmer alerts"],
  },
  {
    phase: "12–18 months",
    status: "roadmap",
    items: ["Full certification integration (RA, UTZ, FT)", "Buyer marketplace & direct RFQ", "Carbon credit tracking", "SEA expansion", "Government e-land registry API"],
  },
];

export default function Home() {
  return (
    <div className="flex flex-col bg-black">

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center bg-black overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-amber-500/[0.07] blur-[140px] rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-amber-600/[0.04] blur-[120px] rounded-full" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
          <div className="max-w-5xl">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.92] mb-8">
              <span className="block text-white">Farm-to-Market</span>
              <span className="block text-amber-400">Trust Infrastructure</span>
              <span className="block text-white">for East Africa</span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl mb-12">
              Herb connects 2.4 million Tanzanian smallholder farmers to global coffee and avocado
              buyers through GPS-verified, EUDR-compliant traceability — built to work offline,
              in the highlands, at the farm gate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-amber-500 text-black font-black text-base hover:bg-amber-400 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20"
              >
                View Cooperative Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/field"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/10 text-white font-bold text-base hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200"
              >
                Try Field App
                <MapPin className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-white/[0.06] bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.06]">
            {stats.map((stat) => (
              <div key={stat.value} className="px-6 py-10">
                <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1 tracking-tight">{stat.value}</div>
                <div className="text-sm font-bold text-white mb-1">{stat.label}</div>
                <div className="text-xs text-zinc-600">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EUDR ALERT ── */}
      <section className="bg-black border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-red-600 shadow-lg shadow-red-900/30">
            <AlertTriangle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
            <p className="text-sm text-white/90 leading-relaxed">
              <span className="font-black text-white">EUDR Enforcement is Live. </span>
              From December 2025, all coffee, cocoa, palm oil, soy, wood, rubber, cattle, and derived
              products entering the EU must prove they were not produced on deforested land.
              No documentation = no EU market access. Tanzania exports ~$200M in coffee and avocado to Europe annually.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <p className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] mb-4">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white max-w-xl leading-tight">
              Three steps from smallholder to EUDR-compliant export.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {steps.map((step, i) => {
              const palette = [
                { bg: "bg-emerald-500", icon: "text-black", num: "text-black/10", title: "text-black", desc: "text-black/70" },
                { bg: "bg-blue-600",    icon: "text-white",  num: "text-white/10", title: "text-white", desc: "text-white/70" },
                { bg: "bg-amber-500",   icon: "text-black",  num: "text-black/10", title: "text-black", desc: "text-black/70" },
              ];
              const p = palette[i];
              return (
                <div key={step.number} className={`card-hover ${p.bg} rounded-2xl p-8`}>
                  <div className="flex items-start justify-between mb-8">
                    <step.icon className={`w-7 h-7 ${p.icon}`} />
                    <span className={`text-5xl font-black tabular-nums ${p.num}`}>{step.number}</span>
                  </div>
                  <h3 className={`text-xl font-black mb-3 ${p.title}`}>{step.title}</h3>
                  <p className={`text-sm leading-relaxed ${p.desc}`}>{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── THE CROPS ── */}
      <section className="py-32 bg-zinc-950 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <p className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] mb-4">The Crops</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white max-w-xl leading-tight">
              Tanzania&apos;s two highest-value smallholder exports.
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {crops.map((crop) => (
              <div key={crop.name} className="card-hover rounded-2xl border border-white/[0.07] overflow-hidden bg-zinc-950">
                <div className={`p-8 border-b border-white/[0.06] ${
                  crop.accentColor === "amber"
                    ? "bg-gradient-to-br from-amber-950/60 to-zinc-950"
                    : "bg-gradient-to-br from-emerald-950/50 to-zinc-950"
                }`}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2">{crop.origin}</p>
                      <h3 className="text-4xl font-black text-white tracking-tight">{crop.name}</h3>
                      <p className="text-sm text-zinc-500 mt-1">{crop.variety}</p>
                    </div>
                    <crop.icon className={`w-10 h-10 opacity-20 ${crop.accentColor === "amber" ? "text-amber-400" : "text-emerald-400"}`} />
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">Market Size</p>
                      <p className="text-sm font-bold text-white">{crop.marketSize}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">EUDR Risk</p>
                      <p className={`text-sm font-bold ${crop.eudrRisk === "High" ? "text-red-400" : "text-amber-400"}`}>{crop.eudrRisk}</p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-sm text-zinc-400 leading-relaxed mb-6">{crop.insight}</p>
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-3">Key Traceability Gaps</p>
                  <ul className="space-y-2">
                    {crop.challenges.map((c) => (
                      <li key={c} className="flex items-center gap-2.5 text-sm text-zinc-500">
                        <span className={`w-1 h-1 rounded-full flex-shrink-0 ${crop.accentColor === "amber" ? "bg-amber-500" : "bg-emerald-500"}`} />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUILT DIFFERENT — COLORED BENTO ── */}
      <section className="py-32 bg-black border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] mb-4">Built Different</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white max-w-xl leading-tight">
              Designed for the realities of East Africa.
            </h2>
          </div>

          {/* Bento grid — colored blocks */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">

            {/* GPS — amber hero block */}
            <div className="card-hover bg-amber-500 rounded-2xl p-7 col-span-2 lg:col-span-1 row-span-1">
              <MapPin className="w-7 h-7 text-black mb-6" />
              <h3 className="text-xl font-black text-black mb-2">GPS Polygon Capture</h3>
              <p className="text-sm text-black/70 leading-relaxed">
                Walk the boundary, capture the plot. Works offline in the Tanzanian highlands and syncs when connectivity returns.
              </p>
            </div>

            {/* Offline-first — orange */}
            <div className="card-hover bg-orange-600 rounded-2xl p-7">
              <WifiOff className="w-7 h-7 text-white mb-6" />
              <h3 className="text-xl font-black text-white mb-2">Offline-First</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                Full farm registration in 2G zones or no signal. Queues locally, drains automatically on reconnection.
              </p>
            </div>

            {/* EUDR — dark */}
            <div className="card-hover bg-zinc-900 border border-zinc-800 rounded-2xl p-7">
              <Shield className="w-7 h-7 text-amber-400 mb-6" />
              <h3 className="text-xl font-black text-white mb-2">EUDR Compliance Engine</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Automated deforestation cross-checks against PRODES, Global Forest Watch, and EU reference data.
              </p>
            </div>

            {/* Batch — stone dark */}
            <div className="card-hover bg-stone-900 border border-stone-800 rounded-2xl p-7">
              <CheckCircle className="w-7 h-7 text-amber-400 mb-6" />
              <h3 className="text-xl font-black text-white mb-2">Batch Traceability</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Farm-to-container audit trails for coffee and avocado. Full lot provenance for customs, certification bodies, and roasters.
              </p>
            </div>

            {/* Dashboard — amber dark wide */}
            <div className="card-hover bg-amber-950 border border-amber-900/30 rounded-2xl p-7 col-span-2 lg:col-span-1">
              <TrendingUp className="w-7 h-7 text-amber-400 mb-6" />
              <h3 className="text-xl font-black text-white mb-2">Cooperative Dashboard</h3>
              <p className="text-sm text-amber-200/50 leading-relaxed">
                Compliance overview, export pipeline, buyer readiness cards, and farm verification status — all live.
              </p>
            </div>

            {/* Realtime — zinc */}
            <div className="card-hover bg-zinc-900 border border-zinc-800 rounded-2xl p-7">
              <Wifi className="w-7 h-7 text-amber-400 mb-6" />
              <h3 className="text-xl font-black text-white mb-2">Real-time Sync</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Changes from field agents propagate to the cooperative dashboard instantly via Convex reactive queries.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section className="py-32 bg-zinc-950 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <p className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] mb-4">Roadmap</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white max-w-xl leading-tight">
              Tanzania today. East Africa next. Southeast Asia after.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roadmap.map((phase) => (
              <div key={phase.phase} className={`card-hover rounded-2xl p-8 border ${
                phase.status === "live"
                  ? "border-amber-500/25 bg-amber-500/[0.04]"
                  : "border-white/[0.07] bg-zinc-950"
              }`}>
                <div className="flex items-center gap-2 mb-6">
                  <span className={`w-2 h-2 rounded-full ${
                    phase.status === "live" ? "bg-amber-400" : phase.status === "building" ? "bg-zinc-500" : "bg-zinc-700"
                  }`} />
                  <span className={`text-xs font-black uppercase tracking-widest ${
                    phase.status === "live" ? "text-amber-400" : phase.status === "building" ? "text-zinc-500" : "text-zinc-700"
                  }`}>
                    {phase.status === "live" ? "Live Now" : phase.status === "building" ? "Building" : "Roadmap"}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-6">{phase.phase}</h3>
                <ul className="space-y-3">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        phase.status === "live" ? "text-amber-400" : phase.status === "building" ? "text-zinc-600" : "text-zinc-800"
                      }`} />
                      <span className={phase.status === "live" ? "text-zinc-300" : "text-zinc-600"}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEA ── */}
      <section className="py-24 bg-black border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-400 uppercase tracking-[0.2em]">Future Expansion</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                The same problem exists<br />in Southeast Asia.
              </h2>
              <p className="text-zinc-500 leading-relaxed max-w-md">
                Malaysia&apos;s 450,000+ smallholder palm oil farmers and Indonesia&apos;s rubber
                smallholders face identical EUDR documentation gaps. East Africa is the proving ground.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {["Malaysia · Palm Oil", "Indonesia · Rubber", "Vietnam · Coffee", "Philippines · Cocoa"].map((item) => (
                <div key={item} className="px-4 py-2.5 rounded-lg bg-zinc-950 border border-white/[0.07] text-sm text-zinc-400 font-bold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-40 bg-black border-t border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/[0.06] blur-[120px] rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Clock className="w-10 h-10 text-amber-400 mx-auto mb-8 opacity-80" />
          <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            EUDR enforcement<br />is live.
          </h2>
          <p className="text-lg text-zinc-500 mb-12 leading-relaxed max-w-xl mx-auto">
            Every month without traceability is a month of coffee and avocado exports at risk.
            Herb turns the compliance mandate into a market access opportunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-black font-black text-base hover:bg-amber-400 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-amber-500/20"
            >
              View Cooperative Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white font-bold text-base hover:bg-white/[0.04] hover:border-white/20 transition-all duration-200"
            >
              Read the Research
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
