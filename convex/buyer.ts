import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Public trace query — no PII. Farmer names are reduced to initials.
export const traceByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const batch = await ctx.db
      .query("batches")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (!batch) return null;

    const farms = await Promise.all(
      batch.farmIds.map((fid) => ctx.db.get(fid)),
    );
    const farmerIds = [...new Set(farms.map((f) => f?.farmerId).filter(Boolean))];
    const farmers = await Promise.all(farmerIds.map((fid) => ctx.db.get(fid!)));

    const events = await ctx.db
      .query("batchEvents")
      .withIndex("by_batch_at", (q) => q.eq("batchId", batch._id))
      .order("asc")
      .collect();

    const pings = await ctx.db
      .query("batchPings")
      .withIndex("by_batch_at", (q) => q.eq("batchId", batch._id))
      .order("desc")
      .take(1);

    return {
      code: batch.code,
      crop: batch.crop,
      description: batch.description,
      status: batch.status,
      weightKg: batch.weightKg,
      eudrDeclarationId: batch.eudrDeclarationId,
      traceScore: batch.traceScore,
      exportReadiness: batch.exportReadiness,
      receiptSigner: batch.receiptSigner,
      receiptAt: batch.receiptAt,
      receiptHash: batch.receiptHash,
      // Initials only — no full names or contact details exposed
      farmerInitials: farmers.map((f) =>
        f?.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
      ),
      farmCount: batch.farmIds.length,
      chainOfCustody: events.map((e) => ({
        stage: e.stage,
        actorRole: e.actorRole,
        location: e.location,
        at: e.at,
        signatureHash: e.signatureHash,
      })),
      lastPing: pings[0] ?? null,
    };
  },
});

// Called by SignatureButton — marks batch delivered and stores receipt hash.
// Uses Web Crypto (crypto.subtle) — available in Convex mutation context.
export const confirmReceipt = mutation({
  args: {
    batchId: v.id("batches"),
    signerName: v.string(),
  },
  handler: async (ctx, { batchId, signerName }) => {
    const at = Date.now();
    const raw = `${batchId}:${signerName}:${at}`;
    const encoded = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await ctx.db.patch(batchId, {
      status: "delivered",
      receiptSigner: signerName,
      receiptAt: at,
      receiptHash: hash,
    });
    return { hash, at };
  },
});
