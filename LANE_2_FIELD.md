# Lane 2 — Field & Sync Plane

> You are Lane 2. You own the field-agent experience: the form, the offline queue, and the polygon capture map. The reviewer will spend a third of the call inside your code. Make it feel inevitable.

---

## What you own

**Folders (write freely):**
- `app/field/**`
- `lib/sync/**` (the Dexie queue and `useSyncQueue` hook)
- `components/map/PolygonCapture.tsx`
- `components/map/PolygonView.tsx` (used by both you and Lane 3 — but you build it; Lane 3 imports it read-only)
- `components/map/_lib/**` (private map utilities like the simulated-walk path generator)
- `components/sync/**` (the sync badge, queued chip, conflict modal stub)

**You may READ everything else.** You may not edit anything else.

---

## What you don't touch

- `convex/**` — that's Lane 1. If you need a query/mutation that doesn't exist, write a request to `HANDOFF.md` and stop on that change. Lane 1 will add it.
- `app/dashboard/**`, `app/buyer/**` — Lane 3.
- `app/layout.tsx`, `app/globals.css`, `components/nav.tsx`, `components/footer.tsx` — locked.
- `package.json` — Lane 1 owns. To add a dependency, append a line to `DEPS_REQUESTED.md` and wait.

---

## Phase 1 — Component scaffolds against mock data (in parallel with Lane 1)

While Lane 1 builds the Convex schema, you build:

1. `lib/sync/queue.ts` — Dexie database, types, helpers (per `HERB_BACKEND_BRIEF.md` §4 Phase 2.1).
2. `lib/sync/useSyncQueue.ts` — the hook that reports `{online, queued, draining, lastError}`. Stub the Convex mutation calls with a `Promise.resolve()` for now.
3. `components/sync/SyncBadge.tsx` — implements the four states from `HERB_DESIGN.mdx` §4.6.
4. `components/map/_lib/simulatedWalk.ts` — given a `villageCenter` and a seed, returns a 12-point closed polygon with vertices walking a ~150m perimeter. Pure function, fully unit-testable.
5. `components/map/PolygonCapture.tsx` — the visual contract from `HERB_DESIGN.mdx` §4.9 against MapLibre. Wire the simulated walk so pressing "Start walk" drops points every 1.5s and snaps closed at vertex 12. Call `onComplete(geojson, areaHa)` with `@turf/area` results.
6. `components/map/PolygonView.tsx` — read-only viewer that takes either a presigned R2 URL or an inline GeoJSON.

Append to `DEPS_REQUESTED.md`:
```
LANE 2: npm i maplibre-gl dexie @turf/area @turf/helpers @turf/buffer
```

**Acceptance for Phase 1:**
- `PolygonCapture` runs in isolation: hit "Start walk", see 12 points draw a polygon over ~18 seconds on a satellite map, see area in the bottom-left chip.
- `useSyncQueue` reports correct status when network is toggled in DevTools.
- `SyncBadge` renders all four states correctly when fed mock state.

Post when done: `Lane 2 — Phase 1 complete. Awaiting Lane 1 schema.`

---

## Phase 2 — Wire `/field` to Convex (after Lane 1 sync point A)

Once Lane 1 posts schema-complete:

1. Replace your stubbed mutation calls with real `useMutation(api.farmers.create)`, `useMutation(api.farms.create)`, `useMutation(api.farms.attachPolygon)`. Use Lane 1's `auditedMutation` wrapper — it's transparent to you.
2. Wire `useSyncQueue` to actually drain the Dexie queue against these mutations.
3. Wire the `/field` page step-by-step:
   - Step 0: farmer creation form, on submit pushes a `farmer.create` mutation to the Dexie queue.
   - Step 1: crop profile (coffee / avocado / macadamia toggle, variety select, area, certifications). Stays local until Step 3 submit.
   - Step 2: `<PolygonCapture villageCenter={...} onComplete={(geojson, areaHa) => ...}>` — the geojson + area get attached to the in-flight farm draft.
   - Step 3: review, then a single "Submit" button that pushes a `farm.create` mutation (with the polygon as inline GeoJSON if < 64 KB, else uploads to R2 first via presigned URL).
4. Top of `/field`: render `<SyncBadge status={...} />` always-visible.
5. Add the existing-farmer search to Step 0 (currently hardcoded per the original handoff).

**Acceptance for Phase 2:**
- Open `/field` in a desktop browser, sign in as Amani Tarimo, register a farmer end-to-end including a 12-point simulated walk, hit submit while DevTools is set to "Offline", see the queued: 1 badge, toggle network back on, see the dashboard tick up within 3 seconds.
- The polygon viewable on the dashboard is the exact polygon walked.
- The audit log shows three entries: `farmer.create`, `farm.create`, `farm.attachPolygon`.

Post when done: `Lane 2 — Phase 2 complete.`

---

## Phase 3 — Polish, conflict stub, fallbacks

1. `components/sync/ConflictModal.tsx` — stub UI per `HERB_DESIGN.mdx` §4.12. No real merge logic in v1. Render only when a write fails with a "conflict" error from Convex; let the user pick "Keep mine".
2. Mobile polish: open `/field` in DevTools mobile viewport (iPhone 14), confirm tap targets ≥ 48px, no horizontal scroll, sticky stepper visible.
3. Implement the fallback path in `HERB_BACKEND_BRIEF.md` §9.3 — if the R2 presign call fails, send the polygon as an inline base64 string in the `attachPolygon` mutation (Lane 1's mutation already supports this column).
4. Add a small visible "Switch role" footer link on `/field` (signs out and bounces to `/login`) — useful during the walkthrough call.

**Acceptance for Phase 3:**
- Conflict modal renders correctly when forced.
- `/field` works on mobile viewport.
- R2-fallback path works (toggle by setting an `R2_FORCE_FAIL=1` env var).

Post when done: `Lane 2 — Phase 3 complete.`

---

## Hard rules

1. Follow `HERB_DESIGN.mdx` §4.6 (Sync badge), §4.7 (Form step), §4.9 (PolygonMap) to the letter.
2. No `navigator.geolocation` calls in v1. Pass `mode="simulated"` to PolygonCapture. The seam for v1.1 is a prop, not new code.
3. Never write the word "simulated", "demo", "test", or "mock" in any user-visible string.
4. The polygon capture must work without a backend (against stubbed mutations) — useful for offline dev.
5. If you can't make progress for 15 minutes, write `BLOCKERS.md` and stop.

---

## How to ask Tobi

Open `BLOCKERS.md`:

```
## Lane 2 — {timestamp}
Stuck on: {one sentence}
What I tried: {bullet list}
Specific question for Tobi: {single direct question}
What I'll do once unblocked: {one sentence}
```

---

## Final note

The reviewer's first impression of Herb is the field flow. Stepper jitter, an unstyled map tile, an off-brand button, a placeholder error message — any of those breaks the spell. Read the design MDX twice. Mimic the existing components in `/components/`. Ship clean.
