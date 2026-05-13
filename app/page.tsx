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
  { value: "2.4M+", label: "Smallholder coffee farmers in Tanzania", sub: "avg. farm size 1–3 ha" },
  { value: "87%", label: "Lack formal digital farm documentation", sub: "manual paper records only" },
  { value: "€150B", label: "EU agri-imports facing EUDR scrutiny", sub: "coffee & avocado at risk" },
  { value: "Dec 2025", label: "EUDR enforcement deadline (SMEs)", sub: "no documentation = no EU access" },
];

const steps = [
  {
    number: "01",
    title: "Register & Map",
    description:
      "Field agents use the offline-capable mobile app to register farmers, capture crop profiles, and walk farm boundaries for GPS polygon mapping.",
    icon: MapPin,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    number: "02",
    title: "Verify & Score",
    description:
      "Farm polygons are cross-checked against deforestation baselines. Each farm receives a compliance readiness score with clear remediation guidance.",
    icon: Shield,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    number: "03",
    title: "Connect & Export",
    description:
      "Verified farms batch into traceable lots with EUDR-ready declarations. Buyers get full supply chain visibility from seed to shipment.",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
];

const features = [
  {
    title: "GPS Polygon Capture",
    description: "Walk the boundary, capture the plot. Works offline in the Tanzanian highlands and syncs when connectivity returns.",
    icon: MapPin,
  },
  {
    title: "Offline-First Architecture",
    description: "Designed for intermittent connectivity. Full farm registration and data capture in 2G zones or no signal.",
    icon: WifiOff,
  },
  {
    title: "EUDR Compliance Engine",
    description: "Automated deforestation cross-checks against PRODES, Global Forest Watch, and EU reference data. Declaration auto-generation.",
    icon: Shield,
  },
  {
    title: "Batch Traceability",
    description: "Farm-to-container audit trails for coffee and avocado. Full lot provenance for customs, certification bodies, and roasters.",
    icon: CheckCircle,
  },
  {
    title: "Cooperative Dashboard",
    description: "Compliance overview, export pipeline, buyer readiness cards, and farm verification status — all in one place.",
    icon: TrendingUp,
  },
  {
    title: "Real-time Sync",
    description: "Changes from field agents propagate to the cooperative dashboard in real time, keeping exporters and field teams aligned.",
    icon: Wifi,
  },
];

const crops = [
  {
    name: "Coffee",
    icon: Coffee,
    color: "amber",
    origin: "Kilimanjaro & Mbeya",
    variety: "Arabica SL28, N39, Bourbon, Kent",
    eudrRisk: "High",
    marketSize: "$43B global specialty",
    insight:
      "Tanzania produces ~75,000 MT annually. Kilimanjaro Arabica commands premium prices in European specialty markets — but zero EUDR documentation means zero EU access from Dec 2025.",
    challenges: ["No GPS farm boundaries", "Paper-only certifications", "Fragmented cooperative records", "Deforestation adjacency risk"],
  },
  {
    name: "Avocado",
    icon: Leaf,
    color: "green",
    origin: "Kilimanjaro slopes, Iringa, Mbeya",
    variety: "Hass, Fuerte, Reed",
    eudrRisk: "Medium-High",
    marketSize: "$2.4B EA export opportunity",
    insight:
      "East Africa's avocado export has grown 400% in five years. Tanzania is poised to rival Kenya — but EU buyers now demand full traceability from farm to port, not just phytosanitary certificates.",
    challenges: ["No soil/water data per-farm", "Mixed-farm tracking gaps", "Inconsistent GlobalG.A.P. adoption", "Cold chain visibility gaps"],
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
    items: ["Full certification integration (RA, UTZ, FT)", "Buyer marketplace & direct RFQ", "Carbon credit tracking", "SEA expansion (Malaysia palm oil, rubber)", "Government e-land registry API"],
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-emerald-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-amber-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-800 text-emerald-200 border border-emerald-700">
                Tanzania · East Africa · EUDR
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-900 text-amber-200 border border-amber-800">
                Shortcut Asia Challenge
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-none mb-6">
              Farm-to-Market
              <br />
              <span className="text-emerald-300">Trust Infrastructure</span>
              <br />
              for East Africa
            </h1>
            <p className="text-xl text-emerald-100 leading-relaxed max-w-2xl mb-10">
              Herb connects 2.4 million Tanzanian smallholder farmers to global coffee and avocado
              buyers through GPS-verified, EUDR-compliant traceability — built to work offline,
              in the highlands, at the farm gate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-emerald-900 font-semibold hover:bg-emerald-50 transition-colors"
              >
                View Cooperative Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/field"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-emerald-600 text-white font-semibold hover:bg-emerald-800 transition-colors"
              >
                Try Field App
                <MapPin className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-stone-200">
            {stats.map((stat) => (
              <div key={stat.value} className="px-6 py-8">
                <div className="text-3xl font-bold text-stone-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-stone-700 mb-1">{stat.label}</div>
                <div className="text-xs text-stone-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EUDR Alert Banner */}
      <section className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold text-amber-900">EUDR Enforcement Notice: </span>
              From December 2025, all coffee, cocoa, palm oil, soy, wood, rubber, cattle, and derived
              products entering the EU must prove they were not produced on deforested land.
              No documentation = no EU market access. Tanzania exports ~$200M in coffee and avocado to Europe annually.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-900 mb-4">How Herb Works</h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              Three steps from unregistered smallholder to EUDR-compliant export lot.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
                <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center mb-6`}>
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                </div>
                <div className="text-sm font-mono text-stone-400 mb-2">{step.number}</div>
                <h3 className="text-xl font-bold text-stone-900 mb-3">{step.title}</h3>
                <p className="text-stone-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Crops */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-900 mb-4">The Crops</h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              Starting with Tanzania&apos;s two highest-value smallholder export crops — both facing
              immediate EUDR risk without digital traceability.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {crops.map((crop) => (
              <div key={crop.name} className="rounded-2xl border border-stone-200 overflow-hidden">
                <div
                  className={`p-8 text-white ${
                    crop.color === "amber"
                      ? "bg-gradient-to-br from-amber-800 to-amber-950"
                      : "bg-gradient-to-br from-emerald-800 to-emerald-950"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs font-semibold opacity-70 uppercase tracking-wider mb-1">
                        {crop.origin}
                      </div>
                      <h3 className="text-3xl font-bold">{crop.name}</h3>
                      <div className="text-sm opacity-80 mt-1">{crop.variety}</div>
                    </div>
                    <crop.icon className="w-10 h-10 opacity-40" />
                  </div>
                  <div className="flex gap-6 mt-6">
                    <div>
                      <div className="text-xs opacity-60 mb-0.5">Market Size</div>
                      <div className="text-sm font-semibold">{crop.marketSize}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-60 mb-0.5">EUDR Risk</div>
                      <div className={`text-sm font-semibold ${crop.eudrRisk === "High" ? "text-red-300" : "text-amber-300"}`}>
                        {crop.eudrRisk}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-white">
                  <p className="text-stone-600 leading-relaxed mb-6">{crop.insight}</p>
                  <div>
                    <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                      Key Traceability Gaps
                    </div>
                    <ul className="space-y-2">
                      {crop.challenges.map((c) => (
                        <li key={c} className="flex items-center gap-2 text-sm text-stone-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-900 mb-4">Built for the Realities of East Africa</h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              Not another SaaS dashboard that breaks in the field. Herb is designed around actual
              connectivity, literacy, and workflow constraints.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-900 mb-4">Product Roadmap</h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto">
              Starting focused on Tanzania&apos;s EUDR crisis, scaling to East Africa and eventually Southeast Asia.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roadmap.map((phase) => (
              <div
                key={phase.phase}
                className={`rounded-2xl p-8 border ${
                  phase.status === "live"
                    ? "border-emerald-200 bg-emerald-50"
                    : phase.status === "building"
                    ? "border-amber-200 bg-amber-50"
                    : "border-stone-200 bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-6">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      phase.status === "live"
                        ? "bg-emerald-500"
                        : phase.status === "building"
                        ? "bg-amber-500"
                        : "bg-stone-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      phase.status === "live"
                        ? "text-emerald-700"
                        : phase.status === "building"
                        ? "text-amber-700"
                        : "text-stone-500"
                    }`}
                  >
                    {phase.status === "live" ? "Live" : phase.status === "building" ? "In Development" : "Roadmap"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-4">{phase.phase}</h3>
                <ul className="space-y-2">
                  {phase.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-stone-600">
                      <CheckCircle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          phase.status === "live"
                            ? "text-emerald-500"
                            : phase.status === "building"
                            ? "text-amber-500"
                            : "text-stone-300"
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEA Expansion */}
      <section className="py-16 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                  Future Expansion
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-4">The Same Problem Exists in Southeast Asia</h2>
              <p className="text-stone-400 leading-relaxed max-w-xl">
                Malaysia&apos;s 450,000+ smallholder palm oil farmers and Indonesia&apos;s rubber
                smallholders face identical EUDR documentation gaps. The Herb infrastructure —
                offline GPS capture, compliance scoring, batch traceability — translates directly.
                East Africa is the proving ground.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {["Malaysia · Palm Oil", "Indonesia · Rubber", "Vietnam · Coffee", "Philippines · Cocoa"].map((item) => (
                <div key={item} className="px-4 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-stone-900 mb-4">EUDR Enforcement Is Coming</h2>
          <p className="text-lg text-stone-500 mb-10 leading-relaxed">
            Every month without traceability is a month of coffee and avocado exports at risk.
            Herb turns the compliance mandate into a market access opportunity for East Africa&apos;s
            smallholders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition-colors"
            >
              View Cooperative Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
            >
              Read the Research
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
