import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Used by Lane 3's audit drawer — returns last 50 events for any entity.
export const recentForEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, { entityType, entityId }) => {
    return ctx.db
      .query("auditEvents")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", entityType).eq("entityId", entityId),
      )
      .order("desc")
      .take(50);
  },
});

// Global event feed — coop_admin only. Used by app/audit/page.tsx.
export const recentAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const actorId = await getAuthUserId(ctx);
    if (!actorId) return [];
    const user = await ctx.db.get(actorId);
    if (user?.role !== "coop_admin") return [];
    return ctx.db
      .query("auditEvents")
      .order("desc")
      .take(limit ?? 100);
  },
});

export const recentByActor = query({
  args: { actor: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, { actor, limit }) => {
    return ctx.db
      .query("auditEvents")
      .withIndex("by_actor", (q) => q.eq("actor", actor))
      .order("desc")
      .take(limit ?? 20);
  },
});
