import { mutation, internalMutation, internalQuery, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Great-circle waypoints: Dar es Salaam → Rotterdam via Suez Canal.
// Each segment ≈ 500–800 km. advanceTransit inserts pings along this path.
const ROUTE: [number, number][] = [
  [-6.7924,  39.2083], // Dar es Salaam
  [-4.0,     40.5   ], // Mozambique Channel north
  [ 4.0,     44.0   ], // Off Somalia coast
  [11.5,     43.5   ], // Gulf of Aden
  [20.0,     38.0   ], // Red Sea mid
  [29.9,     32.5   ], // Suez Canal
  [33.0,     25.0   ], // Eastern Mediterranean
  [36.0,     15.0   ], // Central Mediterranean
  [38.0,      5.0   ], // Western Mediterranean
  [36.0,     -5.5   ], // Strait of Gibraltar
  [45.0,     -8.0   ], // Atlantic (Bay of Biscay)
  [49.0,     -2.5   ], // English Channel
  [51.9225,   4.4792], // Rotterdam
];

// Total virtual steps across all segments (pings per full journey).
const TOTAL_STEPS = (ROUTE.length - 1) * 10;

function positionAtStep(step: number): [number, number] {
  const clamped = Math.min(step, TOTAL_STEPS);
  const segmentF = (clamped / TOTAL_STEPS) * (ROUTE.length - 1);
  const segIdx = Math.min(Math.floor(segmentF), ROUTE.length - 2);
  const t = segmentF - segIdx;
  const a = ROUTE[segIdx];
  const b = ROUTE[segIdx + 1];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Dispatches the batch and inserts the first ping at origin.
export const simulateBatchTransit = mutation({
  args: { batchId: v.id("batches") },
  handler: async (ctx, { batchId }) => {
    await ctx.db.patch(batchId, { status: "in_transit" });
    const [lat, lng] = ROUTE[0];
    await ctx.db.insert("batchPings", {
      batchId,
      lat,
      lng,
      speedKph: 0,
      at: Date.now(),
    });
  },
});

// Internal — called by advanceTransit to append a single ping.
export const addPing = internalMutation({
  args: {
    batchId: v.id("batches"),
    lat: v.number(),
    lng: v.number(),
    speedKph: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("batchPings", { ...args, at: Date.now() });
  },
});

// Called by the dashboard "+30 min" button — advances the transit marker
// by `steps` positions along the great-circle route (default 5 ≈ 125 km).
export const advanceTransit = action({
  args: {
    batchId: v.id("batches"),
    steps: v.optional(v.number()),
  },
  handler: async (ctx, { batchId, steps = 5 }): Promise<void> => {
    const pings = await ctx.runQuery(internal.transit.pingCount, { batchId });
    const base = Math.max(0, pings - 1); // current step index

    for (let i = 1; i <= steps; i++) {
      const [lat, lng] = positionAtStep(base + i);
      await ctx.runMutation(internal.transit.addPing, {
        batchId,
        lat,
        lng,
        speedKph: 22,
      });
    }
  },
});

// Internal query — returns current ping count so advanceTransit knows where we are.
export const pingCount = internalQuery({
  args: { batchId: v.id("batches") },
  handler: async (ctx, { batchId }) => {
    const rows = await ctx.db
      .query("batchPings")
      .withIndex("by_batch_at", (q) => q.eq("batchId", batchId))
      .collect();
    return rows.length;
  },
});
