/**
 * Herb Buyer API — Cloudflare Worker
 *
 * Public read-only endpoint: GET /v1/batches/:batchCode/trace
 * Proxies Convex buyer.traceByCode (no PII — farmer initials only).
 * Cached at the edge for 60 s to reduce Convex read units.
 *
 * Deploy: wrangler deploy
 * Secrets: wrangler secret put CONVEX_URL && wrangler secret put CONVEX_SITE_URL
 */

export interface Env {
  /** Convex deployment URL, e.g. https://happy-animal-123.convex.cloud */
  CONVEX_URL: string;
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
} as const;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(req.url);
    const match = url.pathname.match(/^\/v1\/batches\/([^/]+)\/trace$/);
    if (!match) {
      return Response.json({ error: "Not found" }, { status: 404, headers: CORS_HEADERS });
    }

    const batchCode = match[1];

    // Convex HTTP API — public query, no auth token required
    const convexUrl = `${env.CONVEX_URL}/api/query`;
    let upstream: Response;
    try {
      upstream = await fetch(convexUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: "buyer:traceByCode", args: { code: batchCode } }),
      });
    } catch {
      return Response.json(
        { error: "Upstream unreachable" },
        { status: 503, headers: CORS_HEADERS },
      );
    }

    if (!upstream.ok) {
      return Response.json(
        { error: "Upstream error", status: upstream.status },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    const payload = await upstream.json() as { value?: unknown };

    // Convex wraps the result in { value: ... }
    const data = payload?.value ?? payload;

    if (data === null) {
      return Response.json(
        { error: "Batch not found", code: batchCode },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    return Response.json(data, {
      headers: {
        ...CORS_HEADERS,
        "cache-control": "public, max-age=60, stale-while-revalidate=30",
      },
    });
  },
};
