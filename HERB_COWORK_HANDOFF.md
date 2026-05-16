# Herb v1 — Cowork Handoff (Session 2)

> **Purpose:** Paste this whole file as your first message in a new Cowork channel. It primes a fresh assistant with the full project context, the current state of the three-terminal build, the exact prompts to restart each lane, and the steps to take next.

---

## 1. What this project is

**Herb** is a farm-to-market trust infrastructure web app for East African smallholder agriculture (coffee, avocado, macadamia in Tanzania/Kenya). It lets cooperatives register farmers, capture farm boundaries, score EUDR (EU Deforestation Regulation) compliance, manage batch traceability, and give EU buyers a signed chain-of-custody.

**Domain:** herb.shamba ("shamba" = farm in Swahili)
**Stack:** Next.js 16 App Router · Convex (data/auth/realtime) · Cloudflare R2 + Worker · SignOz Cloud (observability) · MapLibre GL · Dexie (offline queue) · Vercel
**Goal:** A functioning full-stack web app for an internship evaluation — a **live 15-minute screen-share walkthrough**.
**Scope rule for v1:** Function must be *visible and clean*, not field-tested. Polygon capture is a simulated walk, deforestation overlay is stylized, transit pings are simulated. Everything else (Convex, auth, sync queue, audit log, buyer signature, R2, SignOz) is real. Real GPS / real GFW tiles / real IoT are v1.1 — the seams are already built in.

**Project location:** `/Users/tobi/Desktop/herb/`

---

## 2. The build method

Four terminal tabs in Ghostty:

| Tab | Name | Role | Branch |
|---|---|---|---|
| ⌘1 | `data` | Lane 1 — Convex schema, auth, backend functions, audit log, Worker, OTEL | `lane/1-data` |
| ⌘2 | `convex-watch` | Not a Claude session — runs `npx convex dev`, auto-deploys, streams logs | — |
| ⌘3 | `field` | Lane 2 — `/field` flow, offline sync queue, polygon capture | `lane/2-field` |
| ⌘4 | `dashboard` | Lane 3 — `/dashboard`, `/buyer`, batch traceability, signature loop | `lane/3-dashboard` |

Each lane owns specific folders, reads everything, writes only its own. `package.json` is owned by Lane 1. Cross-lane needs go through `HANDOFF.md`. Each lane commits to its own branch; branches merge to `main` at the end.

**Supporting files in the project root** (all created in Session 1):
`HERB_V1_PRO_HANDOFF.md` · `HERB_BACKEND_BRIEF.md` · `HERB_DESIGN.mdx` · `RUN_GUIDE.md` · `LANE_1_DATA.md` · `LANE_2_FIELD.md` · `LANE_3_DASHBOARD.md` · `HERB_BUILD_SESSION_LOG.md`

---

## 3. Current state (as of this handoff)

**Lane 1 (data) — Phases 1 & 2 done, HANDOFFs fulfilled. IDLE.**
- 8-table Convex schema deployed, auth + 3 seed users, audit-log wrapper, R2 presign actions, EUDR scoring — all live.
- All 6 HANDOFF requests fulfilled and merged to `main` (commit `6bbcd23`): `farms.create`, optional `r2Key`, `presignPolygonUpload`, `buyer.confirmReceipt`, `transit.*` (13-waypoint Dar→Rotterdam route), `audit.recentAll`.
- Build clean. Sitting idle at ~142k tokens, waiting for its own Phase 3.

**Lane 2 (field) — COMPLETE through Phase 3.**
- Phase 2: `/field` wired to real Convex mutations, Dexie offline queue draining, simulated-walk polygon capture.
- Phase 3: `ConflictModal.tsx` (slide-up bottom-sheet), R2 upload with silent `polygonInline` fallback, mobile safe-area fix on the sticky stepper.
- Committed to `lane/2-field` at `cec95c1`. TSC + build clean. Ready for cross-lane merge.

**Lane 3 (dashboard) — actively building Phase 2.**
- After a reset, it correctly switched to `lane/3-dashboard`, merged `main`, and is mid-Phase-2: BatchTraceMap SVG→MapLibre, AuditDrawer wiring, dashboard component sharing, buyer page Convex queries, SignatureButton wiring, `app/audit/page.tsx`, render states.
- Do NOT interrupt it — let it finish and post "Lane 3 — Phase 2 complete".

---

## 4. Immediate next steps

1. **Lane 3:** leave it alone until it posts "Lane 3 — Phase 2 complete". Do not clear, do not interrupt.
2. **Lane 1:** clear it now (Phases 1-2 done, clean handoff point, ~142k tokens) and restart with the Phase 3 prompt in §5.
3. **Lane 2:** clear it now (complete through Phase 3) and restart with the standby/verify prompt in §5.
4. When **Lane 3 posts Phase 2 complete:** clear it and restart with the Lane 3 Phase 3 prompt in §5.
5. When **all three lanes finish Phase 3:** run the cross-lane merge in §6.
6. Before the walkthrough call: run the pre-walkthrough checklist in §7.

---

## 5. Clear-and-restart prompts

After `/clear` in a tab, the first message MUST re-establish identity. Use these exactly.

### Lane 1 (data tab, ⌘1) — clear now, paste this:

```
You are Lane 1 (Data Plane) of a three-terminal build of Herb v1, working
in /Users/tobi/Desktop/herb on branch lane/1-data.

Read these files in order to orient:
1. HERB_BACKEND_BRIEF.md
2. LANE_1_DATA.md
3. HERB_BUILD_SESSION_LOG.md

Run `git branch` to confirm you are on lane/1-data. Your Phases 1 and 2
are already complete and all 6 HANDOFF requests are merged to main
(commit 6bbcd23). Verify this with `git log --oneline main -5`.

Now do Phase 3 of LANE_1_DATA.md:
- workers/buyer-api/ — the Cloudflare Worker exposing the public read-only
  buyer trace API; deploy with wrangler
- lib/otel.ts — OpenTelemetry init for the Convex (Node) side and the
  browser side; export the browser tracer for the other lanes
- SignOz Cloud dashboards: "Sync Health" and "EUDR Audit"
- Verify all seven fallback paths in HERB_BACKEND_BRIEF.md §9 are wired

Run `npx tsc --noEmit` and `npm run build` — both must be clean. Commit to
lane/1-data. Post "Lane 1 — Phase 3 complete" when the acceptance items in
LANE_1_DATA.md §"Phase 3" all pass. If stuck >15 min, write BLOCKERS.md
and stop.
```

### Lane 2 (field tab, ⌘3) — clear now, paste this:

```
You are Lane 2 (Field & Sync Plane) of a three-terminal build of Herb v1,
working in /Users/tobi/Desktop/herb on branch lane/2-field.

Read these files in order to orient:
1. HERB_BACKEND_BRIEF.md
2. LANE_2_FIELD.md
3. HERB_BUILD_SESSION_LOG.md

Run `git branch` to confirm you are on lane/2-field. Your Phases 1, 2, and
3 are already complete (committed at cec95c1). Your job now is to VERIFY,
not to build new features.

Do this:
1. git fetch origin
2. git merge origin/main into lane/2-field (keep your lane's files on
   conflict; keep Lane 1's for convex/** and package files)
3. Run `npx tsc --noEmit` and `npm run build` — both must be clean
4. Run the full Lane 2 Phase 2 acceptance test from LANE_2_FIELD.md
   yourself in the browser (register a farmer, simulated walk, offline
   submit, online drain, confirm it lands on the dashboard)
5. Run the Phase 3 acceptance items (ConflictModal renders, R2 fallback
   works, mobile viewport is clean)

If everything passes, post "Lane 2 — verified, standing by for cross-lane
merge." Then STOP and wait — do not start Phase 4 or any new work. If
something fails, fix only within your owned folders and re-verify. If
stuck >15 min, write BLOCKERS.md and stop.
```

### Lane 3 (dashboard tab, ⌘4) — DO NOT clear yet. Wait for "Lane 3 — Phase 2 complete", THEN clear and paste this:

```
You are Lane 3 (Dashboard, Trace & Buyer Plane) of a three-terminal build
of Herb v1, working in /Users/tobi/Desktop/herb on branch lane/3-dashboard.

Read these files in order to orient:
1. HERB_BACKEND_BRIEF.md
2. HERB_DESIGN.mdx
3. LANE_3_DASHBOARD.md
4. HERB_BUILD_SESSION_LOG.md

Run `git branch` to confirm you are on lane/3-dashboard. Your Phase 2 is
complete. Verify with `git log --oneline -5`.

Now do Phase 3 of LANE_3_DASHBOARD.md:
- app/audit/page.tsx — the hidden coop_admin-gated audit fallback route
- All 4 render states (loading skeleton / empty / error / loaded) on every
  tab of /dashboard and on /buyer
- Empty-state copy pass — every empty state has real cooperative-language
  copy, no "Beta/Demo/Lorem/placeholder" strings anywhere
- Confirm /buyer/[batchCode] has robots noindex

Run `npx tsc --noEmit` and `npm run build` — both must be clean. Commit to
lane/3-dashboard. Post "Lane 3 — Phase 3 complete" when the acceptance
items pass. If stuck >15 min, write BLOCKERS.md and stop.
```

---

## 6. Cross-lane merge plan (run when all 3 lanes post "Phase 3 complete")

Do this in the **data tab (⌘1)** after Lane 1 posts Phase 3 complete. Merge order is fixed: Lane 1 → Lane 2 → Lane 3.

```
All three lanes have completed Phase 3. Perform the cross-lane merge into
main. Do this carefully, one branch at a time, building after each merge:

1. git checkout main
2. git merge lane/1-data         → npx tsc --noEmit && npm run build
3. git merge lane/2-field        → npx tsc --noEmit && npm run build
4. git merge lane/3-dashboard    → npx tsc --noEmit && npm run build

On any conflict in convex/_generated/** always keep main's version. On any
other conflict, the lane that owns that folder (per the lane files) wins.
If a build breaks after a merge, fix it before merging the next branch.

After all three are merged and the build is clean on main, run the full
end-to-end walkthrough yourself with Playwright and report any failures.
Post "Cross-lane merge complete — main is green" when done.
```

---

## 7. Pre-walkthrough checklist (before the call)

Run these yourself in a real browser — don't trust a tab's self-report:

- `npm run build` succeeds, zero TypeScript errors on `main`
- All 3 seed users sign in (credentials in gitignored `CREDENTIALS.md`)
- `/field` simulated walk completes, polygon snaps closed, area computes
- DevTools Offline → submit → "queued" badge → Online → dashboard ticks up within 3 seconds (test this 5×)
- `/dashboard` loads under 2s, gauges render, polygon view + deforestation toggle work
- Batch transit simulator drops pings on both `/dashboard` and `/buyer` simultaneously
- `/buyer/[batchCode]` — signature button surfaces near destination, signing produces a permanent green stamp with SHA-256 hash, stamp persists across reload
- SignOz Cloud shows traces for a fresh registration and a signature
- All 7 fallback paths in `HERB_BACKEND_BRIEF.md` §9 tested
- No "Beta/Demo/WIP/Lorem/placeholder" strings, no `@*.demo` emails anywhere visible
- Rehearse the 15-minute walkthrough script in `HERB_BACKEND_BRIEF.md` §5

---

## 8. Operating rules learned the hard way

- **Always pull `main` at the start of every phase.** The #1 source of confusion was lanes "blocked" on files that another lane had already merged — they just hadn't pulled.
- **Check which tab is focused before pasting.** A prompt in the wrong tab makes that lane try to switch branches. If it happens: "Stop. You are Lane X on branch Y. Revert any out-of-lane work."
- **`/clear` only at clean handoff points** (end of a phase), never mid-task. After `/clear`, the first message must re-establish identity.
- **`/btw` spawns a side branch.** Work pasted after it lands in the side conversation. Return with `/resume <id>`, or just `/clear` if the tab is tangled.
- **Long "runtime" numbers are session age, not compute.** Idle tabs left open overnight cost nothing.
- **The org-subscription error** ("Your organization has disabled Claude subscription access for Claude Code") is the one real risk. It cleared on its own once. If it recurs across all tabs, it's an account-level issue — check Claude account settings or add an Anthropic API key before continuing.
- **convex-watch tab:** never clear it, it's just the `npx convex dev` watcher.

---

## 9. Quick reference

- Convex deployment: `dutiful-setter-35` · Cloud URL `https://dutiful-setter-35.convex.cloud`
- Seed users (passwords in gitignored `CREDENTIALS.md`): `amani.tarimo@kncu.coop.tz` (field agent), `david.mushi@kncu.coop.tz` (co-op admin), `procurement@nordicroasters.no` (buyer)
- Local dev: `localhost:3000`
- Branches: `main`, `lane/1-data`, `lane/2-field`, `lane/3-dashboard`
- Key commits: `6bbcd23` (Lane 1 HANDOFFs on main), `cec95c1` (Lane 2 Phase 3)

---

*Paste this entire file into a new Cowork channel to continue. The assistant there should start by confirming it understands the three-lane state in §3, then help execute §4.*
