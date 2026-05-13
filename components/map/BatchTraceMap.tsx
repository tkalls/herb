"use client";

/**
 * BatchTraceMap — Phase 1 (SVG route visualization)
 *
 * Renders a dark-themed route map with a moving position marker using SVG.
 * No external map library is required for Phase 1.
 *
 * Phase 2 upgrade path:
 *   Once `maplibre-gl` is installed (Lane 1 handles `DEPS_REQUESTED.md`),
 *   replace the SvgMap inner component with a MapLibre GL canvas mounted
 *   via `useEffect` on `mapContainerRef`. The props interface, ping stream,
 *   and stub simulator are already wired — the swap is isolated to the
 *   render path inside this file.
 */

import { useEffect, useRef, useState } from "react";
import { Ship, MapPin } from "lucide-react";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface BatchHandoff {
  stage: string;
  label: string;
  location: LatLng;
  at: number;
}

interface BatchTraceMapProps {
  /** Convex batchId — used in Phase 2 to subscribe to live pings */
  batchId?: string;
  origin?: LatLng;
  destination?: LatLng;
  handoffs?: BatchHandoff[];
  /** External ping stream (Convex). When omitted, the internal stub runs. */
  pings?: LatLng[];
  className?: string;
}

// ── Defaults: Dar es Salaam → Rotterdam ─────────────────────────────────────
const DAR: LatLng = { lat: -6.7924, lng: 39.2083 };
const RTM: LatLng = { lat: 51.9244, lng: 4.4777 };

const DEFAULT_HANDOFFS: BatchHandoff[] = [
  {
    stage: "cooperative_intake",
    label: "Cooperative intake",
    location: { lat: -3.3869, lng: 36.6827 }, // Moshi
    at: Date.now() - 86_400_000 * 8,
  },
  {
    stage: "processing",
    label: "Processing",
    location: { lat: -6.1659, lng: 35.7383 }, // Dodoma
    at: Date.now() - 86_400_000 * 5,
  },
  {
    stage: "export_prep",
    label: "Export prep",
    location: DAR,
    at: Date.now() - 86_400_000 * 2,
  },
];

// ── Math helpers ─────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function generatePath(origin: LatLng, dest: LatLng, steps = 80): LatLng[] {
  return Array.from({ length: steps + 1 }, (_, i) => ({
    lat: lerp(origin.lat, dest.lat, i / steps),
    lng: lerp(origin.lng, dest.lng, i / steps),
  }));
}

// Simple equirectangular projection into the SVG viewport [0,320] × [0,200]
// Bounds: lng -30→65, lat -20→72
const BOUNDS = { lngMin: -30, lngMax: 65, latMin: -20, latMax: 72 };

function project(
  pt: LatLng,
  w = 320,
  h = 200,
): { x: number; y: number } {
  const { lngMin, lngMax, latMin, latMax } = BOUNDS;
  const x = ((pt.lng - lngMin) / (lngMax - lngMin)) * w;
  const y = ((latMax - pt.lat) / (latMax - latMin)) * h;
  return { x, y };
}

// ── SVG Map ──────────────────────────────────────────────────────────────────
function SvgMap({
  pings,
  origin,
  destination,
  handoffs,
}: {
  pings: LatLng[];
  origin: LatLng;
  destination: LatLng;
  handoffs: BatchHandoff[];
}) {
  const fullPath = generatePath(origin, destination, 100);
  const pathD = fullPath
    .map((p, i) => {
      const { x, y } = project(p);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const trail = pings.slice(-30);
  const trailD =
    trail.length > 1
      ? trail
          .map((p, i) => {
            const { x, y } = project(p);
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ")
      : null;

  const currentPing = pings.length > 0 ? pings[pings.length - 1] : null;
  const currentPos = currentPing ? project(currentPing) : null;
  const originP = project(origin);
  const destP = project(destination);

  return (
    <div className="relative w-full h-full bg-stone-950 rounded-xl overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 320 200"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* Subtle latitude grid */}
        {[20, 40, 60].map((lat) => {
          const y = project({ lat, lng: 0 }).y;
          return (
            <line
              key={lat}
              x1="0"
              y1={y}
              x2="320"
              y2={y}
              stroke="#292524"
              strokeWidth="0.5"
            />
          );
        })}
        {[-20, 0, 20, 40, 60].map((lng) => {
          const x = project({ lat: 0, lng }).x;
          return (
            <line
              key={lng}
              x1={x}
              y1="0"
              x2={x}
              y2="200"
              stroke="#292524"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Dashed route (full path) */}
        <path
          d={pathD}
          fill="none"
          stroke="#16a34a"
          strokeWidth="1.5"
          strokeOpacity="0.5"
          strokeDasharray="5 4"
        />

        {/* Solid fading trail (last 30 pings) */}
        {trailD && (
          <path
            d={trailD}
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
            strokeOpacity="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Handoff stage dots */}
        {handoffs.map((h) => {
          const p = project(h.location);
          return (
            <g key={h.stage}>
              <circle cx={p.x} cy={p.y} r="3" fill="#15803d" />
              <text
                x={p.x + 5}
                y={p.y + 3}
                fill="#78716c"
                fontSize="5.5"
                fontFamily="monospace"
              >
                {h.label}
              </text>
            </g>
          );
        })}

        {/* Origin dot */}
        <circle cx={originP.x} cy={originP.y} r="4" fill="#15803d" />
        <text
          x={originP.x + 6}
          y={originP.y + 3}
          fill="#a8a29e"
          fontSize="5.5"
          fontFamily="monospace"
        >
          Dar es Salaam
        </text>

        {/* Destination dot */}
        <circle cx={destP.x} cy={destP.y} r="4" fill="#15803d" />
        <text
          x={destP.x - 42}
          y={destP.y - 6}
          fill="#a8a29e"
          fontSize="5.5"
          fontFamily="monospace"
        >
          Rotterdam
        </text>

        {/* Current position marker */}
        {currentPos && (
          <>
            {/* Pulse ring — suppressed under prefers-reduced-motion */}
            <circle
              cx={currentPos.x}
              cy={currentPos.y}
              r="9"
              fill="#f59e0b"
              fillOpacity="0.25"
              className="motion-safe:[animation:pulse_2s_ease-in-out_infinite]"
            />
            <circle
              cx={currentPos.x}
              cy={currentPos.y}
              r="5"
              fill="#f59e0b"
              stroke="white"
              strokeWidth="1.5"
            />
          </>
        )}
      </svg>

      {/* Status chip */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-mono text-stone-400">
        <Ship size={12} className="text-amber-500" aria-hidden="true" />
        {currentPing ? "In transit" : "Route preview"}
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1.5 right-2 text-[10px] text-stone-600 font-mono">
        herb.shamba
      </div>
    </div>
  );
}

// ── BatchTraceMap ─────────────────────────────────────────────────────────────
export default function BatchTraceMap({
  batchId: _batchId,
  origin = DAR,
  destination = RTM,
  handoffs = DEFAULT_HANDOFFS,
  pings: externalPings,
  className = "",
}: BatchTraceMapProps) {
  const [stubPings, setStubPings] = useState<LatLng[]>([]);
  const stepRef = useRef(0);

  // Stub simulator — runs when no external ping stream is provided
  useEffect(() => {
    if (externalPings !== undefined) return;
    const path = generatePath(origin, destination, 80);
    const interval = setInterval(() => {
      if (stepRef.current >= path.length) {
        clearInterval(interval);
        return;
      }
      setStubPings((prev) => [...prev, path[stepRef.current]]);
      stepRef.current++;
    }, 250);
    return () => clearInterval(interval);
  }, [externalPings, origin, destination]);

  const activePings = externalPings ?? stubPings;

  return (
    <div
      className={`relative rounded-xl border border-stone-200 overflow-hidden aspect-[4/3] md:aspect-[16/10] ${className}`}
      role="img"
      aria-label={`Transit route from ${origin.lat.toFixed(2)},${origin.lng.toFixed(2)} to ${destination.lat.toFixed(2)},${destination.lng.toFixed(2)}`}
    >
      <SvgMap
        pings={activePings}
        origin={origin}
        destination={destination}
        handoffs={handoffs}
      />

      {/* MapLibre container — wired in Phase 2 once maplibre-gl is installed */}
      {/* TODO(phase-2): mount MapLibre here via useEffect + useRef */}
    </div>
  );
}
