# Herb v1 — Backend Build Brief for Claude Code

> **Audience:** Claude Code, working inside `/Users/tobi/Desktop/herb`.
> **Deadline:** Friday 2026-05-15. Today is Tuesday 2026-05-12.
> **Status:** Frontend complete (4 routes, mock data). Backend is greenfield.
> **Source of truth for what exists:** `HERB_V1_PRO_HANDOFF.md` in the repo root. Read it first.
> **Design contract:** `HERB_DESIGN.mdx` (this file's sibling). Treat as binding for any new UI.

---

## 0. Read-First Checklist for Claude Code

Before writing any code, in this exact order:

1. `Read` `HERB_V1_PRO_HANDOFF.md` — full project context.
2. `Read` `HERB_DESIGN.mdx` — design system, do-not-violate UI rules.
3. `Read` `lib/data.ts` — current shape of mock data (this becomes the Convex schema).
4. `Read` `app/globals.css` — Tailwind v4 tokens already in place.
5. `Read` `app/field/page.tsx` and `app/dashboard/page.tsx` — the two screens we will wire to Convex.
6. `Glob` the repo to confirm no other files have been added since the handoff.
7. Only then start Phase 1.

If anything in this brief conflicts with what is actually in the repo, **trust the repo and ask Tobi**.

---

## 1. North Star

Herb is farm-to-market trust infrastructure for East African smallholder agriculture. v1 covers coffee, avocado, and macadamia across Tanzania and Kenya, with a schema and design intentionally shaped so tea, cashew, vanilla, fisheries, and adjacent finance products (farmer credit, land tenure, carbon, mobile-money payouts) drop in without migration.

The Friday 15-minute walkthrough call proves **three** things live, in one continuous flow:

1. A field agent registers a farmer and captures a farm polygon on a satellite map, the polygon draws live as the walk records, area auto-computes, and the cooperative dashboard updates in real time. With the browser's network forced offline mid-flow, the write queues locally and replays automatically when network returns.
2. The dashboard shows the new farm overlaid on a styled deforestation layer, with an EUDR compliance score computed and a tamper-evident audit trail (every write linked to a SignOz trace).
3. A batch built from that farm moves through the full traceability loop — harvest → village → cooperative → processor → exporter → buyer — with simulated live GPS pings during transit, ending with the EU buyer cryptographically signing "received" from the public trace page, which closes the loop and writes the final audit event.

**Scope contract for v1 (read carefully):** All three moments are demonstrated end-to-end in the browser. The function is visible and works. Polygon capture is a simulated walk (timed point-drops on the map) — real `navigator.geolocation` ships as v1.1 once a real field agent is in hand. Deforestation overlay is a stylized layer with deterministic mock risk pixels — real Global Forest Watch tile ingestion is v1.1. Transit GPS pings are simulated along a great-circle path — real IoT device feeds are v1.1. Everything else (Convex, sync queue, audit log, buyer signature, R2 storage, SignOz tracing) is real.

The cut is deliberate: build clean, modular, layered. v1 is the shape of the system. v1.1 plugs real sensors into the same sockets.

---

## 2. Architecture Decision Record

| Layer | Choice | Why |
|---|---|---|
| App data + business logic | **Convex** | Reactive queries = dashboard updates with zero websocket code; built-in auth; TypeScript end-to-end. |
| Offline mutation queue | **Dexie (IndexedDB) on the client** | Convex doesn't ship a built-in offline queue; Dexie + a replay hook is the proven pattern. |
| Blob storage (GPS GeoJSON, batch PDFs, farmer photos) | **Cloudflare R2** | S3-compatible, 10 GB free, no egress fees. Convex stores the R2 object key, not the blob. |
| Public buyer API | **Cloudflare Worker** at `api.herb.<domain>` | Read-only `/v1/batches/:id/trace` endpoint. Buyers never hit Convex directly. |
| Edge security | **Cloudflare WAF + rate-limit** | OWASP managed rules on the Worker route, 100 req/min/IP. |
| Observability | **SignOz Cloud (free tier)** | OpenTelemetry traces from Convex actions + the field sync queue. 30-day retention, no card. |
| Auth | **Convex Auth** | Password + magic link. Seed three production-named users. |
| Map rendering | **MapLibre GL JS** | Open-source fork of Mapbox GL, no token, no quotas, free forever. Uses MapTiler or Stadia tiles via API key (free tier). |
| Map tiles (satellite + streets) | **MapTiler Cloud free tier** | 100k tile loads/month. Streets + satellite styles. No card. Swap to self-hosted tiles post-launch. |
| Deforestation overlay | **Global Forest Watch tile service** | Free public WMS tiles for forest loss 2001–2024. Static overlay on the dashboard map. No API key. |
| Polygon math (area, centroid, intersect) | **@turf/turf** (modular imports) | Pure client-side; powers area + deforestation buffer check. |
| Live transit GPS (v1) | **Convex action emitting fake pings** | Simulates a truck/ship moving along a great-circle path during the launch walkthrough. Swap for real IoT later. |
| Frontend host | **Vercel** | Native Next.js 16 support, free hobby tier, edge revalidation works with Convex. |
| Domain + DNS | **Cloudflare** | Required for the WAF + Worker route to make sense. |

**What we explicitly are NOT building before Friday:** real GFW deforestation API, multi-cooperative federation, SMS alerts, certification API integrations, carbon credits, real e-land registry. All mocked with a clear `// TODO(post-friday):` comment.

---

## 3. Account Provisioning (you have none of these yet)

Tobi needs to do these BEFORE Claude Code can run. Estimated total: 45 minutes.

1. **Cloudflare** — sign up at `dash.cloudflare.com`. Register **`herb.shamba`** (Swahili for "farm", locked as the production domain — about $15/yr on Cloudflare Registrar at cost, no markup). Enable R2 (no credit card needed for the free tier as of 2026, but verify on the dashboard).
2. **Convex** — `npx convex dev` from inside `/Users/tobi/Desktop/herb`. Pick a deployment name like `herb-prod`. Save the `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` values into `.env.local`.
3. **SignOz Cloud** — sign up at `signoz.io/teams`. Free tier, 30-day retention. Save the ingestion key and OTLP endpoint into `.env.local` as `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS`.
4. **Vercel** — connect the GitHub repo (after Tobi initializes git and pushes). Add the same env vars to the Vercel project.

Claude Code should print a checklist at the end of Phase 0 reminding Tobi which env vars are missing.

---

## 4. Phase Plan

Three phases mapped to Tuesday / Wednesday / Thursday. Friday is rehearsal + polish only.

### Phase 1 — Tuesday: Convex schema + auth + seed (target: 6 hrs)

**1.1 Install + init**
- `npm i convex @convex-dev/auth`
- `npx convex dev` — creates `convex/` folder, generates client.
- Wire `ConvexProviderWithAuth` into `app/layout.tsx` (NOT a new layout — modify the existing one).

**1.2 Schema** — file `convex/schema.ts`. Mirror `lib/data.ts` exactly so the dashboard keeps rendering during migration. Tables:

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  cooperatives: defineTable({
    name: v.string(),
    code: v.string(),               // "KNCU"
    region: v.string(),
    district: v.string(),
    country: v.string(),
  }).index("by_code", ["code"]),

  farmers: defineTable({
    cooperativeId: v.id("cooperatives"),
    code: v.string(),               // "F001"
    fullName: v.string(),
    phone: v.string(),
    nationalId: v.string(),
    village: v.string(),
    // Mobile-money payout hooks. v1 stores the rail + masked number; actual
    // payout flow ships post-launch but the schema is ready so no migration.
    payoutRail: v.optional(v.union(v.literal("mpesa"), v.literal("mtn_momo"), v.literal("airtel_money"), v.literal("bank"))),
    payoutNumberMasked: v.optional(v.string()),
    registeredBy: v.id("users"),    // field agent
    registeredAt: v.number(),
  }).index("by_coop", ["cooperativeId"])
    .index("by_code", ["code"]),

  farms: defineTable({
    farmerId: v.id("farmers"),
    code: v.string(),               // "FM001"
    crop: v.union(v.literal("coffee"), v.literal("avocado"), v.literal("macadamia")),
    variety: v.string(),
    estimatedAreaHa: v.number(),
    certifications: v.array(v.string()),
    polygonR2Key: v.optional(v.string()),   // R2 object key for the GeoJSON
    polygonPreview: v.optional(v.array(v.object({ lat: v.number(), lng: v.number() }))), // first 8 points for thumbnail
    verificationStatus: v.union(
      v.literal("unverified"),
      v.literal("pending"),
      v.literal("needs_review"),
      v.literal("verified"),
    ),
    eudrCompliant: v.boolean(),
    eudrScore: v.number(),          // 0-100
    deforestationRisk: v.union(v.literal("none"), v.literal("low"), v.literal("medium"), v.literal("high")),
    notes: v.optional(v.string()),
    lastSyncedAt: v.number(),
  }).index("by_farmer", ["farmerId"])
    .index("by_coop_status", ["farmerId", "verificationStatus"]),

  batches: defineTable({
    cooperativeId: v.id("cooperatives"),
    code: v.string(),               // "B-2024-KNC-001"
    crop: v.string(),
    description: v.string(),
    weightKg: v.number(),
    farmIds: v.array(v.id("farms")),
    buyerName: v.string(),
    buyerCountry: v.string(),
    status: v.union(v.literal("preparing"), v.literal("ready"), v.literal("in_transit"), v.literal("delivered")),
    traceScore: v.number(),
    eudrDeclarationId: v.optional(v.string()),
    certificateR2Key: v.optional(v.string()),
  }).index("by_coop", ["cooperativeId"])
    .index("by_code", ["code"]),

  // tamper-evident audit log — every write hits this
  auditEvents: defineTable({
    actor: v.id("users"),
    action: v.string(),             // "farmer.create", "farm.update", "batch.export", "batch.received"
    entityType: v.string(),
    entityId: v.string(),
    diff: v.optional(v.any()),
    traceId: v.string(),            // OpenTelemetry trace id — links to SignOz
    at: v.number(),
  }).index("by_entity", ["entityType", "entityId"])
    .index("by_actor", ["actor"]),

  // Batch traceability stages — the spine of the buyer-facing trace page.
  // One row per handoff: harvest → village → cooperative → processor → exporter → in_transit → received.
  batchEvents: defineTable({
    batchId: v.id("batches"),
    stage: v.union(
      v.literal("harvest"),
      v.literal("village_collection"),
      v.literal("cooperative_intake"),
      v.literal("processing"),
      v.literal("export_prep"),
      v.literal("in_transit"),
      v.literal("received"),
    ),
    actorName: v.string(),         // human-readable, denormalized for the public trace page
    actorRole: v.string(),         // "field_agent" | "warehouse_manager" | "exporter" | "buyer"
    location: v.optional(v.object({ lat: v.number(), lng: v.number(), place: v.string() })),
    evidenceR2Key: v.optional(v.string()),  // photo, scale ticket, dock receipt PDF
    signatureHash: v.optional(v.string()),  // SHA-256 over (stage|batchId|actor|at), kept for tamper-evidence
    note: v.optional(v.string()),
    at: v.number(),
  }).index("by_batch_at", ["batchId", "at"]),

  // Live transit pings (simulated v1, real IoT post-launch).
  // Subscribed by the buyer page and the dashboard for the "watch it move" moment.
  batchPings: defineTable({
    batchId: v.id("batches"),
    lat: v.number(),
    lng: v.number(),
    speedKph: v.number(),
    at: v.number(),
  }).index("by_batch_at", ["batchId", "at"]),

  // Reserved for post-launch: farmer payout ledger.
  // v1 schema only, no functions yet — proves to investors we thought about it.
  farmerPayouts: defineTable({
    farmerId: v.id("farmers"),
    batchId: v.id("batches"),
    amountCents: v.number(),
    currency: v.string(),           // "TZS", "KES", "USD"
    rail: v.string(),               // "mpesa", "mtn_momo", "airtel_money", "bank"
    status: v.union(v.literal("queued"), v.literal("sent"), v.literal("delivered"), v.literal("failed")),
    referenceId: v.optional(v.string()),
    at: v.number(),
  }).index("by_farmer_at", ["farmerId", "at"])
    .index("by_batch", ["batchId"]),
});
```

**1.3 Auth** — `convex/auth.ts` using `@convex-dev/auth` with the Password provider. Seed three production-named users in `convex/seed.ts` (run with `npx convex run seed:run`). The email domains are real-feeling on purpose — no `@herb.demo`, no `test@`, no `demo@`:

- `amani.tarimo@kncu.coop.tz` — Amani Tarimo, role `field_agent`
- `david.mushi@kncu.coop.tz` — David Mushi, role `coop_admin`
- `procurement@nordicroasters.no` — Nordic Roasters AS, role `buyer`

All three with password `Kilimanjaro2026`. Document the credentials in a separate `CREDENTIALS.md` that is `.gitignore`d — never write demo credentials inline in committed docs. Add a `role` field to the users table via `authTables` extension, plus a `displayName` for the audit log.

**1.4 Seed data** — port `lib/data.ts` into `convex/seed.ts` so the dashboard has KNCU + 5 farmers + 8 farms + 4 batches the moment Tobi opens it.

**Phase 1 Acceptance:** `npx convex dev` runs clean, `npx convex run seed:run` populates the tables, `app/dashboard/page.tsx` reads from Convex via `useQuery` instead of `lib/data.ts`. The dashboard must look IDENTICAL to before — same numbers, same order. If it doesn't, Convex queries are wrong; do not move on.

---

### Phase 2 — Wednesday: Offline-first field sync + R2 (target: 8 hrs)

**2.1 Dexie queue** — `lib/sync/queue.ts`:

```ts
import Dexie, { type Table } from "dexie";

export interface QueuedMutation {
  id?: number;
  type: "farmer.create" | "farm.create";
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

class HerbQueue extends Dexie {
  mutations!: Table<QueuedMutation, number>;
  constructor() {
    super("herb-sync");
    this.version(1).stores({ mutations: "++id, type, createdAt" });
  }
}
export const queueDb = new HerbQueue();
```

**2.2 Sync hook** — `lib/sync/useSyncQueue.ts`:

- Listens to `navigator.onLine` + `online`/`offline` events.
- On `online`, drains the queue oldest-first, calling the matching Convex mutation.
- Increments `attempts`, stores `lastError` on failure with exponential backoff (max 5 tries).
- Emits a status object `{ online, queued, draining, lastError }` for the sync badge.

**2.3 Wire `/field`** — replace local `useState` form submit with `queueDb.mutations.add(...)`. Show the existing green/amber sync bar driven by the hook's status. Add a small "queued: N" pill that's hidden when N=0.

**2.4 Real geolocation** — Step 2 of the field flow:
- Replace the mocked polygon with `navigator.geolocation.watchPosition` while the user holds the capture button.
- Sample one point per second, append to an array.
- On release, compute area client-side with Turf.js (`@turf/area` + `@turf/helpers`).
- Save GeoJSON to a Blob, push to R2 via a Convex action that returns a presigned PUT URL.

**2.5 R2 wiring** — `convex/r2.ts`:

```ts
// uses the aws-sdk v3 S3 client pointed at R2's S3-compatible endpoint
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function presignPolygonUpload(farmCode: string) {
  const key = `polygons/${farmCode}-${Date.now()}.geojson`;
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: "herb-blobs", Key: key, ContentType: "application/geo+json" }),
    { expiresIn: 300 },
  );
  return { key, url };
}
```

**2.6 EUDR scoring (mocked but deterministic)** — `convex/eudr.ts`:
- Convex mutation `recomputeFarm(farmId)` that:
  - Loads the farm.
  - Mocks deforestation check by hashing the polygon centroid into one of `none|low|medium|high`.
  - Computes a 0–100 score from a weighted sum (documentation 25, polygon 25, deforestation 30, certifications 20).
  - Sets `verificationStatus` based on the score.
  - Writes an `auditEvents` row.
  - Returns the new score so optimistic UI can show it.

**2.7 MapLibre GL polygon capture + viewer (simulated walk in v1)** — this turns the field flow from a list of coordinates into a real map experience that looks identical to real GPS capture.

- Install: `npm i maplibre-gl`.
- New component `components/map/PolygonCapture.tsx` (client-only, `"use client"`). Props: `villageCenter: {lat: number, lng: number}`, `onComplete(geojson: GeoJSON.Polygon, areaHa: number)`.
- Renders a MapLibre map with MapTiler satellite style (`https://api.maptiler.com/maps/satellite/style.json?key=${env.NEXT_PUBLIC_MAPTILER_KEY}`).
- **Simulated walk loop** (v1):
  1. On mount, compute a deterministic walk path: a slightly-randomized polygon perimeter (12 vertices, ~150 m total perimeter) anchored around `villageCenter` with a small seeded offset so each farm looks different.
  2. Primary button labeled "Start walk" `min-h-14`.
  3. On press, start a `setInterval(1500)` that pushes the next path vertex into the points array, redraws a MapLibre `Polygon` source each tick, recenters the map on the current point, and animates a small `Crosshair` marker at the head of the path.
  4. The button label switches to "Walking — {n} of 12 points" with a thin progress bar. Pressing again pauses; "Resume" resumes.
  5. After 12 points, auto-stop, snap-close the polygon, run `@turf/area`, and call `onComplete`.
  6. The accuracy chip in the top-left always shows `±3 m` in v1 (cosmetic — real accuracy ships in v1.1).
- **Real GPS hook (v1.1 — DO NOT BUILD YET, but leave the seam):** add a TypeScript discriminated prop `mode: "simulated" | "geolocation"`. The `geolocation` branch calls `navigator.geolocation.watchPosition`. v1 only ever passes `mode="simulated"`. Wire it as a prop, not an env var, so we can A/B locally.
- **Vertex correction:** after `onComplete`, the user can tap any vertex to drag-reposition it on the map; `@turf/area` recomputes. Tap an empty area to add a vertex. Tap a vertex + the small "remove" button on its label to delete it.
- New component `components/map/PolygonView.tsx` (also client-only). Props: `polygonR2Key?: string`, `polygonInline?: GeoJSON.Polygon`, `farmCode`. Fetches the GeoJSON from R2 via a presigned GET, or renders the inline polygon directly (used during optimistic UI). Read-only on a satellite MapLibre map. Used in: dashboard farm-row expand, public buyer trace page.
- Both components must lazy-load (`next/dynamic` with `ssr: false`) — MapLibre is ~200 KB and we don't want it in the dashboard initial bundle.

**Phase 2 Acceptance:** Tobi opens `/field` in a desktop browser, registers a farmer, advances to the polygon step, hits "Start walk", watches the 12 points drop on the satellite map over ~18 seconds, sees the area auto-compute (~0.7 ha typical), advances to review, opens Chrome DevTools and toggles network to "Offline", clicks Submit — the "queued: 1" badge appears. Toggles network back on. Within 3 seconds the dashboard in another tab shows the new farmer + farm with the polygon viewable on the dashboard map and a computed EUDR score.

---

### Phase 3 — Thursday: Buyer API, observability, demo polish (target: 6 hrs)

**3.1 Cloudflare Worker** — `workers/buyer-api/src/index.ts`:

```ts
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const match = url.pathname.match(/^\/v1\/batches\/([^/]+)\/trace$/);
    if (!match) return new Response("Not found", { status: 404 });

    const batchCode = match[1];
    const convexUrl = `${env.CONVEX_URL}/api/run/buyer/traceByCode`;
    const res = await fetch(convexUrl, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.CONVEX_PUBLIC_TOKEN}` },
      body: JSON.stringify({ args: { code: batchCode } }),
    });
    const data = await res.json();
    return Response.json(data, { headers: { "cache-control": "public, max-age=60" } });
  },
};
```

- Convex query `buyer.traceByCode` returns batch + farm summaries + farmer initials only (no PII).
- Worker is deployed to `api.herb.shamba` via `wrangler deploy`.
- Cloudflare WAF managed rules + 100 req/min/IP rate limit on this route.

**3.2 OpenTelemetry into Convex + field app:**
- `lib/otel.ts` initializes the Node + browser SDKs.
- Wrap every Convex mutation with a span; attach `traceId` to the `auditEvents` row so SignOz traces deep-link to audit rows.
- Field-app sync queue emits a span per drain attempt with attributes `{ queue.size, online, attempts }`.

**3.3 SignOz dashboards** — preset two boards Tobi can show on stage:
- **Sync Health** — p50/p95 sync latency, error rate, queued count over time.
- **EUDR Audit** — recent `auditEvents` traces, filterable by actor/farm.

**3.4 Global Forest Watch deforestation overlay** — visualize EUDR risk on the same map as the polygon.

- Add a toggle to `PolygonView.tsx`: "Show deforestation". When on, adds a raster source pointing at GFW's tree-cover-loss WMS endpoint (`https://tiles.globalforestwatch.org/umd_tree_cover_loss/...`). Use the year filter 2020-onward (EUDR cutoff).
- Visual: GFW loss pixels render as `red-500` at 60% opacity over the satellite base.
- Add a "Buffer 1 km" toggle: uses `@turf/buffer` to draw a 1km polygon around the farm; if it intersects loss pixels, raise the deforestation risk score programmatically.
- Cache GFW tiles via Cloudflare Worker (`tiles.herb.shamba/gfw/{z}/{x}/{y}.png`) — both to respect GFW's rate limits and to make the dashboard load fast for African co-op users on slow networks.

**3.5 Live transit pings** — the "watch it move" moment.

- `convex/transit.ts` action `simulateBatchTransit(batchId)`. Computes a great-circle path from the cooperative's lat/lng to the buyer's port (Dar es Salaam → Rotterdam, Mombasa → Jebel Ali, etc., hardcoded by buyer country).
- Schedules a self-rescheduling Convex internal action every 4 seconds during the launch walkthrough, inserting one `batchPings` row per tick at the next interpolated point until the path completes.
- Dashboard Batches tab + public buyer page subscribe to `useQuery(api.batches.pingsForBatch, { batchId })` and render the latest ping as a moving marker on a MapLibre map with a fading trail of the last 30 positions.
- Auto-stops when the simulation reaches the destination, then triggers Phase 3.6.

**3.6 Buyer signature loop** — the climax of the walkthrough.

- On the public buyer page `/buyer/[batchCode]`, when the latest `batchPings` row is within 10 km of the destination port, surface a primary button "Confirm receipt".
- Click flow:
  1. Modal asks the buyer to type their name and click "Sign".
  2. Convex action `buyer.confirmReceipt(batchCode, signerName)` computes `signatureHash = sha256(batchId|received|signerName|at)`, writes a `batchEvents` row with `stage: "received"`, writes an `auditEvents` row, and updates `batches.status = "delivered"`.
  3. The button transitions to a permanent green "Received {timestamp} by {signerName}" stamp with a copyable `signatureHash`.
- The whole loop must complete in under 1 second from button press to stamp.

**3.7 Walkthrough script** — `LAUNCH_WALKTHROUGH.md` (Claude Code writes this; see section 5 below for the beat sheet).

**Phase 3 Acceptance:** `curl https://api.herb.shamba/v1/batches/B-2024-KNC-001/trace` returns JSON in under 200ms. SignOz shows live traces from a fresh farmer registration and from a buyer signature. The MapLibre dashboard map renders with the GFW overlay toggle working. The buyer signature loop closes in under 1 second. Tobi can run the walkthrough end-to-end in under 5 minutes without touching the keyboard for backend operations.

---

## 5. Friday Walkthrough Call (15 minutes, screen-share)

This is a 15-minute conversation, not a sales pitch. Reviewer is technical. Goal: prove you can build a coherent web app that solves a real problem with real engineering, and that you understand both the architecture and the impact.

Speak present-tense. The build is a shipping product, not a demo. Never say "this is mocked" — say "this currently runs against a simulated input; the production path swaps in real GPS / IoT here". Treat unfinished features as backlog, not bugs.

> **Setup before the call:** Tab 1 — `/dashboard` signed in as David Mushi. Tab 2 — `/field` signed in as Amani Tarimo (Chrome incognito so cookies don't fight). Tab 3 — `/buyer/B-2024-KNC-001`. Tab 4 — SignOz dashboard pre-loaded with the Sync Health board. Tab 5 — the GitHub repo at the convex/schema.ts file. Map already centered on Kibosho. Network throttling DevTools panel open and ready in Tab 2.

**0:00 – 1:30 — The problem and the regulatory hook**
Open `/about`. Walk through the supply-chain breakdown. "In December, the EU Deforestation Regulation goes live. Any coffee, cocoa, palm, soy, rubber, or beef sold into the EU has to be traceable to a sub-hectare farm plot with proof it wasn't deforested after December 2020. 2.4 million East African smallholders have no documented farm boundaries today. €150 billion of trade is at stake. The infrastructure to fix this has to work offline, on five-year-old Androids, in Swahili, and produce evidence a Hamburg auditor will accept on first read. That's the problem space."

**1:30 – 3:00 — The architecture, briefly**
Quick tour of the stack on a single slide or whiteboarded diagram. "Next.js 16 App Router on Vercel. Convex for data + auth + real-time. Cloudflare R2 for blobs, one Worker for the public buyer API, WAF in front. SignOz Cloud for traces. Convex Auth with three seeded roles — field agent, co-op admin, buyer. The interesting choice: offline-first writes via a Dexie queue in IndexedDB that drains the moment the network returns. Convex's reactive queries mean zero websocket code for the live dashboard."

**3:00 – 6:00 — Field capture flow**
Switch to Tab 2. Already on `/field` as Amani. Step 0 — register "Hadija Mwasha", Kibosho, KNCU. Step 1 — coffee, Arabica SL28, 0.8 ha estimated. Step 2 — the polygon screen. Hit "Start walk". 12 points drop over ~18 seconds on the satellite map. Area auto-computes. "In v1.1 this is `navigator.geolocation.watchPosition`. The component takes a `mode` prop so the swap is one line. I built the simulator first because reviewers can't be in a coffee field." Drag a vertex to correct. Step 3 — review.

Open DevTools → Network → throttle to Offline. Click Submit. "Queued: 1, offline." Show the Dexie queue in the Application tab. Toggle throttling back to Online. Watch the queue drain.

**6:00 – 9:00 — The dashboard reaction**
Switch to Tab 1. Within 3 seconds: KPI count 847 → 848. Click into the new farm row. Polygon opens on a satellite map. Toggle "Show deforestation" — stylized loss pixels render. "Real GFW WMS tiles ship in v1.1; the styling and toggle behavior are production-ready now." Click "Audit trail" drawer. Show the entries: farmer.create, farm.create, farm.eudrScore.compute. Each row has a trace ID. Click the latest. Switch to Tab 4 — SignOz. The trace is already there: client → Convex → audit log write → score recompute. ~280 ms end-to-end, every span attributed.

**9:00 – 12:00 — Batch traceability**
Back to Tab 1 → Batches. Open B-2024-KNC-001 (Nordic Roasters, Norway). Show the chain-of-custody timeline already populated from seed data: harvest → village collection → cooperative intake. Click "Dispatch to exporter". The next stage gets logged with a signature hash. Click "Begin transit". The transit simulator starts. Split Tab 1 and Tab 3 side-by-side. A marker leaves Dar es Salaam port, moves along the great-circle route toward Rotterdam. The trail of pings paints the path. "In v1.1 this subscribes to a real IoT device feed — same Convex query, same UI."

**12:00 – 13:30 — Buyer signature loop**
Skip the simulator forward (a dev-only `+30 min` button you'll add to the dashboard, hidden behind co-op admin role). Marker arrives at Rotterdam. Switch to Tab 3. The "Confirm receipt" button has surfaced. Type "K. Andersen, Nordic Roasters". Sign. The button transitions to a permanent green stamp with `sha256:` hash + timestamp in mono. Back to Tab 1 — audit log shows the buyer-receipt event. EUDR readiness gauge ticks +0.4. "Loop closed. End-to-end, every actor signed, every artifact stored, every byte traced."

**13:30 – 14:30 — Code tour for a technical reviewer**
Tab 5 — `convex/schema.ts`. "Notice the `farmerPayouts` table is already in the schema even though we don't write to it yet. That's because the same farm record that produces a buyer receipt also produces a payout instruction — the schema is shaped for the next quarter's roadmap, not just for what ships Friday." Show `convex/eudr.ts` for the scoring function. Show `lib/sync/queue.ts` for the Dexie offline pattern. Show one audit-log mutation wrapper. "Every write hits the audit table. There is no path to mutate state that bypasses it."

**14:30 – 15:00 — Horizon**
"Tanzania today. Coffee, avocado, macadamia. Kenya tea next quarter. Cashew in Mozambique, vanilla in Uganda. Fisheries on Lake Victoria. Same trust spine. The same verified plot that gets a coffee batch into the EU becomes credit for a farmer who's never had a bank account, a land tenure record for one who's never held a title deed, a carbon credit for one farming under canopy. The infrastructure is general. The impact is specific. Thanks for your time — happy to dig into any layer of this."

---

## 6. Environment Variables (final shape)

```
# .env.local — NEVER commit
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=herb-blobs

OTEL_EXPORTER_OTLP_ENDPOINT=https://ingest.<region>.signoz.cloud:443
OTEL_EXPORTER_OTLP_HEADERS=signoz-ingestion-key=...

# Worker (set with `wrangler secret put`)
CONVEX_URL=
CONVEX_PUBLIC_TOKEN=
```

---

## 7. Hard Rules for Claude Code

1. **Do not change the design** unless `HERB_DESIGN.mdx` permits it. The frontend is locked except where this brief or the design doc explicitly says to modify.
2. **Do not add shadcn.** Tobi's app is custom-component-only. Build new components in the existing pattern (Tailwind classes inline, no `cn()` helper, no Radix primitives unless absolutely necessary).
3. **Type everything.** No `any`. Convex generates types — use them.
4. **No new dependencies without justification.** Approved additions: `convex`, `@convex-dev/auth`, `dexie`, `@turf/turf`, `maplibre-gl`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/sdk-trace-web`, `@opentelemetry/exporter-trace-otlp-http`, `wrangler` (dev only).
5. **Every Convex mutation writes an `auditEvents` row.** No exceptions. This is the EUDR pitch.
6. **Optimistic UI everywhere on `/field`.** The user must never wait on the network while the queue is doing its job.
7. **No "Beta", "Demo", "Coming Soon", "WIP", "Test", or "Lorem" anywhere in the shipped UI.** No watermarks, no banner stripes, no toast announcing "this is a demo". The build presents as a year-old shipping product. If a feature isn't ready, omit it from the navigation — do not stub it.
8. **No `@*.demo`, `@example.com`, `test@`, or `demo@` email addresses in any seeded data or UI.** Use real-feeling production names tied to plausible East African cooperatives, agents, and European buyers. The credentials sheet lives in `CREDENTIALS.md` (gitignored), not in committed docs.
9. **No placeholder copy.** Every label, helper text, error message, and empty state must read like a copywriter wrote it. If you don't know what to write, write nothing and add a `// COPY:` comment for Tobi to fill — never ship `Lorem ipsum`, "Title goes here", or `TODO: copy`.
10. **Buttons are always primary/secondary/ghost only.** No outline variants, no destructive red buttons in the main flows, no icon-only buttons larger than `min-h-9` outside of the field app.
11. **If you're stuck for more than 15 minutes, stop and write a `BLOCKERS.md`** with the specific question for Tobi. Do not invent answers.
12. **Backtest before you ship a phase.** Run the acceptance criteria yourself before declaring done.

---

## 8. Post-Launch Roadmap (do NOT build before Friday)

In priority order, for the next sprint:
1. Real-time IoT GPS for in-transit containers (swap the simulator for a real device feed).
2. Mobile-money payout activation (M-Pesa Daraja API for Kenya, Airtel/MTN MoMo for Tanzania). Schema already wired in v1.
3. Self-hosted SignOz on Hetzner (data sovereignty pitch for East African ministers).
4. Multi-cooperative federation + co-op picker.
5. Better Auth migration (off Convex Auth) for SSO with cooperative federations.
6. SMS verification via Africa's Talking (so non-smartphone farmers can confirm receipt of payments).
7. Buyer marketplace + RFQ flow.
8. Climate finance / carbon credit issuance via Verra connector.
9. Land tenure pilot — formal partnership with one East African land registry (Rwanda's LAIS or Tanzania's ILMIS the likely first targets).
10. New commodities: tea (Kenya), cashew (Tanzania, Mozambique), vanilla (Uganda).
11. SEA expansion: Malaysia palm oil pilot — same trust spine, different EU regulatory hook.

---

## 9. If Something Blocks the Launch

Fallback ladder, in order. Each fallback is invisible to the audience — the build still presents as production, just with a quieter feature.

1. If offline sync breaks: fall back to "slow network" mode (Chrome devtools throttle to Slow 3G). The "queued" badge still shows; the audience can't tell.
2. If Convex live updates break: dashboard polls every 2 seconds (`useQuery` with a `Date.now()` arg trick). Latency goes from instant to 2s. Still fine.
3. If R2 upload breaks: store polygon GeoJSON as a base64 string directly in the Convex `farms.polygonInline` column (capped at 64 KB). MapLibre reads it the same way.
4. If MapLibre / MapTiler key fails: fall back to OpenStreetMap raster tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) with a stone-tinted style. Less pretty, still maps.
5. If the GFW overlay fails: hide the toggle. The polygon still renders.
6. If the transit simulator fails: jump straight to the buyer signature moment from a Batches table click. Skip the "watching it move" beat.
7. If SignOz ingestion fails: show the `auditEvents` table directly via a `/audit` route gated to co-op admin.

Build all seven fallbacks during Phase 3.7. Test each one by force-failing the primary path in dev tools.

---

**End of brief. Claude Code: confirm you've read this file in your first reply by quoting the North Star sentence, then begin Phase 1.**
