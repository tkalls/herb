# Herb v1 Pro — Handoff Document

**Date:** 2026-05-11  
**Session:** Initial build for Shortcut Asia Challenge  
**Status:** Complete, builds clean, all 4 routes live

---

## What Was Built

Herb is a farm-to-market trust infrastructure platform for East African smallholder agriculture, initially focused on Tanzania coffee and avocado. It was built from scratch in a single session as a Next.js 16 App Router app with TypeScript and Tailwind v4.

The app demonstrates how cooperatives can register farmers, capture GPS farm boundaries offline, score EUDR compliance, manage batch traceability, and present export-ready documentation to EU buyers.

---

## Project Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (no shadcn — all custom components) |
| Icons | lucide-react |
| Fonts | Geist Sans + Geist Mono (via next/font/google) |
| Data | All mock — `lib/data.ts` |
| Dev server | `npm run dev` → localhost:3000 |

---

## File Structure

```
herb/
├── app/
│   ├── globals.css          — warm stone-50 base, custom scrollbar
│   ├── layout.tsx           — root layout with Nav + Footer
│   ├── page.tsx             — / landing page (server component)
│   ├── field/
│   │   └── page.tsx         — /field mobile field agent flow (client)
│   ├── dashboard/
│   │   └── page.tsx         — /dashboard cooperative dashboard (client)
│   └── about/
│       └── page.tsx         — /about research rationale (server)
├── components/
│   ├── nav.tsx              — sticky nav with active link highlighting
│   └── footer.tsx           — dark footer with links
├── lib/
│   └── data.ts              — all mock data types and seed data
└── HERB_V1_PRO_HANDOFF.md   — this file
```

---

## The Four Routes

### `/` — Landing Page
- Dark emerald hero: "Farm-to-Market Trust Infrastructure for East Africa"
- Stats row: 2.4M farmers, 87% undocumented, €150B EUDR exposure, Dec 2025 deadline
- Amber EUDR alert banner
- "How it Works" 3-step cards (Register & Map → Verify & Score → Connect & Export)
- Coffee + Avocado crop cards with real Tanzanian market context and EUDR risk assessment
- 6-feature grid (GPS capture, offline-first, EUDR engine, batch traceability, dashboard, sync)
- Roadmap: Now / Next 6 months / 12–18 months
- SEA expansion section (Malaysia palm oil, Indonesia rubber, Vietnam coffee, Philippines cocoa)
- CTA section linking to dashboard + about

### `/field` — Field Agent Mobile App
- **Client component** with 4-step multi-step form (useState)
- Sync status bar: green (online) / amber (offline, data queued)
- Step 0 — Farmer Registration: name, phone, national ID, village, district, cooperative select
- Step 1 — Crop Profile: coffee/avocado toggle, variety select, estimated area, certifications multi-select
- Step 2 — GPS Polygon Capture: SVG polygon preview on satellite-style dark background, animated GPS capture button, captured point coordinates list, deforestation overlap indicator
- Step 3 — Review & Submit: farmer/crop/GPS summary, "what happens next" checklist
- Submit confirmation screen with generated farm ID and sync queue status
- "Register Another Farm" reset flow

### `/dashboard` — Cooperative Dashboard (KNCU)
- **Client component** with crop filter tabs (All / Coffee / Avocado) and page tabs (Overview / Farms / Batches / Buyers)
- Header: Kilimanjaro Native Cooperative Union, 847 farmers, 1203 farms, 1842 ha
- Overview tab:
  - 4 KPI cards (farms, verified, EUDR compliant, active batches)
  - SVG compliance gauges: Overall 78/100, EUDR Readiness 71/100
  - Sub-scores for documentation, GPS coverage, deforestation check, certification
  - Farm verification breakdown (verified 892, pending 187, needs review 64, unverified 60)
  - EUDR gap warning with remediation CTA
  - Recent batches summary strip
- Farms tab: sortable table with farm ID, farmer name, crop/variety, area, verification status badge, EUDR icon, deforestation risk tag, last sync date; alert banners for farms with notes
- Batches tab: full batch cards with traceability/export readiness score bars, EUDR declaration IDs, buyer details, weight, processing dates
- Buyers tab: 4 buyer cards (Nordic Roasters/Norway, Al-Baida/UAE, Blue Bottle/USA, Greenfield/UK) with contract values, export readiness bars, buyer marketplace roadmap teaser

### `/about` — Research & Product Rationale
- **Server component**, long-form with sticky sidebar jump nav
- Sections: The Problem → EUDR Explained → Tanzania Context → Coffee deep-dive → Avocado deep-dive → Supply Chain breakdown → How Herb Solves It → Technical Architecture → SEA Expansion → Vision
- Supply chain actor-by-actor diagram (farmer → village → cooperative → processor → exporter → EU buyer) showing where traceability breaks
- Architecture decision table (9 rows: frontend through auth)
- SEA country cards: Malaysia (palm oil, 450K smallholders), Indonesia (rubber, 16M), Vietnam (coffee), Philippines (cocoa)
- Ends with vision quote card and CTAs

---

## Mock Data (`lib/data.ts`)

**Cooperative:** Kilimanjaro Native Cooperative Union (KNCU), Moshi Rural, Kilimanjaro, Tanzania

**Farmers (5):**
- F001 Amina Wanjiku Mbeki — Kibosho, 2 farms
- F002 Joseph Mwanga Msemwa — Lyamungu, 1 farm
- F003 Grace Nalishebo Temba — Marangu, 2 farms
- F004 Bernard Kaunda Mwita — Uru, 3 farms
- F005 Fatuma Rashid Ally — Kibosho, 1 farm

**Farms (8):**
- FM001 — Coffee Arabica SL28, 1.8ha, Verified, EUDR compliant (Amina)
- FM002 — Coffee Arabica N39, 2.4ha, Verified, EUDR compliant (Joseph)
- FM003 — Avocado Hass, 0.9ha, Verified, EUDR compliant (Grace)
- FM004 — Coffee Arabica Bourbon, 1.2ha, Pending, not compliant (Grace) — satellite check pending
- FM005 — Avocado Hass, 3.1ha, Verified, EUDR compliant (Bernard)
- FM006 — Avocado Fuerte, 1.4ha, Needs Review, not compliant (Bernard) — forest buffer overlap
- FM007 — Coffee Arabica Kent, 0.7ha, Verified, EUDR compliant (Bernard)
- FM008 — Coffee Arabica SL28, 1.1ha, Unverified, no polygon (Fatuma)

**Batches (4):**
- B-2024-KNC-001 — Coffee Arabica Blend, 2840kg, 3 farmers, Nordic Roasters AS (Norway), Ready, trace 96, EUDR-2024-TZ-00447
- B-2024-KNC-002 — Avocado Hass, 5200kg, 2 farmers, Al-Baida Fresh Exports (UAE), In Transit, trace 91, EUDR-2024-TZ-00448
- B-2024-KNC-003 — Coffee SL28 Single Origin, 1600kg, 2 farmers, Blue Bottle Coffee (USA), Preparing, trace 84
- B-2024-KNC-004 — Avocado Mixed, 3800kg, 2 farmers, Greenfield Produce Ltd (UK), Preparing, trace 73

---

## Design System

- **Background:** `stone-50` (#fafaf9) — warm off-white
- **Primary:** `emerald-700/800/900` — greens for agriculture
- **Accent:** `amber-500/600` — harvest gold for alerts and coffee
- **Cards:** white with `stone-200` border, `shadow-sm`
- **Danger/review:** `red-50` / `red-500`
- **Fonts:** Geist Sans (UI), Geist Mono (IDs, coordinates, scores)
- **Corner radius:** `rounded-xl` (cards), `rounded-2xl` (hero cards), `rounded-lg` (inputs)

---

## What's Intentionally Not Built Yet

These are documented as roadmap items, not bugs:

- Real GPS capture (Web Geolocation API integration) — polygon is mocked SVG
- Real deforestation cross-check (GFW API integration) — scores are mock
- Real offline sync (IndexedDB / service worker) — sync status is mock state
- Real satellite imagery layer on the field map
- Multi-cooperative federation (single KNCU instance only)
- SMS alert system for farmer verification status
- Real buyer marketplace / RFQ flow
- Full certification integration (RA, UTZ, Fair Trade APIs)
- Carbon credit tracking module
- SEA expansion (Malaysia, Indonesia — architecture designed for it)
- Government e-land registry API
- Real auth (no login system — open demo)

---

## Next Session Priorities (Suggested)

1. **Real GPS integration** — wire the Web Geolocation API in the field page Step 2, capture actual lat/lng points, compute real polygon area using Turf.js
2. **Interactive map** — add Leaflet map to the polygon capture step and the dashboard farm table rows
3. **Offline sync simulation** — implement a proper sync queue using localStorage, show queued item count, simulate sync on connectivity change
4. **CLAUDE.md** — write a proper CLAUDE.md with the design system, data model, and route architecture for the project
5. **Demo script** — write a structured 5-minute demo walkthrough for the Shortcut Asia presentation
6. **Mobile polish on /field** — test on actual mobile viewport, ensure tap targets are correct, add swipe gestures between steps
7. **Farmer search** — the "Existing Farmer Found" chip in Step 0 is hardcoded; make it a real search over the mock farmers array
8. **Dashboard charts** — replace the CSS score bars with richer visualisations (recharts or similar) for the compliance gauges

---

## Running the App

```bash
cd /Users/tobi/Desktop/herb
npm run dev        # starts on localhost:3000
npm run build      # production build (clean, no TS errors as of handoff)
```

Build output at handoff:
```
Route (app)
├ ○ /
├ ○ /about
├ ○ /dashboard
└ ○ /field
✓ Compiled successfully, 0 TypeScript errors
```
