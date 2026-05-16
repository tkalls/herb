import {
  Globe,
  Shield,
  AlertTriangle,
  TrendingUp,
  Coffee,
  Leaf,
  MapPin,
  Wifi,
  CheckCircle,
  ArrowRight,
  Zap,
  Database,
  Lock,
  Cpu,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "#problem", label: "The Problem" },
  { href: "#eudr", label: "EUDR Explained" },
  { href: "#tanzania", label: "Tanzania Context" },
  { href: "#coffee", label: "Coffee" },
  { href: "#avocado", label: "Avocado" },
  { href: "#supply-chain", label: "Supply Chain" },
  { href: "#solution", label: "How Herb Solves It" },
  { href: "#tech", label: "Technical Approach" },
  { href: "#sea", label: "SEA Expansion" },
  { href: "#vision", label: "Vision" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em] mb-4">
      {children}
    </p>
  );
}

function DarkCallout({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-5 text-sm leading-relaxed border ${
      accent
        ? "bg-amber-500/[0.06] border-amber-500/25 text-zinc-300"
        : "bg-zinc-900 border-zinc-800 text-zinc-400"
    }`}>
      {children}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-black min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-16">

          {/* Sticky sidebar */}
          <aside className="hidden lg:block lg:col-span-1 py-20">
            <div className="sticky top-24">
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-[0.15em] mb-5">
                On this page
              </p>
              <nav className="space-y-0.5">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block text-sm text-zinc-600 hover:text-amber-400 py-1.5 transition-colors duration-200 border-l border-transparent hover:border-amber-400 pl-3 -ml-3"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-3 py-20 space-y-24">

            {/* Page header */}
            <div className="border-b border-white/[0.06] pb-16">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em]">
                  Research & Product Rationale
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-tight mb-6">
                Why Herb Exists
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
                A deep-dive into the regulatory, economic, and structural forces making
                farm-to-market trust infrastructure urgent for East African smallholder agriculture.
              </p>
            </div>

            {/* The Problem */}
            <section id="problem">
              <SectionLabel>The Problem</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-8">
                A $200M Export Cliff Edge
              </h2>

              {/* Bento stat blocks */}
              <div className="grid grid-cols-2 gap-3 mb-10">
                <div className="bg-amber-500 rounded-2xl p-6 col-span-2 sm:col-span-1">
                  <p className="text-black/60 text-xs font-bold uppercase tracking-widest mb-2">Farmers at Risk</p>
                  <p className="text-5xl font-black text-black tracking-tight">2.4M</p>
                  <p className="text-black/70 text-sm mt-2">Tanzanian smallholders with no digital farm records</p>
                </div>
                <div className="bg-zinc-900 rounded-2xl p-6 border border-white/[0.07]">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">EU Trade at Risk</p>
                  <p className="text-5xl font-black text-white tracking-tight">€150B</p>
                  <p className="text-zinc-500 text-sm mt-2">Annual EU agri-imports under EUDR scrutiny</p>
                </div>
                <div className="bg-zinc-900 rounded-2xl p-6 border border-white/[0.07]">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Tanzania Coffee Exports</p>
                  <p className="text-5xl font-black text-amber-400 tracking-tight">$200M</p>
                  <p className="text-zinc-500 text-sm mt-2">Annual exports to Europe — now requiring GPS proof</p>
                </div>
                <div className="bg-orange-600 rounded-2xl p-6">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Enforcement Active</p>
                  <p className="text-4xl font-black text-white tracking-tight">Dec 2025</p>
                  <p className="text-white/70 text-sm mt-2">EUDR is live. No documentation = no EU access. Now.</p>
                </div>
              </div>

              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  Tanzania&apos;s 2.4 million smallholder farmers grow coffee and avocados on plots
                  averaging 1–3 hectares. They sell through cooperatives and middlemen to exporters
                  who ship to Europe, the Middle East, and North America. This supply chain generates
                  roughly $500M annually for Tanzania.
                </p>
                <p>
                  But there is a structural problem at the heart of it:{" "}
                  <span className="text-amber-400 font-semibold">almost none of these farms have digital records.</span>{" "}
                  No GPS boundaries. No verified ownership documentation. No deforestation proof.
                  Just paper receipts that change hands at the farm gate.
                </p>
                <p>
                  This matters enormously right now, because Europe — Tanzania&apos;s largest coffee
                  buyer — has passed the most ambitious supply chain regulation in history.
                </p>
              </div>
            </section>

            {/* EUDR */}
            <section id="eudr">
              <SectionLabel>EUDR Explained</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-8">
                The Regulation That Changes Everything
              </h2>

              <div className="bg-amber-500/[0.05] border border-amber-500/20 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 font-bold mb-2">EUDR Enforcement is Live — December 2025</p>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      The EU Deforestation Regulation requires operators placing coffee, cocoa,
                      cattle, wood, palm oil, soy, and rubber — and their derived products — on
                      the EU market to prove these commodities were not produced on deforested land
                      after December 31, 2020. Non-compliance means market exclusion.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-zinc-400 leading-relaxed mb-8">
                <p>
                  The regulation requires GPS polygon data at the farm level — not the village
                  level, not the cooperative level, but the specific plot of land where the
                  coffee tree or avocado grew. For a Tanzanian cooperative managing 3,000 farmers,
                  that means 3,000 GPS polygons, each validated against satellite deforestation data.
                </p>
                <p>
                  Large agri-businesses and multinational plantations can absorb the cost of
                  compliance. Smallholder cooperatives in Tanzania cannot — unless purpose-built
                  infrastructure makes compliance essentially free.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "GPS polygon required", sub: "Per individual farm plot", color: "bg-zinc-900 border-zinc-800" },
                  { label: "Dec 2020 baseline", sub: "No deforestation after this date", color: "bg-zinc-900 border-zinc-800" },
                  { label: "Due diligence statement", sub: "Required per shipment to EU", color: "bg-zinc-900 border-zinc-800" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-4 border ${item.color}`}>
                    <p className="text-white font-bold text-sm mb-1">{item.label}</p>
                    <p className="text-zinc-500 text-xs">{item.sub}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tanzania */}
            <section id="tanzania">
              <SectionLabel>Tanzania Context</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-8">
                The Ground Reality
              </h2>

              <div className="space-y-4 text-zinc-400 leading-relaxed mb-10">
                <p>
                  Tanzania is uniquely positioned — and uniquely vulnerable. It has one of East
                  Africa&apos;s most developed cooperative systems (KNCU dates to 1932), produces
                  specialty coffee and avocado at scale, and exports heavily to EU markets.
                  It is also almost entirely unprepared for EUDR compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[
                  {
                    region: "Kilimanjaro",
                    crops: "Arabica coffee, avocado",
                    notes: "Home of KNCU, Tanzania's oldest cooperative. Moshi and Marangu produce premium single-origin beans at 1,400–1,800m altitude.",
                    color: "border-amber-500/20 bg-amber-500/[0.04]",
                    label: "text-amber-400",
                  },
                  {
                    region: "Mbeya",
                    crops: "Arabica coffee, avocado",
                    notes: "Southern highlands. Shade-grown coffee under indigenous forest. High EUDR sensitivity due to proximity to reserve boundaries.",
                    color: "border-zinc-800 bg-zinc-900",
                    label: "text-zinc-400",
                  },
                  {
                    region: "Mbinga (Ruvuma)",
                    crops: "Arabica coffee",
                    notes: "High-altitude Bourbon variety dominance. Strong Fair Trade presence. Very limited mobile connectivity — offline-first critical here.",
                    color: "border-zinc-800 bg-zinc-900",
                    label: "text-zinc-400",
                  },
                  {
                    region: "Iringa / Njombe",
                    crops: "Avocado, coffee",
                    notes: "Emerging avocado export hub. Hass and Fuerte growing rapidly. Limited cooperative structure — direct buyer relationships common.",
                    color: "border-amber-500/20 bg-amber-500/[0.04]",
                    label: "text-amber-400",
                  },
                ].map((r) => (
                  <div key={r.region} className={`rounded-xl p-5 border ${r.color}`}>
                    <p className="font-bold text-white mb-1">{r.region}</p>
                    <p className={`text-xs font-semibold mb-3 ${r.label}`}>{r.crops}</p>
                    <p className="text-sm text-zinc-500 leading-relaxed">{r.notes}</p>
                  </div>
                ))}
              </div>

              <DarkCallout accent>
                <strong className="text-white">Cooperative infrastructure is a strength, not a weakness.</strong>{" "}
                Tanzania&apos;s cooperative system — KNCU, Mbinga Coffee Cooperative, AMCOS —
                provides a distribution network for digital tools. Field agents cover wide geographic
                areas when working through cooperative field officers. Herb operates at the cooperative
                level for initial rollout.
              </DarkCallout>
            </section>

            {/* Coffee */}
            <section id="coffee">
              <SectionLabel>Crop Deep-Dive</SectionLabel>
              <div className="flex items-start gap-5 mb-8">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">Tanzanian Coffee</h2>
                  <p className="text-zinc-500 mt-1">Arabica-dominant, premium-positioned, EUDR-vulnerable</p>
                </div>
              </div>

              <div className="space-y-4 text-zinc-400 leading-relaxed mb-8">
                <p>
                  Tanzania produces approximately 50,000–75,000 metric tonnes of coffee annually,
                  of which roughly 70% is Arabica. The Kilimanjaro and Mbeya regions produce beans
                  that regularly score 85+ on the SCA cupping scale — firmly specialty grade.
                </p>
                <p>
                  Tanzania&apos;s Arabica commands 30–50% price premiums in European specialty markets.
                  But this premium is contingent on being allowed into the EU at all — which, from
                  December 2025, requires EUDR documentation including GPS farm polygons.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: "Annual Production", val: "75,000 MT" },
                  { key: "Arabica Share", val: "~70%" },
                  { key: "EU Export Value", val: "~$150M" },
                  { key: "Avg Farm Size", val: "1–2 ha" },
                  { key: "Altitude Range", val: "1,400–2,000m" },
                  { key: "EUDR Status", val: "Active" },
                ].map((item, i) => (
                  <div
                    key={item.key}
                    className={`rounded-xl p-5 ${i === 0 ? "bg-amber-500 col-span-2 sm:col-span-1" : "bg-zinc-900 border border-zinc-800"}`}
                  >
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${i === 0 ? "text-black/60" : "text-zinc-500"}`}>
                      {item.key}
                    </p>
                    <p className={`text-2xl font-black tracking-tight ${i === 0 ? "text-black" : "text-white"}`}>
                      {item.val}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Avocado */}
            <section id="avocado">
              <SectionLabel>Crop Deep-Dive</SectionLabel>
              <div className="flex items-start gap-5 mb-8">
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">East African Avocado</h2>
                  <p className="text-zinc-500 mt-1">400% export growth in five years — outpacing its traceability infrastructure</p>
                </div>
              </div>

              <div className="space-y-4 text-zinc-400 leading-relaxed mb-8">
                <p>
                  East Africa&apos;s avocado exports have grown explosively, driven by European demand
                  for Hass avocados and Kenya&apos;s position as the EU&apos;s primary African supplier.
                  Tanzania is catching up, with Kilimanjaro slopes producing Hass and Fuerte at
                  altitudes ideal for the extended harvest seasons European buyers want.
                </p>
                <p>
                  Unlike coffee, avocado does not yet have a mature cooperative system. Many farmers
                  sell direct to middlemen or aggregators who blend fruit from multiple farms —
                  meaning the traceability gap is even wider than in coffee. EUDR requires farm-level
                  GPS polygons, but the market structure currently makes this impossible without
                  digital tools deployed at the point of aggregation.
                </p>
              </div>

              <DarkCallout accent>
                <strong className="text-white">Kenya&apos;s GlobalG.A.P. head start.</strong>{" "}
                Kenya&apos;s adoption gives Kenyan exporters a significant advantage on EU market access.
                Tanzania&apos;s avocado industry is two to three years behind on farm certification —
                a gap Herb&apos;s GPS-first approach can close faster than traditional certification programs,
                which require multi-year farmer training.
              </DarkCallout>
            </section>

            {/* Supply Chain */}
            <section id="supply-chain">
              <SectionLabel>System Analysis</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-8">
                The Supply Chain Problem
              </h2>

              <div className="space-y-2 mb-8">
                {[
                  { actor: "Smallholder Farmer", note: "Paper receipts, no GPS, no digital identity", status: "critical" },
                  { actor: "Village Collection Point", note: "Aggregates from multiple farmers. Lot provenance often lost here.", status: "critical" },
                  { actor: "Cooperative / Primary Society", note: "Knows village of origin but not specific farm. Paper records.", status: "partial" },
                  { actor: "Processing Facility / Wet Mill", note: "Blends multiple cooperative lots. Traceability further diluted.", status: "partial" },
                  { actor: "Exporter / Trader", note: "Issues export documents. Cannot certify EUDR without upstream data.", status: "partial" },
                  { actor: "EU Buyer / Roaster", note: "Requires GPS polygon + deforestation proof. Currently unavailable.", status: "good" },
                ].map((item, i, arr) => (
                  <div key={item.actor} className="flex items-stretch gap-0">
                    <div className="flex flex-col items-center mr-4 w-4 flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full mt-4 flex-shrink-0 ${
                        item.status === "critical" ? "bg-red-500" : item.status === "partial" ? "bg-amber-500" : "bg-amber-400"
                      }`} />
                      {i < arr.length - 1 && (
                        <div className="w-px flex-1 bg-zinc-800 my-1" />
                      )}
                    </div>
                    <div className={`flex-1 rounded-xl p-4 mb-2 border ${
                      item.status === "critical"
                        ? "border-red-500/20 bg-red-500/[0.04]"
                        : item.status === "partial"
                        ? "border-amber-500/20 bg-amber-500/[0.04]"
                        : "border-amber-400/30 bg-amber-400/[0.06]"
                    }`}>
                      <p className="font-bold text-white text-sm">{item.actor}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <DarkCallout>
                <strong className="text-white">The critical intervention point is the cooperative.</strong>{" "}
                Cooperatives already have farmer relationships, field officer networks, and buyer
                contracts. They are the right unit of deployment. Herb gives cooperatives the tools
                to extend digital identity down to the farm gate via field agents.
              </DarkCallout>
            </section>

            {/* Solution */}
            <section id="solution">
              <SectionLabel>The Solution</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                How Herb Solves It
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-10">
                Three sub-problems solved simultaneously: capture, verification, and propagation —
                all working with intermittent connectivity and any Android device.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Capture: Offline-first GPS",
                    detail: "The field agent app works fully offline. GPS coordinates are captured by walking farm boundaries — the same technique used by land surveyors, but designed for agricultural field agents. All data is stored locally in IndexedDB and synced when connectivity returns. Works on any Android with a GPS chip.",
                    icon: MapPin,
                    bg: "bg-amber-500",
                    dark: false,
                  },
                  {
                    title: "Verification: Automated cross-checks",
                    detail: "Submitted polygons are automatically cross-referenced against the EU's deforestation reference datasets (Global Forest Watch, PRODES, RADD alerts) and national forest inventories. Farms clear immediately. Those with potential overlap are flagged for manual review.",
                    icon: Shield,
                    bg: "bg-zinc-900 border border-zinc-800",
                    dark: true,
                  },
                  {
                    title: "Propagation: Batch traceability",
                    detail: "Verified farms are grouped into traceable lots that mirror actual processing and export units. Each batch has a full audit trail linking farm polygons to farmer IDs to processing dates to buyer. EUDR Due Diligence Statements are auto-generated with all required polygon data.",
                    icon: TrendingUp,
                    bg: "bg-zinc-900 border border-zinc-800",
                    dark: true,
                  },
                  {
                    title: "Connectivity: Resilient sync architecture",
                    detail: "Field agents in 2G zones or no-signal areas capture data throughout the day. When they return to a village with connectivity, all data syncs automatically. The cooperative dashboard updates in real time. Field agents see sync status clearly — synced, queued, or conflict.",
                    icon: Wifi,
                    bg: "bg-orange-600",
                    dark: false,
                  },
                ].map((item) => (
                  <div key={item.title} className={`flex items-start gap-5 rounded-2xl p-6 ${item.bg}`}>
                    <item.icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${item.dark ? "text-amber-400" : "text-black"}`} />
                    <div>
                      <h3 className={`font-bold mb-2 ${item.dark ? "text-white" : "text-black"}`}>{item.title}</h3>
                      <p className={`text-sm leading-relaxed ${item.dark ? "text-zinc-400" : "text-black/70"}`}>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Tech */}
            <section id="tech">
              <SectionLabel>Technical Approach</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-8">
                Architecture Decisions
              </h2>

              {/* Stack bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {[
                  { icon: Cpu, label: "Next.js 16", sub: "App Router" },
                  { icon: Database, label: "Convex", sub: "Realtime DB" },
                  { icon: Wifi, label: "Dexie", sub: "Offline Queue" },
                  { icon: Lock, label: "OTEL", sub: "Full Tracing" },
                  { icon: MapPin, label: "MapLibre GL", sub: "No-quota maps" },
                  { icon: Shield, label: "Cloudflare", sub: "R2 + Worker" },
                  { icon: Zap, label: "Convex Auth", sub: "Role-scoped" },
                  { icon: Globe, label: "Vercel", sub: "Edge deploy" },
                ].map((tech) => (
                  <div key={tech.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-amber-500/30 transition-colors duration-200">
                    <tech.icon className="w-4 h-4 text-amber-400 mb-3" />
                    <p className="text-white font-bold text-sm">{tech.label}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{tech.sub}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-800">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800">
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Layer</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest">Choice</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-zinc-500 uppercase tracking-widest hidden sm:table-cell">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-sm">
                    {[
                      ["Data + Auth", "Convex", "Reactive queries, built-in auth, TypeScript end-to-end"],
                      ["Offline Storage", "Dexie (IndexedDB)", "Structured storage, sync queue with retry logic"],
                      ["Maps", "MapLibre GL JS", "Open-source, no token quotas, satellite + street styles"],
                      ["Blob Storage", "Cloudflare R2", "S3-compatible, zero egress fees, 10GB free tier"],
                      ["Public API", "Cloudflare Worker", "Read-only buyer trace endpoint, WAF + rate-limit"],
                      ["Observability", "SignOz + OTEL", "Full trace from browser through Convex to audit log"],
                      ["Polygon Math", "@turf/turf", "Client-side area, centroid, deforestation buffer check"],
                      ["Hosting", "Vercel", "Native Next.js support, edge revalidation with Convex"],
                    ].map(([layer, choice, rationale]) => (
                      <tr key={layer} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white text-sm">{layer}</td>
                        <td className="px-5 py-3.5 font-mono text-amber-400 text-xs">{choice}</td>
                        <td className="px-5 py-3.5 text-zinc-500 hidden sm:table-cell">{rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SEA */}
            <section id="sea">
              <SectionLabel>Global Vision</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-8">
                Southeast Asia: The Next Frontier
              </h2>

              <div className="space-y-4 text-zinc-400 leading-relaxed mb-10">
                <p>
                  The EUDR problem is not unique to East Africa. The same structural gap —
                  millions of smallholder farmers producing regulated commodities without digital
                  farm records — exists at even greater scale in Southeast Asia.
                </p>
                <p>
                  Tanzania provides a contained, high-stakes proving ground. Success here generates
                  the case studies, code infrastructure, and investor credibility needed to raise
                  for a Southeast Asia expansion.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {[
                  {
                    country: "Malaysia",
                    crop: "Palm Oil",
                    farmers: "450,000+ smallholders",
                    issue: "Independent smallholders (non-FELDA) have almost no GPS farm records. MSPO certification covers less than 40% of smallholders.",
                    color: "bg-amber-500",
                    dark: false,
                  },
                  {
                    country: "Indonesia",
                    crop: "Rubber & Palm",
                    farmers: "16M+ rubber smallholders",
                    issue: "World's largest rubber producer. FSC certification requires GPS boundaries. Almost zero digital records at smallholder level.",
                    color: "bg-zinc-900 border border-zinc-800",
                    dark: true,
                  },
                  {
                    country: "Vietnam",
                    crop: "Coffee",
                    farmers: "500,000+ households",
                    issue: "World's largest Robusta producer. Central Highlands producers have some cooperative structure but very limited GPS coverage.",
                    color: "bg-zinc-900 border border-zinc-800",
                    dark: true,
                  },
                  {
                    country: "Philippines",
                    crop: "Cocoa",
                    farmers: "30,000+ cocoa farmers",
                    issue: "Premium Davao cocoa is entering specialty markets. EUDR requires plot-level traceability. No current infrastructure exists.",
                    color: "bg-orange-600",
                    dark: false,
                  },
                ].map((item) => (
                  <div key={item.country} className={`rounded-2xl p-6 ${item.color}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${item.dark ? "text-zinc-600" : "text-black/50"}`}>
                      {item.crop}
                    </p>
                    <p className={`text-2xl font-black tracking-tight mb-0.5 ${item.dark ? "text-white" : "text-black"}`}>
                      {item.country}
                    </p>
                    <p className={`text-xs mb-4 ${item.dark ? "text-zinc-500" : "text-black/60"}`}>{item.farmers}</p>
                    <p className={`text-sm leading-relaxed ${item.dark ? "text-zinc-400" : "text-black/70"}`}>{item.issue}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Vision */}
            <section id="vision">
              <SectionLabel>Vision</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-8">
                The Herb Vision
              </h2>

              <div className="space-y-4 text-zinc-400 leading-relaxed mb-10">
                <p>
                  The 300 million smallholder farmers across Sub-Saharan Africa and Southeast Asia
                  grow the food the world eats — but they are systematically excluded from the
                  value their produce creates. They lack documentation, digital identity, and the
                  market access that larger producers take for granted.
                </p>
                <p>
                  EUDR is the crisis. But the infrastructure Herb builds — verifiable farm identity,
                  GPS-precise land records, compliance-ready documentation — is also the foundation
                  for better pricing, better financing, and direct buyer relationships.
                </p>
                <p>
                  The long-term vision is a cooperative-level trust layer that works for any
                  agricultural commodity, in any country, where farmers need to prove what they
                  grow, where they grow it, and that they grew it sustainably.
                </p>
              </div>

              {/* Quote block */}
              <div className="bg-amber-500 rounded-2xl p-8 mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle className="w-5 h-5 text-black/70" />
                  <span className="text-xs font-bold text-black/60 uppercase tracking-[0.2em]">The North Star</span>
                </div>
                <blockquote className="text-xl sm:text-2xl font-bold text-black leading-snug tracking-tight">
                  &quot;Every smallholder farmer who produces for the global market deserves a verified
                  digital identity, fair access to buyers, and a compliance infrastructure that
                  costs them nothing and costs the cooperative a fraction of what it earns in
                  premium market access.&quot;
                </blockquote>
                <p className="text-black/50 text-sm mt-5 font-semibold">Herb · 2025</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all duration-200 hover:scale-[1.02]"
                >
                  View Cooperative Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/field"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/[0.05] hover:border-white/20 transition-all duration-200"
                >
                  Try Field App
                </Link>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
