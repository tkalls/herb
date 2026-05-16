/**
 * lib/otel.ts — OpenTelemetry init for browser + Convex node contexts.
 *
 * Browser: call initOtel() once from a client useEffect. After registration,
 * `browserTracer` emits real spans to SignOz via OTLP/HTTP.
 *
 * Convex/Node side: convex/_lib/audited.ts generates W3C-compatible 128-bit
 * trace IDs via crypto.getRandomValues — compatible with OTEL without
 * requiring the Node SDK inside Convex's custom runtime.
 *
 * Lane 2 imports `browserTracer` to instrument the sync-queue drain spans.
 */

import { trace, type Tracer } from "@opentelemetry/api";

// Module-level tracer — no-op API before provider.register(), real after.
// Safe to call on the server: OTEL's no-op tracer produces zero overhead.
export const browserTracer: Tracer = trace.getTracer("herb-browser", "1.0.0");

let _initialized = false;

/**
 * Initialize the browser WebTracerProvider with an OTLP/HTTP exporter
 * pointing at SignOz Cloud. No-op on the server.
 *
 * Call once from a client-side useEffect in ConvexClientProvider or layout.
 *
 * Required env vars (NEXT_PUBLIC_* so they reach the browser bundle):
 *   NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT — e.g. https://ingest.us.signoz.cloud:443/v1/traces
 *   NEXT_PUBLIC_OTEL_INGESTION_KEY          — SignOz ingestion key
 */
export function initOtel(): void {
  if (typeof window === "undefined" || _initialized) return;
  _initialized = true;

  void Promise.all([
    import("@opentelemetry/sdk-trace-web"),
    import("@opentelemetry/exporter-trace-otlp-http"),
  ]).then(([{ WebTracerProvider, BatchSpanProcessor }, { OTLPTraceExporter }]) => {
    const endpoint =
      process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT ??
      "https://ingest.us.signoz.cloud:443/v1/traces";

    const ingestionKey = process.env.NEXT_PUBLIC_OTEL_INGESTION_KEY ?? "";

    const exporter = new OTLPTraceExporter({
      url: endpoint,
      headers: ingestionKey ? { "signoz-ingestion-key": ingestionKey } : {},
    });

    // v2 API: processors are passed in constructor config, not addSpanProcessor
    const provider = new WebTracerProvider({
      spanProcessors: [new BatchSpanProcessor(exporter)],
    });
    provider.register();
  });
}
