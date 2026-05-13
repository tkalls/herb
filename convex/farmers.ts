import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { withAudit } from "./_lib/audited";

export const listByCoop = query({
  args: { cooperativeId: v.id("cooperatives") },
  handler: async (ctx, { cooperativeId }) => {
    return ctx.db
      .query("farmers")
      .withIndex("by_coop", (q) => q.eq("cooperativeId", cooperativeId))
      .collect();
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return ctx.db
      .query("farmers")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
  },
});

// Used by /field. registeredBy is resolved from the auth session, not passed by the client.
export const create = mutation({
  args: {
    cooperativeId: v.id("cooperatives"),
    code: v.string(),
    fullName: v.string(),
    phone: v.string(),
    nationalId: v.string(),
    village: v.string(),
    district: v.string(),
    region: v.string(),
  },
  handler: async (ctx, args) => {
    const actorId = await getAuthUserId(ctx);
    if (!actorId) throw new Error("Authentication required");
    return withAudit(ctx, "farmer.create", async () => {
      const id = await ctx.db.insert("farmers", {
        ...args,
        registeredBy: actorId,
        registeredAt: Date.now(),
      });
      return { id: id as string, entityType: "farmer", diff: { code: args.code } };
    });
  },
});

// Internal version used by the seed (bypasses auth + audit).
export const createInternal = internalMutation({
  args: {
    cooperativeId: v.id("cooperatives"),
    code: v.string(),
    fullName: v.string(),
    phone: v.string(),
    nationalId: v.string(),
    village: v.string(),
    district: v.string(),
    region: v.string(),
    registeredBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("farmers", {
      ...args,
      registeredAt: Date.now(),
    });
  },
});
