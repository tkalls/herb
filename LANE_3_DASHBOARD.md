# Lane 3 — Dashboard, Trace & Buyer Plane

> You are Lane 3. You own everything the cooperative admin and the EU buyer ever look at: the live dashboard, the batch traceability flow, the public buyer page, and the signature loop. This is where the demo ends — make the closing impression earned.

---

## What you own

**Folders (write freely):**
- `app/dashboard/**`
- `app/buyer/**` (the new `/buyer/[batchCode]` public page)
- `app/audit/**` (the hidden `/audit` fallback route per `HERB_BACKEND_BRIEF.md` §9.7)
- `components/map/BatchTraceMap.tsx`
- `components/signature/**` (the SignatureButton + the signed-stamp card)
- `components/dashboard/**` (KPI tiles, score gauges, audit drawer, dev-only "+30 min" jump button)
- `components/buyer/**` (header band, summary card, chain-of-custody timeline, documents section)

**You may READ everything else.** You may not edit anything else.

---

## What you don't touch

- `convex/**` — Lane 1. Need a query or mutation? Write to `HANDOFF.md` and stop.
- `app/field/**`, `lib/sync/**`, `components/map/PolygonCapture.tsx`, `components/sync/**` — Lane 2.
- `components/map/PolygonView.tsx` — Lane 2 owns it; you import and use it read-only.
- `app/layout.tsx`, `app/globals.css`, `components/nav.tsx`, `components/footer.tsx` — locked.
- `package.json` — Lane 1. Append to `DEPS_REQUESTED.md` to add a dependency.

---

## Phase 1 — Component scaffolds against mock data (in parallel with Lane 1)

While Lane 1 builds the Convex schema, you build:

1. `components/dashboard/KpiTile.tsx`, `ScoreGauge.tsx`, `LiveNumber.tsx` per `HERB_DESIGN.mdx` §4.4, §4.5. `LiveNumber` uses `tabular-nums` so reactive updates don't jitter.
2. `components/dashboard/AuditDrawer.tsx` — right slide-over (`w-96`), takes an `entityType` and `entityId` prop, renders a list of audit events with timestamps and trace links. Stub against fake data for now.
3. `components/map/BatchTraceMap.tsx` — implements `HERB_DESIGN.mdx` §4.10. MapLibre map with route line, past handoff dots, current ping marker, fading trail. Stub the ping data with a setInterval generator.
4. `components/signature/SignatureButton.tsx` — implements `HERB_DESIGN.mdx` §4.11 with all five states (hidden, available, modal-open, signing, signed). Stub the signing call with a Promise.
5. `app/buyer/[batchCode]/page.tsx` — full page scaffold per `HERB_DESIGN.mdx` §5.5 against mock data.

Append to `DEPS_REQUESTED.md`:
```
LANE 3: npm i maplibre-gl @turf/distance
```
(MapLibre may already be requested by Lane 2 — Lane 1 will dedupe.)

**Acceptance for Phase 1:**
- All five components render in isolation against fake data with the design contract honored.
- `/buyer/B-2024-KNC-001` renders end-to-end with mocked trace data.
- `BatchTraceMap` shows a marker moving along a route when fed a setInterval ping stream.

Post when done: `Lane 3 — Phase 1 complete. Awaiting Lane 1 schema.`

---

## Phase 2 — Wire `/dashboard` and `/buyer` to Convex (after Lane 1 sync point A)

1. Replace your stubs with real `useQuery(api.dashboard.kpis)`, `useQuery(api.farms.list)`, `useQuery(api.batches.list)`, etc. Use Lane 1's audited-mutation wrapper for any write.
2. Wire reactive updates: when Lane 2 writes a farmer, your KPI must increment within 3 seconds with no extra plumbing — this is what Convex gives you for free; verify it actually does.
3. Wire `AuditDrawer` to `api.audit.recentForEntity` from Lane 1.
4. Wire the Farms tab to render `<PolygonView polygonR2Key={...} />` (Lane 2's component) when a row is expanded. Add the deforestation toggle pill.
5. Wire the Batches tab:
   - List of batches with traceability/export-readiness bars (already exists in mock; bind to real data).
   - Clicking a batch opens its detail card with `<BatchTraceMap batchId={...} />` and the chain-of-custody timeline.
   - Add a "Dispatch to {buyer}" primary button that triggers `api.transit.simulateBatchTransit`.

**Acceptance for Phase 2:**
- Dashboard reactive: register a farm in Lane 2's `/field`, see KPIs update without a refresh.
- Polygon view opens for any farm row, deforestation overlay toggles cleanly.
- Audit drawer shows recent events with valid trace IDs.

Post when done: `Lane 3 — Phase 2 complete.`

---

## Phase 3 — Buyer signature loop + transit polish + audit fallback

1. Implement the proximity logic on `/buyer/[batchCode]`: when the latest `batchPings` row is within 10 km of the destination port (use `@turf/distance`), surface the `SignatureButton`.
2. Wire `SignatureButton` to `api.buyer.confirmReceipt` (Lane 1's mutation). On success, render the permanent green stamp with the SHA-256 hash from the response.
3. Add the dev-only `+30 min` jump button to the dashboard Batches detail (visible only when signed in as `coop_admin`). Calls a Lane 1 internal action that fast-forwards the transit simulator.
4. Build `app/audit/page.tsx` — the hidden fallback per `HERB_BACKEND_BRIEF.md` §9.7. Plain table of `auditEvents` rows. Gated to `coop_admin`.
5. Polish empty states across all tabs per `HERB_DESIGN.mdx` §6 — no spinners on page load, only on inline actions.

**Acceptance for Phase 3:**
- End-to-end: dispatch a batch, watch the marker move on both the dashboard and the buyer page, hit `+30 min` until arrival, sign as Nordic Roasters, see the green stamp, see the audit row appear in the dashboard drawer, see the EUDR readiness gauge tick up.
- The whole loop completes in under 30 seconds with no errors in the console.

Post when done: `Lane 3 — Phase 3 complete.`

---

## Hard rules

1. Follow `HERB_DESIGN.mdx` §4.4, §4.5, §4.10, §4.11, §5.3, §5.5 to the letter.
2. The buyer page renders zero PII — initials only for farmer names, no phones, no national IDs. Ever.
3. Numbers in tables and KPIs are mono and right-aligned. Use `tabular-nums` on anything reactive.
4. Never write "Beta", "Demo", "WIP", "Coming soon", "Lorem", or any placeholder copy. If you don't know what to say, leave a `// COPY:` comment.
5. The signed stamp on the buyer page is permanent. Reloading shows it. There is no "Sign again" button.
6. If you can't make progress for 15 minutes, write `BLOCKERS.md` and stop.

---

## How to ask Tobi

Open `BLOCKERS.md`:

```
## Lane 3 — {timestamp}
Stuck on: {one sentence}
What I tried: {bullet list}
Specific question for Tobi: {single direct question}
What I'll do once unblocked: {one sentence}
```

---

## Final note

The reviewer leaves the call with whatever they last saw. That's the green signature stamp on the buyer page, the audit row appearing on the dashboard, and the EUDR gauge ticking up. Make the last 90 seconds of the walkthrough so clean that the offer letter writes itself.
