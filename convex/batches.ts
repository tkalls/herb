import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const listByCoop = query({
  args: { cooperativeId: v.id("cooperatives") },
  handler: async (ctx, { cooperativeId }) => {
    return ctx.db
      .query("batches")
      .withIndex("by_coop", (q) => q.eq("cooperativeId", cooperativeId))
      .collect();
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return ctx.db
      .query("batches")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
  },
});

// Events for the chain-of-custody timeline.
export const eventsForBatch = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, { batchId }) => {
    return ctx.db
      .query("batchEvents")
      .withIndex("by_batch_at", (q) => q.eq("batchId", batchId))
      .order("asc")
      .collect();
  },
});

// Live transit pings — subscribed by the buyer page and dashboard.
export const pingsForBatch = query({
  args: { batchId: v.id("batches") },
  handler: async (ctx, { batchId }) => {
    return ctx.db
      .query("batchPings")
      .withIndex("by_batch_at", (q) => q.eq("batchId", batchId))
      .order("desc")
      .take(30);
  },
});

// Internal version for seeding.
export const createInternal = internalMutation({
  args: {
    cooperativeId: v.id("cooperatives"),
    code: v.string(),
    crop: v.string(),
    description: v.string(),
    weightKg: v.number(),
    farmIds: v.array(v.id("farms")),
    buyerName: v.string(),
    buyerCountry: v.string(),
    status: v.union(
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("in_transit"),
      v.literal("delivered"),
    ),
    traceScore: v.number(),
    exportReadiness: v.number(),
    eudrDeclarationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("batches", args);
  },
});
