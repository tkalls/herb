# Lane 1 — Data Plane

> You are Lane 1. You own the data. Every byte of state in Herb passes through you. The other two lanes consume what you produce.

---

## What you own

**Folders (write freely):**
- `convex/**`
- `convex/_generated/**` (auto-generated, just commit)
- `convex/_lib/**` (your private utilities like the audited-mutation wrapper)
- `lib/seed.ts` (the seeding helper imported by `convex/seed.ts`)
- `package.json` (you are the ONLY lane that runs `npm install`)
- `.env.local` (you maintain the canonical version)
- `tsconfig.json` (only if Convex needs adjustments)

**Files you wire (one-time, then leave alone):**
- `app/layout.tsx` — only to add `<ConvexProviderWithAuth>` once. Do not change anything else in this file.

**You may READ everything else.** You may not edit anything else.

---

## What you don't touch

- Anything inside `app/field/**` — that's Lane 2.
- Anything inside `app/dashboard/**`, `app/buyer/**` — that's Lane 3.
- Anything inside `components/map/**`, `components/sync/**`, `components/signature/**` — Lane 2 / Lane 3.
- `app/globals.css` — design contract, locked.
- `components/nav.tsx`, `components/footer.tsx` — Lane 3 may add nav items if needed; you do not touch.

If you need a UI change to validate your work, write a request to `HANDOFF.md` and stop on that change. Do not silently edit Lane 2 or Lane 3 files.

---

## Phase 1 — Schema, auth, seed, audited mutation wrapper

Read `HERB_BACKEND_BRIEF.md` §4 Phase 1.1 through 1.4 for the canonical instructions. Your additions on top of that:

1. After running `npx convex dev`, immediately commit `convex/_generated/api.d.ts` so Lanes 2 and 3 can import types.
2. Build `convex/_lib/audited.ts` that exports a higher-order `auditedMutation(name, handler)` which wraps any Convex mutation, captures the OpenTelemetry trace ID, computes a diff, and writes the audit row before returning the handler's result. Lanes 2 and 3 will use this for every write.
3. Seed users go into `CREDENTIALS.md` (gitignored). Do not write passwords into committed files.
4. Verify the dashboard still renders identically to the mock-data version. If it doesn't, your queries are wrong; do not advance to Phase 2.

**Acceptance for Phase 1:**
- `npx convex dev` runs clean.
- `npx convex run seed:run` populates KNCU + 5 farmers + 8 farms + 4 batches.
- `convex/_generated/api.d.ts` is committed.
- `convex/_lib/audited.ts` exports a working wrapper with one passing example.
- `app/dashboard/page.tsx` reads from Convex and looks identical to before.

When done, post in chat: `Lane 1 — Phase 1 complete. Lanes 2 and 3 unblocked.`

---

## Phase 2 — EUDR scoring, R2 presign, audit log queries

Read `HERB_BACKEND_BRIEF.md` §4 Phase 2.5 (R2) and 2.6 (EUDR).

Add:
- A `convex/audit.ts` query `recentForEntity(entityType, entityId)` that returns the last 50 audit rows with their trace IDs, used by Lane 3's audit drawer.
- A `convex/farms.ts` mutation `attachPolygon(farmId, r2Key, polygonInline?, areaHa)` wrapped by `auditedMutation` — Lane 2 calls this after a polygon is captured.

**Acceptance for Phase 2:**
- A polygon GeoJSON Blob can be PUT to R2 via the presigned URL returned by `convex/r2.ts`.
- `attachPolygon` writes both the farm row AND an audit event with a non-null trace ID.
- `recentForEntity` returns rows in reverse chronological order.

When done, post: `Lane 1 — Phase 2 complete.`

---

## Phase 3 — Buyer Worker + OTEL + SignOz

Read `HERB_BACKEND_BRIEF.md` §4 Phase 3.1 (Worker), 3.2 (OTEL), 3.3 (SignOz dashboards), 3.5 (transit ping action).

Add:
- `convex/transit.ts` — `simulateBatchTransit(batchId)` action that drops a `batchPings` row every 4 seconds along a great-circle path.
- `convex/buyer.ts` — `traceByCode(code)` query for the public buyer API (no PII, only initials).
- `workers/buyer-api/` — the Cloudflare Worker. Deploy via `wrangler`.
- `lib/otel.ts` — initializes the Node SDK on the Convex side and the browser SDK on the client side. Export the browser tracer for Lane 2 to import.

**Acceptance for Phase 3:**
- `curl https://api.herb.shamba/v1/batches/B-2024-KNC-001/trace` returns JSON in under 200 ms.
- SignOz Cloud shows traces from a fresh seed run with the action span tree intact.
- `simulateBatchTransit` runs and the dashboard pings query returns growing rows in real time.

When done, post: `Lane 1 — Phase 3 complete.`

---

## Hard rules

1. Type everything. No `any` in Convex code.
2. Every mutation goes through `auditedMutation`. No exceptions.
3. Never delete a Convex deployment without confirming with Tobi first.
4. Never commit `.env.local` or `CREDENTIALS.md`.
5. If `package.json` needs a dependency that another lane requested, install it AT THE START of your session, commit, then continue.
6. If you can't make progress for 15 minutes, write `BLOCKERS.md` with the specific question and stop.

---

## How to ask Tobi

Open `BLOCKERS.md` in the project root and write:

```
## Lane 1 — {timestamp}
Stuck on: {one sentence}
What I tried: {bullet list}
Specific question for Tobi: {single direct question}
What I'll do once unblocked: {one sentence}
```

Then stop. Do not invent answers. Tobi will reply in chat and tell you to continue.

---

## Final note

You're the foundation. If your schema is wrong, both other lanes wobble. Get Phase 1 right before you let yourself be tempted by Phase 2. Backtest each acceptance criterion yourself before declaring done.
