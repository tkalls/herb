import { query } from "./_generated/server";
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
