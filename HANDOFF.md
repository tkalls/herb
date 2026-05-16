# Lane 2 → Lane 1 Handoff Requests

## Request 1 — `farms.create` public mutation (BLOCKING Phase 2 acceptance)

**Needed by:** `lib/sync/useSyncQueue.ts` drain loop  
**Blocked because:** only `farms.createInternal` exists; it bypasses auth + audit and cannot be called from client code.

**Requested signature** (match the `withAudit` pattern already used in `farmers.create`):

```ts
// convex/farms.ts
export const create = mutation({
  args: {
    farmerId: v.id("farmers"),
    code: v.string(),
    crop: v.union(v.literal("coffee"), v.literal("avocado"), v.literal("macadamia")),
    variety: v.string(),
    estimatedAreaHa: v.number(),
    certifications: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return withAudit(ctx, "farm.create", async () => {
      const id = await ctx.db.insert("farms", {
        ...args,
        verificationStatus: "unverified",
        eudrCompliant: false,
        eudrScore: 0,
        deforestationRisk: "none",
        lastSyncedAt: Date.now(),
      });
      return { id: id as string, entityType: "farm", diff: { code: args.code } };
    });
  },
});
```

**Lane 2 unblocks:** Once this is in `convex/_generated/api`, Lane 2 will replace the stub in `useSyncQueue.ts` and the full acceptance test (steps 7-9) will pass.

---

## Request 2 — `farms.attachPolygon` — make `r2Key` optional

**Current:** `r2Key: v.string()` is required.  
**Needed:** For the inline polygon path (< 64 KB), there is no R2 key. Lane 2 currently passes `""` as a sentinel — that's fragile.

**Requested change:**
```ts
r2Key: v.optional(v.string()),
```

---

## Request 3 — `r2.presignPolygonUpload` action

**Needed for:** large polygon uploads (> 64 KB) in Phase 2 acceptance item E.  
**Requested signature:**

```ts
// convex/r2.ts
export const presignPolygonUpload = action({
  args: { farmCode: v.string() },
  handler: async (_ctx, { farmCode }) => {
    // see HERB_BACKEND_BRIEF.md §4 Phase 2.5 for the S3Client setup
    const key = `polygons/${farmCode}-${Date.now()}.geojson`;
    const url = await getSignedUrl(...);
    return { key, url };
  },
});
```
