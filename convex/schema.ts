import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Extend users with role + displayName, preserving auth-required indexes.
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(
      v.union(
        v.literal("field_agent"),
        v.literal("coop_admin"),
        v.literal("buyer"),
      ),
    ),
    displayName: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  cooperatives: defineTable({
    name: v.string(),
    code: v.string(),
    region: v.string(),
    district: v.string(),
    country: v.string(),
  }).index("by_code", ["code"]),

  farmers: defineTable({
    cooperativeId: v.id("cooperatives"),
    code: v.string(),
    fullName: v.string(),
    phone: v.string(),
    nationalId: v.string(),
    village: v.string(),
    district: v.string(),
    region: v.string(),
    // Mobile-money payout hooks — schema ready, activation post-launch.
    payoutRail: v.optional(
      v.union(
        v.literal("mpesa"),
        v.literal("mtn_momo"),
        v.literal("airtel_money"),
        v.literal("bank"),
      ),
    ),
    payoutNumberMasked: v.optional(v.string()),
    registeredBy: v.id("users"),
    registeredAt: v.number(),
  })
    .index("by_coop", ["cooperativeId"])
    .index("by_code", ["code"]),

  farms: defineTable({
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
    polygonR2Key: v.optional(v.string()),
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
    lastSyncedAt: v.number(),
  })
    .index("by_farmer", ["farmerId"])
    .index("by_code", ["code"]),

  batches: defineTable({
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
    certificateR2Key: v.optional(v.string()),
  })
    .index("by_coop", ["cooperativeId"])
    .index("by_code", ["code"]),

  auditEvents: defineTable({
    actor: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    diff: v.optional(v.any()),
    traceId: v.string(),
    at: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_actor", ["actor"]),

  batchEvents: defineTable({
    batchId: v.id("batches"),
    stage: v.union(
      v.literal("harvest"),
      v.literal("village_collection"),
      v.literal("cooperative_intake"),
      v.literal("processing"),
      v.literal("export_prep"),
      v.literal("in_transit"),
      v.literal("received"),
    ),
    actorName: v.string(),
    actorRole: v.string(),
    location: v.optional(
      v.object({ lat: v.number(), lng: v.number(), place: v.string() }),
    ),
    evidenceR2Key: v.optional(v.string()),
    signatureHash: v.optional(v.string()),
    note: v.optional(v.string()),
    at: v.number(),
  }).index("by_batch_at", ["batchId", "at"]),

  batchPings: defineTable({
    batchId: v.id("batches"),
    lat: v.number(),
    lng: v.number(),
    speedKph: v.number(),
    at: v.number(),
  }).index("by_batch_at", ["batchId", "at"]),

  // Reserved for post-launch payout ledger — schema only in v1.
  farmerPayouts: defineTable({
    farmerId: v.id("farmers"),
    batchId: v.id("batches"),
    amountCents: v.number(),
    currency: v.string(),
    rail: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
    ),
    referenceId: v.optional(v.string()),
    at: v.number(),
  })
    .index("by_farmer_at", ["farmerId", "at"])
    .index("by_batch", ["batchId"]),
});
