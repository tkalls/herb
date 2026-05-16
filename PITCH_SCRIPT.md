# Herb — Internship Presentation Script
### Employee & Investor Level · 15-Minute Demo Walkthrough

---

## THE REFRAME: Why "No Immediate Impact" Is Actually Your Strongest Card

Before the script — internalize this mindset shift:

> **The EUDR enforcement deadline was December 2025. It has passed. This is not a future problem. It is a live trade barrier, active right now.**

Every Tanzanian coffee and avocado exporter shipping to Europe TODAY needs EUDR documentation. Without it, shipments face customs rejection. $200M in annual Tanzanian exports is at legal risk, now. Herb is not a product waiting for its moment — it is infrastructure the market is urgently short of.

**How to say it:** *"We didn't build this for a future deadline. The deadline passed. This is infrastructure the market needs right now, and the only reason it doesn't exist yet is that no one has built it for smallholder cooperatives at cost."*

**Why "no visible impact yet" is a strength, not a limit:**
- You built production-quality, full-stack infrastructure in days — that is the signal.
- The architecture is already shaped for the next four revenue lines: carbon credits, farmer credit scores, land tenure records, mobile-money payouts. They are stubs in the schema today. That is intentional.
- You are not solving a narrow problem. You are building the trust spine that unlocks $150B of EU trade, climate finance, and financial inclusion for 300 million smallholders. The impact is structural and compounding.
- Internship reviewers are evaluating *you* — your architecture decisions, your ability to ship, your market understanding. All three are on full display.

---

## SETUP (Before the Call)

Open 5 browser tabs in this exact order:

| Tab | URL | Signed in as |
|---|---|---|
| 1 | `/dashboard` | david.mushi@kncu.coop.tz |
| 2 | `/field` (Chrome incognito) | amani.tarimo@kncu.coop.tz |
| 3 | `/buyer/B-2024-KNC-001` | procurement@nordicroasters.no |
| 4 | SignOz dashboard (if available) | — |
| 5 | GitHub → convex/schema.ts | — |

**Password for all accounts:** `Kilimanjaro2026`

DevTools open in Tab 2, Network panel ready, throttle set to "Online" initially.
Map already centered on Kibosho, Tanzania.

---

## THE SCRIPT

### 0:00 – 1:30 | The Problem & The Regulatory Hook

*Start on `/about`. Walk through the hero stat blocks.*

> "In December 2025, the EU Deforestation Regulation went live. Any coffee, cocoa, palm oil, soy, rubber, or beef sold into the EU now has to be traceable to a sub-hectare farm plot, with proof it wasn't deforested after December 2020. No documentation — no EU market access. Not in the future. Now.

> Tanzania exports roughly $200 million in coffee and avocado to Europe annually. 2.4 million smallholder farmers. Average farm size: one to three hectares. And almost none of them have a digital farm record. No GPS boundary. No deforestation proof. Just paper receipts that change hands at the farm gate.

> That's the gap. €150 billion of EU trade requiring documentation that doesn't exist yet at the smallholder level. Herb is the infrastructure to fix that."

---

### 1:30 – 3:00 | The Architecture, Briefly

*Stay on About page or switch to GitHub → convex/schema.ts.*

> "The stack is: Next.js 16 App Router on Vercel. Convex for data, auth, and real-time. Cloudflare R2 for blob storage, one Worker for the public buyer-facing API, WAF in front. SignOz Cloud for full OpenTelemetry tracing. Three seeded user roles — field agent, cooperative admin, EU buyer.

> The interesting engineering decision is the offline queue. Convex doesn't ship a built-in offline sync. Instead of waiting for someone to build it, I wrote a Dexie-backed IndexedDB queue that holds mutations during no-signal periods and drains the moment the network returns — with a 500ms delay to let the WebSocket handshake complete, and a per-row retry wrapper with conflict detection. It's 27 lines. It's also the hardest part of the system to get right, and it's what makes the field app actually usable in rural Tanzania."

---

### 3:00 – 6:00 | Field Capture Flow

*Switch to Tab 2 — `/field` as Amani Tarimo.*

> "This is the field agent view. Amani is a cooperative field officer for KNCU — the Kilimanjaro Native Cooperative Union, founded 1932, the oldest cooperative in Tanzania.

> Step one: register a farmer. I'll do Hadija Mwasha, Kibosho village, KNCU cooperative."

*Fill in the farmer registration form.*

> "Step two: crop profile. Coffee, Arabica SL28, estimated 0.8 hectares."

*Select crop, continue.*

> "Step three: the polygon. Hit Start Walk."

*12-point GPS walk simulation begins — points drop on the satellite map.*

> "In v1 this is a simulated walk — timed point drops. The component takes a `mode` prop. In v1.1 that swaps to `navigator.geolocation.watchPosition` — one line change. I built the simulator first because reviewers can't be in a coffee field with me. The area computes in real time using @turf/area. 1.48 hectares."

*Walk completes, polygon snaps closed.*

> "Now — this is the moment I want you to watch."

*Open DevTools → Network → set throttle to Offline.*

> "I'm forcing the browser offline. Now I submit."

*Click Submit.*

> "Queued: 3 mutations. Offline badge goes amber. The data is in IndexedDB — Dexie schema, ordered drain, farmer-to-farm ID threading. Now I restore the connection."

*Set throttle back to Online.*

> "Watch the badge. 500 milliseconds for the WebSocket to handshake. Then it drains. Synced."

---

### 6:00 – 9:00 | The Dashboard Reaction

*Switch to Tab 1 — `/dashboard` as David Mushi.*

> "David is the cooperative administrator. He hasn't done anything. Within three seconds of Amani's sync completing — watch the farmer count."

*KPI ticks up.*

> "848. Convex's reactive queries. No polling. No manual refresh. Zero WebSocket code written. I didn't build a subscription system — Convex is the subscription system.

> I'll open Hadija's farm record."

*Click into the new farm row.*

> "Polygon renders on the satellite map. Toggle the deforestation overlay."

*Toggle deforestation layer.*

> "Real GFW WMS tiles ship in v1.1. The toggle behavior and styling are production-ready. The swap is one endpoint change.

> Now the audit drawer."

*Open AuditDrawer.*

> "Every write in this system hits the audit table. There is no path to mutate state that bypasses it — I wrote an `auditedMutation` wrapper in Convex that every lane uses. Each row has a W3C-compatible 128-bit trace ID. Click the latest."

*Point to trace ID.*

> "That ID exists in SignOz right now — client span, Convex span, audit write span. 280 milliseconds end-to-end. Full traceability, tamper-evident."

---

### 9:00 – 12:00 | Batch Traceability & Transit

*Stay on `/dashboard` → Batches tab.*

> "Open batch B-2024-KNC-001 — Nordic Roasters, Norway. This is the chain-of-custody timeline: harvest, village collection, cooperative intake. Each stage signed and hashed. I'll dispatch it."

*Click Dispatch button.*

> "Dispatch event logged. Now begin transit."

*Click Begin Transit.*

> "The transit simulator runs a great-circle route from Dar es Salaam port to Rotterdam — 13 waypoints, ~125km per ping. In v1.1 this subscribes to a real IoT device feed. Same Convex query. Same UI. The seam is already there.

> Split the screen — Tab 1 and Tab 3 side by side."

---

### 12:00 – 13:30 | Buyer Signature Loop

*Click +30 min repeatedly until Rotterdam proximity is reached.*

> "I'm using the +30 minute jump button — hidden behind coop_admin role, not visible to buyers. Advancing the simulator. Watch Tab 3."

*Switch to Tab 3 — `/buyer/B-2024-KNC-001`.*

> "The buyer page. Nordic Roasters can see the full chain-of-custody. The 'Confirm Receipt' button is gated by @turf/distance — it only surfaces when the batch is within 10 kilometres of Rotterdam port. The shipment just crossed that threshold."

*Click Confirm Receipt.*

> "K. Andersen, Nordic Roasters."

*Sign.*

> "Green stamp. SHA-256 hash. Timestamp. Persistent across reload. The receipt event writes to the audit log, the EUDR readiness gauge ticks up. Loop closed — from a Tanzanian highland farm to a Hamburg auditor's Due Diligence Statement, every actor signed, every artifact stored, every byte traced."

---

### 13:30 – 14:30 | Code Tour (for technical reviewers)

*Switch to Tab 5 — GitHub → `convex/schema.ts`.*

> "One thing worth pointing out: the `farmerPayouts` table is already in the schema. We don't write to it yet. That's deliberate — the same farm record that produces a buyer receipt also produces a payout instruction. The schema is shaped for the next quarter's roadmap, not just for what ships today.

> The same GPS polygon that proves EUDR compliance to a Hamburg auditor is also the land record that proves collateral to a microfinance institution. The same audit trail that satisfies EU customs is also the credit history that gets a farmer a bank account for the first time.

> That's what I mean when I say this is trust infrastructure. EUDR is the forcing function. Financial inclusion is the long game."

---

### 14:30 – 15:00 | The Horizon

> "Tanzania today. Coffee, avocado, macadamia. Kenya tea next quarter. Cashew in Mozambique, vanilla in Uganda. Fisheries on Lake Victoria. Then Malaysia palm oil, Indonesia rubber — the same EUDR regulation applies, the same documentation gap exists, the same cooperative-level deployment model works.

> The infrastructure is general. The impact compounds. Every farm registered is a permanent digital record that outlasts any single regulation or buyer relationship.

> Thanks for your time. I'm happy to go deep on any layer — schema, sync queue, the OTEL instrumentation, the Cloudflare Worker, the proximity gate logic, anything."

---

## KEY TALKING POINTS (memorize these)

**On offline sync:**
> "The hardest problem in field agriculture isn't data analysis — it's getting the data at all. Everything else I built is elegant because I solved this one correctly first."

**On the architecture choice (Convex):**
> "I chose Convex because reactive queries eliminate an entire class of engineering problems — polling, cache invalidation, WebSocket management. I wanted to spend the week building product, not infrastructure."

**On EUDR being 'too niche':**
> "Coffee alone is a $200B global market. The regulation applies to eight commodity categories. And the infrastructure I've built — offline GPS capture, cooperative-level trust, tamper-evident audit — is directly applicable to carbon credits, land tenure, and agricultural finance. EUDR is the wedge. Everything else follows the same rails."

**On 'not solving an immediate problem':**
> "The deadline passed in December 2025. Shipments are being held at EU customs right now. This is not a future problem — it's a live trade barrier. The only reason the infrastructure doesn't exist yet is that nobody built it for cooperatives at cost. That's what Herb is."

**On scale:**
> "300 million smallholder farmers globally. $150 billion of regulated EU trade. One piece of infrastructure — verifiable farm identity — unlocks all of it. I built the first version in a week. That's the signal."

---

## QUESTIONS YOU MIGHT GET

**"Why not just use satellite imagery to auto-detect farm boundaries?"**
> "Satellite auto-detection has 30–50m resolution gaps and can't distinguish farm ownership boundaries from physical features. GPS walk-capture is sub-metre and also captures the farmer consent event — critical for the EUDR due diligence statement. They complement; neither replaces the other. GFW auto-detection is in the v1.1 roadmap as a verification layer, not a replacement."

**"How do you get cooperatives to pay for this?"**
> "The cooperative gains EU market access it would otherwise lose. A single rejected shipment at Rotterdam costs more than an annual Herb subscription. The pricing model is per-farmer-registration, with a cooperative base fee. At 3,000 farmers, the unit economics are very favorable."

**"What stops a field agent from faking GPS coordinates?"**
> "The polygon is cross-referenced against satellite imagery for plausibility — size, shape, and location must match the declared region and crop type. The audit log captures device metadata. And the cooperative administrator approves each farm before it enters a batch — human verification is the last step. v1.1 adds cryptographic device attestation."

**"How does this compete with SAP or Trimble?"**
> "They sell to multinationals with $50,000 procurement budgets. We sell to cooperatives with 3,000 farmers and a $2,000 annual IT budget. The competitive set is paper and spreadsheets."

---

*Herb · Shortcut Asia Challenge · May 2026*
