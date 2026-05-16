# Herb v1 — Run Guide for Three-Terminal Build

> **You are operating three Claude Code terminals in parallel.** Each terminal owns a slice of the codebase. This guide tells you how to set them up, what to paste into each one, and how they coordinate without stepping on each other.

---

## 1. One-time prep (do this before opening any terminal)

Estimated time: 60 minutes.

### 1.1 Provision accounts

| Service | What you need | Time |
|---|---|---|
| **Cloudflare** | Account + register `herb.shamba` via Cloudflare Registrar (~$15/yr at cost). Enable R2 from the dashboard. Create an R2 bucket named `herb-blobs` and an API token with R2 read/write. | 15 min |
| **Convex** | Sign up at `convex.dev`. No project yet — Terminal 1 will create it via `npx convex dev`. | 3 min |
| **MapTiler Cloud** | Sign up at `maptiler.com`. Free tier, no card. Copy your API key — this is `NEXT_PUBLIC_MAPTILER_KEY`. | 5 min |
| **SignOz Cloud** | Sign up at `signoz.io/teams`. Free tier, 30-day retention. Copy the OTLP endpoint and the ingestion key. | 5 min |
| **Vercel** | Sign up. Don't import the project yet — wait until Terminal 1 has pushed the first Convex changes to git. | 3 min |
| **GitHub** | If your `herb/` folder isn't a git repo yet: `cd /Users/tobi/Desktop/herb && git init && git add -A && git commit -m "snapshot before backend"`. Push to a new private repo. | 10 min |

### 1.2 Place the handoff files

Copy these four files into the root of `/Users/tobi/Desktop/herb/`:

- `HERB_V1_PRO_HANDOFF.md` (you already have this)
- `HERB_BACKEND_BRIEF.md`
- `HERB_DESIGN.mdx`
- `RUN_GUIDE.md` (this file)

Then `git add` + commit them so all three terminals see the same version on disk.

### 1.3 Create `.env.local` in the project root

```
# Filled in over Phase 1 — leave keys blank if you don't have them yet
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

NEXT_PUBLIC_MAPTILER_KEY=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=herb-blobs

OTEL_EXPORTER_OTLP_ENDPOINT=
OTEL_EXPORTER_OTLP_HEADERS=
```

Add `.env.local` and `CREDENTIALS.md` to `.gitignore`.

### 1.4 Create the coordination file

In the project root, create a single empty file: `DEPS_REQUESTED.md`. Terminals 2 and 3 will write dependency-add requests here; Terminal 1 reads it at the start of each session and runs the installs.

```bash
touch DEPS_REQUESTED.md
git add DEPS_REQUESTED.md
git commit -m "Add coordination file for parallel build"
```

---

## 2. Open three terminal tabs

Each tab `cd /Users/tobi/Desktop/herb` then runs:

```bash
claude
```

(or whatever launches Claude Code on your machine — `claude code`, `claude-code`, etc.)

Tab them in this order, left to right:

| Tab | Lane | Prompt file |
|---|---|---|
| 1 | Data Plane | `LANE_1_DATA.md` |
| 2 | Field & Sync Plane | `LANE_2_FIELD.md` |
| 3 | Dashboard, Trace & Buyer Plane | `LANE_3_DASHBOARD.md` |

Name the tabs in your terminal app (iTerm: `⌘ + I`) so you don't lose track.

---

## 3. The kickoff prompt (paste this into each tab)

For **each** tab, paste this exact message — only the LAST LINE differs per tab:

```
You are working inside /Users/tobi/Desktop/herb on a multi-terminal build.

Read these files in order before doing anything else:
1. HERB_V1_PRO_HANDOFF.md
2. HERB_BACKEND_BRIEF.md
3. HERB_DESIGN.mdx
4. <YOUR LANE FILE — see below>

Then confirm you've read them by quoting the North Star sentence from
HERB_BACKEND_BRIEF.md §1, then quoting the lane name from your lane file.
Then begin Phase 1 of YOUR LANE only.

Your lane file is: <CHANGE PER TAB>
```

Replace `<CHANGE PER TAB>` with:
- Tab 1: `LANE_1_DATA.md`
- Tab 2: `LANE_2_FIELD.md`
- Tab 3: `LANE_3_DASHBOARD.md`

---

## 4. Order of operations

The three lanes are not fully parallel — there are two synchronization points.

**Sync point A (after ~2 hours of Phase 1):**
Tab 1 must finish the Convex schema + auth + seed BEFORE Tabs 2 and 3 can wire UI to real data. While Tab 1 works on schema, Tabs 2 and 3 should:
- Read their lane files
- Set up their component scaffolds against fake local data
- Install their map / dexie dependencies (write requests into `DEPS_REQUESTED.md`)
- Stub the Convex calls with mock returns

When Tab 1 reports "schema deployed, seed loaded, here's the generated `convex/_generated/api.d.ts`", Tabs 2 and 3 swap their stubs for real `useQuery` / `useMutation` calls.

**Sync point B (end of Phase 2):**
The audit-log mutation wrapper from Tab 1 must be in place before Tabs 2 and 3 wire their first writes. Tab 1 commits a file `convex/_lib/audited.ts` that exports `auditedMutation(...)`; the other tabs use it for every write.

---

## 5. Coordination protocol

To avoid file-edit collisions:

**Each tab owns its folders strictly** (see lane files for the lists). If a tab needs to touch a file outside its lane, it writes a `HANDOFF.md` request to the project root and stops on that change. You manually move the request to the right tab.

**Adding a dependency:**
- Tab 1 owns `package.json`. To install something, Tab 2/3 appends a single line to `DEPS_REQUESTED.md`:
  ```
  TAB 2: npm i maplibre-gl @turf/area dexie
  ```
- At the start of each Tab 1 session, it reads this file, runs the installs, commits, then deletes the request lines.

**Pushing to git:**
- Each tab commits to its own branch named `lane/{n}-{slug}` (e.g. `lane/1-data`, `lane/2-field`, `lane/3-dashboard`).
- You merge to `main` manually at the end of each phase, in this order: Lane 1 → Lane 2 → Lane 3.
- Conflicts on `convex/_generated/*` are always resolved by keeping Lane 1's version.

**Asking for help:**
- If a tab is stuck for more than 15 minutes, it writes `BLOCKERS.md` with a specific question and stops. You read the file, answer in chat, and tell the tab to continue.

---

## 6. Daily rhythm

**Tuesday (today):**
- Tab 1: Phase 1 (schema, auth, seed, audited mutation wrapper). Goal by EOD: `npx convex dev` runs clean, dashboard reads from Convex.
- Tab 2: Component scaffolds for `PolygonCapture`, `PolygonView`, sync queue with mock data.
- Tab 3: Component scaffolds for `BatchTraceMap`, `SignatureButton`, buyer page route.

**Wednesday:**
- Tab 1: EUDR scoring, R2 presign action, transit ping action.
- Tab 2: Phase 2 — wire `/field` to Convex, real Dexie queue, simulated walk on real map.
- Tab 3: Phase 2 — wire `/dashboard` reactive queries, polygon viewer integration, batch tab interactions.

**Thursday:**
- Tab 1: Cloudflare Worker for buyer API + OTEL instrumentation + SignOz dashboards.
- Tab 2: Conflict modal stub, fallback paths, mobile polish.
- Tab 3: Buyer page full assembly, transit simulator wiring, signature loop end-to-end.

**Friday morning:**
- All tabs: bug bash, demo dry-run, fallback tests.

---

## 7. When something goes wrong

If a tab gets confused or starts editing files outside its lane, stop it with: `Stop. Re-read your lane file. Confirm what you own. Revert any out-of-lane changes.`

If two tabs report editing the same file: pause both, decide which one owns it (refer to lane files), have the loser revert its change, log the lesson in this file under §11.

If you get tired and want to walk away: each tab's `BLOCKERS.md` (if any) tells you exactly where to pick up. Your terminal scrollback is the rest of the truth.

---

## 8. Demo readiness checklist (Friday morning)

Before you take the call:

- [ ] `npm run build` succeeds with zero errors.
- [ ] All three seed users can sign in with the credentials in `CREDENTIALS.md`.
- [ ] `/field` simulated walk completes in under 20 seconds and the polygon snaps closed.
- [ ] DevTools "Offline" → submit → "queued: 1" badge → DevTools "Online" → dashboard ticks up.
- [ ] `/dashboard` loads in under 2 seconds, gauges render, polygon view opens for any farm.
- [ ] Deforestation toggle on the polygon view works (stylized overlay appears).
- [ ] Batch transit simulator drops pings every 4 seconds along a visible route.
- [ ] `/buyer/B-2024-KNC-001` loads with the trace, the "Confirm receipt" button appears once the simulator finishes, signing produces a permanent green stamp with a SHA-256 hash.
- [ ] SignOz Cloud shows traces for at least one fresh registration and one signature.
- [ ] All seven fallbacks in `HERB_BACKEND_BRIEF.md` §9 have been tested at least once.
- [ ] No "Beta", "Demo", "Lorem", `@*.demo`, or other placeholder strings anywhere visible.

---

## 9. After the call (whether you get the offer or not)

- Push everything to `main`, tag `v1-walkthrough`.
- Write a one-page reflection: what worked, what didn't, what each terminal struggled with.
- v1.1 backlog: real `navigator.geolocation` in PolygonCapture (one prop flip), real GFW WMS tiles, real container IoT integration. Each is < 1 day's work.

---

## 10. Files in this bundle

| File | Purpose | Lives where |
|---|---|---|
| `HERB_V1_PRO_HANDOFF.md` | Original frontend handoff (do not edit). | Project root, committed. |
| `HERB_BACKEND_BRIEF.md` | The architecture contract — read by all three lanes. | Project root, committed. |
| `HERB_DESIGN.mdx` | The design contract — read by all three lanes. | Project root, committed. |
| `RUN_GUIDE.md` | This file. | Project root, committed. |
| `LANE_1_DATA.md` | Tab 1 prompt + responsibilities. | Project root, committed. |
| `LANE_2_FIELD.md` | Tab 2 prompt + responsibilities. | Project root, committed. |
| `LANE_3_DASHBOARD.md` | Tab 3 prompt + responsibilities. | Project root, committed. |
| `DEPS_REQUESTED.md` | Coordination scratchpad for npm installs. | Project root, committed. |
| `CREDENTIALS.md` | Seed user passwords + API keys. | Project root, **gitignored**. |
| `BLOCKERS.md` | Per-tab pause-and-ask file (created on demand). | Project root, **gitignored**. |

---

## 11. Lessons log (write here as you go)

_Date — Tab — What happened — Lesson_

(empty)
