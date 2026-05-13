import { query } from "./_generated/server";
import { v } from "convex/values";

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return ctx.db
      .query("cooperatives")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("cooperatives").collect();
  },
});
