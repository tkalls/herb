import { MutationCtx, internalMutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export function generateTraceId(): string {
  // Hex trace ID compatible with OpenTelemetry W3C format.
  // Phase 3 replaces this with real OTEL context propagation.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Call INSIDE a mutation handler to pair any DB write with an auditEvents row.
 *
 * Usage:
 *   handler: async (ctx, args) => {
 *     return withAudit(ctx, "farmer.create", async () => {
 *       const id = await ctx.db.insert("farmers", { ... });
 *       return { id: id as string, entityType: "farmer", diff: args };
 *     });
 *   }
 *
 * Throws if called without an authenticated session.
 */
export async function withAudit(
  ctx: MutationCtx,
  actionName: string,
  fn: () => Promise<{ id: string; entityType: string; diff?: unknown }>,
): Promise<{ id: string; traceId: string }> {
  const traceId = generateTraceId();
  const actorId = await getAuthUserId(ctx);
  if (!actorId) throw new Error("Authentication required");

  const result = await fn();

  await ctx.db.insert("auditEvents", {
    actor: actorId,
    action: actionName,
    entityType: result.entityType,
    entityId: result.id,
    diff: result.diff,
    traceId,
    at: Date.now(),
  });

  return { id: result.id, traceId };
}

// Standalone internal mutation for writing audit rows from actions (Phase 3).
export const writeAuditEvent = internalMutation({
  args: {
    actor: v.id("users"),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    diff: v.optional(v.any()),
    traceId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditEvents", { ...args, at: Date.now() });
  },
});
