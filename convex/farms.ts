import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { withAudit } from "./_lib/audited";

export const listByFarmer = query({
  args: { farmerId: v.id("farmers") },
  handler: async (ctx, { farmerId }) => {
    return ctx.db
      .query("farms")
      .withIndex("by_farmer", (q) => q.eq("farmerId", farmerId))
      .collect();
  },
});

export const listByCoop = query({
  args: { cooperativeId: v.id("cooperatives") },
  handler: async (ctx, { cooperativeId }) => {
    const farmers = await ctx.db
      .query("farmers")
      .withIndex("by_coop", (q) => q.eq("cooperativeId", cooperativeId))
      .collect();
    const farmArrays = await Promise.all(
      farmers.map((f) =>
        ctx.db
          .query("farms")
          .withIndex("by_farmer", (q) => q.eq("farmerId", f._id))
          .collect(),
      ),
    );
    return farmArrays.flat();
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return ctx.db
      .query("farms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
  },
});

// Called by Lane 2 after polygon capture.
export const attachPolygon = mutation({
  args: {
    farmId: v.id("farms"),
    r2Key: v.string(),
    polygonInline: v.optional(
      v.array(v.object({ lat: v.number(), lng: v.number() })),
    ),
    areaHa: v.number(),
  },
  handler: async (ctx, { farmId, r2Key, polygonInline, areaHa }) => {
    return withAudit(ctx, "farm.attachPolygon", async () => {
      await ctx.db.patch(farmId, {
        polygonR2Key: r2Key,
        polygonPreview: polygonInline?.slice(0, 8),
        estimatedAreaHa: areaHa,
        lastSyncedAt: Date.now(),
      });
      return {
        id: farmId as string,
        entityType: "farm",
        diff: { polygonR2Key: r2Key, areaHa },
      };
    });
  },
});

// Deterministic EUDR score recompute — mocked in v1, real GFW in v1.1.
export const recomputeEudr = mutation({
  args: { farmId: v.id("farms") },
  handler: async (ctx, { farmId }) => {
    return withAudit(ctx, "farm.eudrScore.compute", async () => {
      const farm = await ctx.db.get(farmId);
      if (!farm) throw new Error("Farm not found");

      const codeNum = farm.code
        .split("")
        .reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
      const riskIndex = codeNum % 4;
      const risk = (["none", "low", "low", "medium"] as const)[riskIndex];

      const docScore = farm.polygonR2Key ? 25 : 10;
      const polygonScore = (farm.polygonPreview?.length ?? 0) > 0 ? 25 : 5;
      const deforestationScore =
        risk === "none" ? 30 : risk === "low" ? 25 : risk === "medium" ? 10 : 0;
      const certScore = Math.min(farm.certifications.length * 10, 20);
      const eudrScore = docScore + polygonScore + deforestationScore + certScore;

      const verificationStatus =
        eudrScore >= 80
          ? "verified"
          : eudrScore >= 60
            ? "pending"
            : eudrScore >= 40
              ? "needs_review"
              : "unverified";

      await ctx.db.patch(farmId, {
        eudrScore,
        eudrCompliant: eudrScore >= 80,
        deforestationRisk: risk,
        verificationStatus,
        lastSyncedAt: Date.now(),
      });

      return {
        id: farmId as string,
        entityType: "farm",
        diff: { eudrScore, verificationStatus, deforestationRisk: risk },
      };
    });
  },
});

// Internal version for seeding (bypasses auth + audit).
export const createInternal = internalMutation({
  args: {
    farmerId: v.id("farmers"),
    code: v.string(),
    crop: v.union(
      v.literal("coffee"),
      v.literal("avocado"),
      v.literal("macadamia"),
    ),
    variety: v.string(),
    estimatedAreaHa: v.number(),
    certifications: v.array(v.string()),
    polygonPreview: v.optional(
      v.array(v.object({ lat: v.number(), lng: v.number() })),
    ),
    verificationStatus: v.union(
      v.literal("unverified"),
      v.literal("pending"),
      v.literal("needs_review"),
      v.literal("verified"),
    ),
    eudrCompliant: v.boolean(),
    eudrScore: v.number(),
    deforestationRisk: v.union(
      v.literal("none"),
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("farms", {
      ...args,
      lastSyncedAt: Date.now(),
    });
  },
});
