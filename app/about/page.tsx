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
} from "lucide-react";
import Link from "next/link";

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-16 border-b border-stone-200 last:border-0">
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">
      {children}
    </div>
  );
}

function Callout({ type, children }: { type: "stat" | "warning" | "insight"; children: React.ReactNode }) {
  const styles = {
    stat: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    insight: "bg-stone-100 border-stone-200 text-stone-800",
  };
  return (
    <div className={`border rounded-xl px-5 py-4 text-sm leading-relaxed ${styles[type]}`}>
      {children}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-12">
        {/* Sticky sidebar */}
        <aside className="hidden lg:block lg:col-span-1 py-16">
          <div className="sticky top-28 space-y-1">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">
              On this page
            </div>
            {[
              { href: "#problem", label: "The Problem" },
              { href: "#eudr", label: "EUDR Explained" },
              { href: "#tanzania", label: "Tanzania Context" },
              { href: "#coffee", label: "Coffee" },
              { href: "#avocado", label: "Avocado" },
              { href: "#supply-chain", label: "Supply Chain" },
              { href: "#solution", label: "How Herb Solves It" },
              { href: "#tech", label: "Technical Approach" },
              { href: "#sea", label: "SEA Expansion" },
              { href: "#team", label: "Team & Vision" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block text-sm text-stone-500 hover:text-emerald-700 py-1 transition-colors hover:pl-2 duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3 divide-y divide-stone-200">
          {/* Page header */}
          <div className="py-16">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-600">Research & Product Rationale</span>
            </div>
            <h1 className="text-5xl font-bold text-stone-900 tracking-tight mb-6">
              Why Herb Exists
            </h1>
            <p className="text-xl text-stone-500 leading-relaxed max-w-2xl">
              A deep-dive into the problem — the regulatory, economic, and structural forces
              making farm-to-market trust infrastructure urgent for East African smallholder agriculture.
            </p>
          </div>

          {/* The Problem */}
          <Section id="problem">
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-3xl font-bold text-stone-900 mb-6">A $200M Export Cliff Edge</h2>
            <div className="prose prose-stone max-w-none space-y-4 text-stone-600 leading-relaxed">
              <p>
                Tanzania&apos;s 2.4 million smallholder farmers grow coffee and avocados on plots
                averaging 1–3 hectares. They sell through cooperatives and middlemen to exporters
                who ship to Europe, the Middle East, and North America. This supply chain generates
                roughly $500M annually for Tanzania.
              </p>
              <p>
                But there is a structural problem at the heart of it:{" "}
                <strong className="text-stone-800">almost none of these farms have digital records.</strong>{" "}
                No GPS boundaries. No verified ownership documentation. No deforestation proof.
                Just paper receipts that change hands at the farm gate.
              </p>
              <p>
                This matters enormously right now, because Europe — Tanzania&apos;s largest coffee
                buyer — has passed the most ambitious supply chain regulation in history.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: "2.4M", label: "Smallholder farmers in Tanzania", icon: "👨‍🌾" },
                { value: "$500M+", label: "Annual agri-export value", icon: "💰" },
                { value: "~0%", label: "With GPS-verified farm boundaries", icon: "📍" },
              ].map((s) => (
                <div key={s.label} className="bg-stone-100 rounded-xl p-5 text-center">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="text-2xl font-bold text-stone-900">{s.value}</div>
                  <div className="text-xs text-stone-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* EUDR */}
          <Section id="eudr">
            <SectionLabel>Regulation</SectionLabel>
            <h2 className="text-3xl font-bold text-stone-900 mb-6">
              The EU Deforestation Regulation (EUDR)
            </h2>

            <div className="space-y-4 text-stone-600 leading-relaxed mb-6">
              <p>
                In June 2023, the European Union enacted Regulation (EU) 2023/1115 — the EU
                Deforestation Regulation. From December 2024 (large companies) and December 2025
                (SMEs), any company placing the following commodities on the EU market must prove
                they were not produced on land deforested after December 31, 2020:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {["☕ Coffee", "🍫 Cocoa", "🌴 Palm Oil", "🌿 Soy", "🪵 Wood", "🐄 Cattle", "🌱 Rubber", "📦 Derived products"].map((item) => (
                <div key={item} className="text-center text-sm py-3 px-4 bg-stone-100 rounded-xl font-medium text-stone-700">
                  {item}
                </div>
              ))}
            </div>

            <Callout type="warning">
              <strong>What &quot;proof&quot; means in practice:</strong> Operators must submit a Due Diligence
              Statement to the EU with GPS coordinates (or polygon) of the production plot, evidence
              of legal land use, and cross-reference against a deforestation reference dataset.
              No polygon = no statement = no EU sale.
            </Callout>

            <div className="mt-6 space-y-4 text-stone-600 leading-relaxed">
              <p>
                The regulation is not just about deforestation. It requires{" "}
                <strong className="text-stone-800">full traceability to the farm level</strong> —
                not just the country or region. For a roaster buying a 20-tonne lot of Tanzanian
                Arabica, they need to trace it back to the GPS coordinates of each farm that
                contributed to that lot.
              </p>
              <p>
                Currently, almost no Tanzanian cooperative can provide this. The paperwork trail
                ends at the collection point. Cooperatives know which villages their coffee comes
                from, but not which specific farm plots, and certainly not with GPS precision.
              </p>
            </div>

            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-900 mb-1">The Stakes</div>
                  <div className="text-sm text-red-800 leading-relaxed">
                    EU buyers who cannot verify compliance face fines of up to 4% of their annual
                    EU turnover plus confiscation of goods. They are already deselecting suppliers
                    who cannot provide farm-level GPS data. Tanzania exports approximately $150M in
                    coffee to the EU annually. If it cannot meet EUDR requirements, a significant
                    portion of this could be lost to compliant competitors in Colombia, Ethiopia,
                    or Brazil, who have had more time to build digital infrastructure.
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Tanzania Context */}
          <Section id="tanzania">
            <SectionLabel>Context</SectionLabel>
            <h2 className="text-3xl font-bold text-stone-900 mb-6">Tanzania: The Pilot Country</h2>

            <div className="space-y-4 text-stone-600 leading-relaxed mb-6">
              <p>
                Tanzania is Herb&apos;s initial focus for three reasons: market maturity (established
                cooperative infrastructure and strong buyer relationships), crop mix (both coffee
                and avocado are EUDR-regulated and export-driven), and connectivity conditions
                (representative of the offline challenges across Sub-Saharan Africa and, later,
                rural Southeast Asia).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { region: "Kilimanjaro", crops: "Arabica coffee, avocado", notes: "Home of KNCU, Tanzania's oldest cooperative. Moshi and Marangu produce premium single-origin beans at 1,400–1,800m altitude." },
                { region: "Mbeya", crops: "Arabica coffee, avocado", notes: "Southern highlands. Shade-grown coffee under indigenous forest. High EUDR sensitivity due to proximity to reserve boundaries." },
                { region: "Mbinga (Ruvuma)", crops: "Arabica coffee", notes: "High-altitude, Bourbon variety dominance. Strong Fair Trade presence. Very limited mobile connectivity." },
                { region: "Iringa / Njombe", crops: "Avocado, coffee", notes: "Emerging avocado export hub. Hass and Fuerte growing rapidly. Limited cooperative structure — direct buyer relationships common." },
              ].map((r) => (
                <div key={r.region} className="bg-stone-50 rounded-xl p-5 border border-stone-200">
                  <div className="font-semibold text-stone-900 mb-1">{r.region}</div>
                  <div className="text-xs text-emerald-600 font-medium mb-2">{r.crops}</div>
                  <div className="text-sm text-stone-500 leading-relaxed">{r.notes}</div>
                </div>
              ))}
            </div>

            <Callout type="insight">
              <strong>Cooperative infrastructure is a strength, not a weakness.</strong> Tanzania&apos;s
              cooperative system — KNCU, Mbinga Coffee Cooperative, AMCOS — provides a distribution
              network for digital tools. Field agents can cover wide geographic areas when working
              through cooperative field officers. Herb operates at the cooperative level, not the
              individual farm level, for initial rollout.
            </Callout>
          </Section>

          {/* Coffee */}
          <Section id="coffee">
            <SectionLabel>Crop Deep-Dive</SectionLabel>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Coffee className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-stone-900">Tanzanian Coffee</h2>
                <p className="text-stone-500 mt-1">Arabica-dominant, premium-positioned, EUDR-vulnerable</p>
              </div>
            </div>

            <div className="space-y-4 text-stone-600 leading-relaxed mb-6">
              <p>
                Tanzania produces approximately 50,000–75,000 metric tonnes of coffee annually,
                of which roughly 70% is Arabica. The Kilimanjaro and Mbeya regions produce beans
                that regularly score 85+ on the SCA cupping scale — firmly specialty grade.
              </p>
              <p>
                Tanzania&apos;s Arabica commands 30–50% price premiums in European specialty markets
                compared to commodity-grade beans. But this premium is contingent on being
                allowed into the EU at all — which, from December 2025, requires EUDR documentation.
              </p>
              <p>
                The key varieties — SL28, N39, Kent, Bourbon — each have different flavor profiles
                and are grown at different altitudes. Buyers like Nordic Roasters and Blue Bottle
                pay significant premiums for single-origin, variety-specific lots. But they cannot
                claim single-origin or variety-specific unless they can trace the lot back to
                specific GPS-verified farms.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "Annual Production", val: "50,000–75,000 MT" },
                { key: "Arabica Share", val: "~70%" },
                { key: "EU Export Value", val: "~$150M/year" },
                { key: "Avg Farm Size", val: "1–2 ha" },
                { key: "Altitude Range", val: "1,400–2,000m" },
                { key: "EUDR Deadline", val: "Dec 2025 (SMEs)" },
              ].map((item) => (
                <div key={item.key} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="text-xs text-amber-600 font-medium mb-0.5">{item.key}</div>
                  <div className="text-base font-bold text-amber-900">{item.val}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Avocado */}
          <Section id="avocado">
            <SectionLabel>Crop Deep-Dive</SectionLabel>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Leaf className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-stone-900">East African Avocado</h2>
                <p className="text-stone-500 mt-1">400% growth in five years, rapidly outgrowing its traceability infrastructure</p>
              </div>
            </div>

            <div className="space-y-4 text-stone-600 leading-relaxed mb-6">
              <p>
                East Africa&apos;s avocado exports have grown explosively, driven by European
                demand for Hass avocados and Kenya&apos;s position as the EU&apos;s primary African
                supplier. Tanzania is catching up, with Kilimanjaro slopes producing Hass and
                Fuerte at altitudes ideal for the extended harvest seasons European buyers want.
              </p>
              <p>
                Unlike coffee, avocado does not yet have a mature cooperative system. Many farmers
                sell direct to middlemen or aggregators who blend fruit from multiple farms.
                This means the traceability gap is even wider than in coffee: while coffee
                cooperatives at least know which villages contributed, avocado aggregators often
                cannot trace back to a specific farm at all.
              </p>
              <p>
                The EUDR requires farm-level GPS polygons for avocado, but the market structure
                currently makes this almost impossible without digital tools deployed at the point
                of aggregation.
              </p>
            </div>

            <Callout type="stat">
              <strong>Kenya&apos;s GlobalG.A.P. adoption</strong> has given Kenyan exporters a
              significant head start on EU market access. Tanzania&apos;s avocado industry is
              two to three years behind on farm certification — a gap Herb&apos;s GPS-first approach
              can close faster than traditional certification programs, which require multi-year
              farmer training.
            </Callout>
          </Section>

          {/* Supply Chain */}
          <Section id="supply-chain">
            <SectionLabel>System Analysis</SectionLabel>
            <h2 className="text-3xl font-bold text-stone-900 mb-6">The Supply Chain Problem</h2>

            <div className="space-y-4 text-stone-600 leading-relaxed mb-6">
              <p>
                The East African agricultural supply chain has multiple actors between farmer and
                European buyer, each of whom loses or adds opacity:
              </p>
            </div>

            {/* Supply chain visual */}
            <div className="space-y-0 mb-6">
              {[
                { actor: "Smallholder Farmer", note: "Paper receipts, no GPS, no digital identity", color: "bg-red-50 border-red-200", icon: "👨‍🌾" },
                { actor: "Village Collection Point", note: "Aggregates from multiple farmers. Lot provenance often lost here.", color: "bg-red-50 border-red-200", icon: "🏚️" },
                { actor: "Cooperative / Primary Society", note: "Knows village of origin but not specific farm. Paper records.", color: "bg-amber-50 border-amber-200", icon: "🏢" },
                { actor: "Processing Facility / Wet Mill", note: "Blends multiple cooperative lots. Traceability further diluted.", color: "bg-amber-50 border-amber-200", icon: "⚙️" },
                { actor: "Exporter / Trader", note: "Issues export documents. Cannot certify EUDR without upstream data.", color: "bg-amber-50 border-amber-200", icon: "🚢" },
                { actor: "EU Buyer / Roaster", note: "Requires GPS polygon + deforestation proof. Currently unavailable.", color: "bg-emerald-50 border-emerald-200", icon: "🏪" },
              ].map((item, i, arr) => (
                <div key={item.actor} className="flex items-start gap-0">
                  <div className="flex flex-col items-center mr-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-base ${item.color}`}>
                      {item.icon}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-0.5 h-6 bg-stone-300 my-1" />
                    )}
                  </div>
                  <div className={`flex-1 rounded-xl border p-4 mb-1 ${item.color}`}>
                    <div className="font-medium text-stone-800 text-sm">{item.actor}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{item.note}</div>
                  </div>
                </div>
              ))}
            </div>

            <Callout type="insight">
              <strong>The critical intervention point is the cooperative.</strong> Cooperatives
              already have farmer relationships, field officer networks, and buyer contracts.
              They are the right unit of deployment. Herb gives cooperatives the tools to
              extend digital identity down to the farm gate via field agents.
            </Callout>
          </Section>

          {/* Solution */}
          <Section id="solution">
            <SectionLabel>The Solution</SectionLabel>
            <h2 className="text-3xl font-bold text-stone-900 mb-6">How Herb Solves It</h2>

            <div className="space-y-4 text-stone-600 leading-relaxed mb-8">
              <p>
                Herb&apos;s core insight is that the most critical bottleneck is the last mile:
                getting farm-level GPS data from a 1-hectare plot in the Kilimanjaro highlands to
                a Due Diligence Statement accepted by an EU customs authority.
              </p>
              <p>
                This requires solving three sub-problems simultaneously: capture, verification,
                and propagation. All three must work in environments with intermittent connectivity,
                low digital literacy, and limited device availability.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Capture: Offline-first GPS",
                  detail: "The field agent app works fully offline. GPS coordinates are captured by walking farm boundaries — the same technique used by land surveyors, but designed for agricultural field agents. All data is stored locally (IndexedDB) and synced when connectivity returns. Works on any Android device with a GPS chip.",
                  icon: MapPin,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  title: "Verification: Automated cross-checks",
                  detail: "Submitted polygons are automatically cross-referenced against the EU's deforestation reference datasets (Global Forest Watch, PRODES, RADD alerts) and national forest inventories. Farms clear this check immediately. Those with potential overlap are flagged for manual review by cooperative staff.",
                  icon: Shield,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  title: "Propagation: Batch traceability",
                  detail: "Verified farms are grouped into traceable lots (batches) that mirror actual processing and export units. Each batch has a full audit trail linking farm polygons → farmer IDs → processing dates → buyer. EUDR Due Diligence Statements are auto-generated with all required polygon data.",
                  icon: TrendingUp,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  title: "Connectivity: Offline-first sync architecture",
                  detail: "Field agents in 2G zones or no-signal areas can capture data throughout the day. When they return to a village with connectivity, all data syncs automatically. The cooperative dashboard updates in real time. Field agents see sync status clearly — green (synced), amber (queued), red (conflict).",
                  icon: Wifi,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 bg-white border border-stone-200 rounded-xl p-6">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Technical Approach */}
          <Section id="tech">
            <SectionLabel>Technical Approach</SectionLabel>
            <h2 className="text-3xl font-bold text-stone-900 mb-6">Architecture Decisions</h2>

            <div className="space-y-4 text-stone-600 leading-relaxed mb-6">
              <p>
                Herb is built as a progressive web app (PWA) with offline-first capabilities.
                The architecture prioritizes robustness in low-connectivity environments over
                real-time features.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-stone-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Layer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Choice</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {[
                    ["Frontend", "Next.js 16 + TypeScript", "SSR for dashboard performance; type safety for data models"],
                    ["Field App", "Next.js PWA (offline)", "No app store dependency; works on any Android browser"],
                    ["Styling", "Tailwind CSS v4", "Consistent design system; small bundle for field devices"],
                    ["GPS Capture", "Web Geolocation API", "Works on any GPS-equipped device; no native dependency"],
                    ["Offline Storage", "IndexedDB via idb", "Structured storage for farm records; sync queue management"],
                    ["Maps", "Leaflet + OpenStreetMap", "Free tiles; offline tile caching possible"],
                    ["Database", "PostgreSQL + PostGIS", "Native spatial query support for polygon operations"],
                    ["Deforestation Check", "GFW API + custom", "Real-time Global Forest Watch integration"],
                    ["Auth", "JWT + cooperative-scoped", "Cooperative-level data isolation; role-based access"],
                  ].map(([layer, choice, rationale]) => (
                    <tr key={layer} className="hover:bg-stone-50">
                      <td className="px-4 py-3 font-medium text-stone-700">{layer}</td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-700">{choice}</td>
                      <td className="px-4 py-3 text-stone-500">{rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* SEA Expansion */}
          <Section id="sea">
            <SectionLabel>Global Vision</SectionLabel>
            <h2 className="text-3xl font-bold text-stone-900 mb-6">Southeast Asia: The Next Frontier</h2>

            <div className="space-y-4 text-stone-600 leading-relaxed mb-6">
              <p>
                The EUDR problem is not unique to East Africa. The same structural gap —
                millions of smallholder farmers producing regulated commodities without digital
                farm records — exists at even greater scale in Southeast Asia.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                {
                  country: "Malaysia",
                  crop: "Palm Oil",
                  icon: "🌴",
                  farmers: "450,000+ smallholders",
                  issue: "EUDR classifies palm oil as high-risk. Independent smallholders (non-FELDA) have almost no GPS farm records. MSPO certification covers <40% of smallholders.",
                },
                {
                  country: "Indonesia",
                  crop: "Rubber & Palm",
                  icon: "🌿",
                  farmers: "16M+ rubber smallholders",
                  issue: "World's largest rubber producer. FSC certification requires GPS boundaries. Almost zero digital records at the smallholder level.",
                },
                {
                  country: "Vietnam",
                  crop: "Coffee",
                  icon: "☕",
                  farmers: "500,000+ households",
                  issue: "World's largest Robusta producer. Central Highlands producers have some cooperative structure but very limited GPS coverage.",
                },
                {
                  country: "Philippines",
                  crop: "Cocoa",
                  icon: "🍫",
                  farmers: "30,000+ cocoa farmers",
                  issue: "Premium Philippine cocoa (Davao region) is entering specialty markets. EUDR requires plot-level traceability. No current infrastructure.",
                },
              ].map((item) => (
                <div key={item.country} className="bg-stone-50 border border-stone-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-stone-900">{item.country} · {item.crop}</div>
                      <div className="text-xs text-stone-400">{item.farmers}</div>
                    </div>
                  </div>
                  <p className="text-sm text-stone-500 leading-relaxed">{item.issue}</p>
                </div>
              ))}
            </div>

            <Callout type="insight">
              <strong>Why East Africa first?</strong> Tanzania provides a contained, high-stakes
              proving ground. Coffee and avocado are both EUDR-regulated but simpler than palm oil
              (fewer political complications, clearer cooperative structures). Success in Tanzania
              generates the case studies, code infrastructure, and investor credibility needed to
              raise for a Southeast Asia expansion — particularly relevant to the Shortcut Asia
              Challenge context.
            </Callout>
          </Section>

          {/* Team */}
          <Section id="team">
            <SectionLabel>Vision</SectionLabel>
            <h2 className="text-3xl font-bold text-stone-900 mb-6">The Herb Vision</h2>

            <div className="space-y-4 text-stone-600 leading-relaxed mb-8">
              <p>
                The 300 million smallholder farmers across Sub-Saharan Africa and Southeast Asia
                grow the food the world eats — but they are systematically excluded from the
                value their produce creates. They lack the documentation, the digital identity,
                and the market access that larger producers take for granted.
              </p>
              <p>
                EUDR is the crisis. But the infrastructure Herb builds — verifiable farm identity,
                GPS-precise land records, compliance-ready documentation — is also the foundation
                for better pricing, better financing, and direct buyer relationships.
              </p>
              <p>
                The long-term vision is a cooperative-level trust layer that works for any
                agricultural commodity, in any country, where farmers need to prove what they grow,
                where they grow it, and that they grew it sustainably.
              </p>
            </div>

            <div className="bg-emerald-900 text-white rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">The North Star</span>
              </div>
              <blockquote className="text-xl font-medium text-white leading-relaxed mb-4">
                &quot;Every smallholder farmer who produces for the global market deserves a verified
                digital identity, fair access to buyers, and a compliance infrastructure that
                costs them nothing and costs the cooperative a fraction of what it earns in
                premium market access.&quot;
              </blockquote>
              <div className="text-emerald-400 text-sm">Herb · Shortcut Asia Challenge 2024</div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
              >
                View Cooperative Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/field"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
              >
                Try Field App
              </Link>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
