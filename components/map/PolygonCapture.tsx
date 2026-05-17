"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { simulatedWalk } from "./_lib/simulatedWalk";
import type { LatLng } from "./_lib/simulatedWalk";

export type GeoJSONPolygon = { type: "Polygon"; coordinates: number[][][] };

export interface PolygonCaptureProps {
  villageCenter: LatLng;
  seed?: number;
  mode?: "simulated";
  onComplete: (geojson: GeoJSONPolygon, areaHa: number) => void;
}

const TOTAL_POINTS = 12;
const WALK_INTERVAL_MS = 900;
const SVG_W = 420;
const SVG_H = 300;
const PAD = 40;

// Map lat/lng path → SVG pixel coords
function toSVG(pts: LatLng[]): { x: number; y: number }[] {
  if (pts.length === 0) return [];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const rangeW = maxLng - minLng || 1e-6;
  const rangeH = maxLat - minLat || 1e-6;
  const drawW = SVG_W - PAD * 2;
  const drawH = SVG_H - PAD * 2;
  const scale = Math.min(drawW / rangeW, drawH / rangeH) * 0.85;
  const cx = (SVG_W) / 2;
  const cy = (SVG_H) / 2;
  return pts.map((p) => ({
    x: cx + ((p.lng - (minLng + rangeW / 2)) * scale),
    y: cy - ((p.lat - (minLat + rangeH / 2)) * scale),
  }));
}

function pointsToPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

export default function PolygonCapture({
  villageCenter,
  seed = 42,
  onComplete,
}: PolygonCaptureProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const walkPathRef = useRef<LatLng[]>([]);
  const svgPtsRef = useRef<{ x: number; y: number }[]>([]);
  const stepRef = useRef(0);

  const [walkState, setWalkState] = useState<"idle" | "walking" | "paused" | "complete">("idle");
  const [displayStep, setDisplayStep] = useState(0);
  const [areaHa, setAreaHa] = useState<number | null>(null);
  const [visiblePts, setVisiblePts] = useState<{ x: number; y: number }[]>([]);

  const computeArea = useCallback(async (pts: LatLng[]) => {
    const { polygon } = await import("@turf/helpers");
    const { default: turfArea } = await import("@turf/area");
    const coords = pts.map((p) => [p.lng, p.lat]);
    const poly = polygon([coords]);
    const sqM = turfArea(poly) as number;
    const ha = sqM / 10_000;
    setAreaHa(ha);
    const geojson: GeoJSONPolygon = { type: "Polygon", coordinates: [coords] };
    onComplete(geojson, ha);
  }, [onComplete]);

  const tick = useCallback(() => {
    stepRef.current += 1;
    const n = stepRef.current;
    setDisplayStep(n);

    const closed = n >= TOTAL_POINTS;
    const count = closed ? walkPathRef.current.length : n + 1;
    const frame = walkPathRef.current.slice(0, count);
    const svgFrame = svgPtsRef.current.slice(0, count);
    setVisiblePts(svgFrame);

    if (closed) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setWalkState("complete");
      computeArea(frame);
    }
  }, [computeArea]);

  const startWalk = useCallback(() => {
    const path = simulatedWalk(villageCenter, seed);
    walkPathRef.current = path;
    svgPtsRef.current = toSVG(path);
    stepRef.current = 0;
    setWalkState("walking");
    setDisplayStep(0);
    setVisiblePts([]);
    intervalRef.current = setInterval(tick, WALK_INTERVAL_MS);
  }, [villageCenter, seed, tick]);

  const pauseWalk = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setWalkState("paused");
  }, []);

  const resumeWalk = useCallback(() => {
    setWalkState("walking");
    intervalRef.current = setInterval(tick, WALK_INTERVAL_MS);
  }, [tick]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const progress = walkState === "complete" ? 1 : displayStep / TOTAL_POINTS;
  const closed = walkState === "complete";
  const pathD = pointsToPath(visiblePts);
  const closedD = closed && visiblePts.length >= 3
    ? pathD + " Z"
    : pathD;
  const head = visiblePts[visiblePts.length - 1];

  let buttonLabel: string;
  if (walkState === "idle") buttonLabel = "Start simulation";
  else if (walkState === "complete") buttonLabel = "Walk complete ✓";
  else if (walkState === "paused") buttonLabel = "Paused";
  else buttonLabel = `Recording — ${displayStep} of ${TOTAL_POINTS} pts`;

  return (
    <div className="relative rounded-xl border border-zinc-700 overflow-hidden bg-zinc-950">
      {/* SVG map canvas */}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full"
        style={{ display: "block" }}
        aria-label="Farm boundary map"
      >
        {/* Dark satellite-style background */}
        <rect width={SVG_W} height={SVG_H} fill="#0a0a0a" />

        {/* Subtle grid */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`v${i}`} x1={(SVG_W / 8) * i} y1={0} x2={(SVG_W / 8) * i} y2={SVG_H}
            stroke="#ffffff08" strokeWidth="1" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={(SVG_H / 6) * i} x2={SVG_W} y2={(SVG_H / 6) * i}
            stroke="#ffffff08" strokeWidth="1" />
        ))}

        {/* Filled polygon (when closed) */}
        {closed && visiblePts.length >= 3 && (
          <path d={closedD} fill="#10b98122" stroke="none" />
        )}

        {/* Walking path / polygon outline */}
        {visiblePts.length >= 2 && (
          <path
            d={closed ? closedD : pathD}
            fill="none"
            stroke={closed ? "#10b981" : "#f59e0b"}
            strokeWidth="2"
            strokeDasharray={closed ? "none" : "6 4"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots at each recorded point */}
        {visiblePts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === visiblePts.length - 1 && !closed ? 5 : 3}
            fill={i === visiblePts.length - 1 && !closed ? "#f59e0b" : "#10b981"}
            stroke={i === visiblePts.length - 1 && !closed ? "#fbbf24" : "#059669"}
            strokeWidth="1.5"
          />
        ))}

        {/* Pulsing dot at current walk head */}
        {head && !closed && (
          <circle cx={head.x} cy={head.y} r={10} fill="#f59e0b22" stroke="#f59e0b44" strokeWidth="1">
            <animate attributeName="r" values="8;14;8" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.2s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Accuracy chip */}
        <rect x="8" y="8" width="42" height="22" rx="5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
        <text x="29" y="23" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#a1a1aa">±3 m</text>

        {/* Area chip (once complete) */}
        {areaHa !== null && (
          <>
            <rect x="8" y="36" width="68" height="22" rx="5" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
            <text x="42" y="51" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#10b981">
              {areaHa.toFixed(2)} ha
            </text>
          </>
        )}

        {/* GPS coords */}
        <text x={SVG_W - 8} y={SVG_H - 8} textAnchor="end" fontSize="9" fontFamily="monospace" fill="#3f3f46">
          {villageCenter.lat.toFixed(4)}, {villageCenter.lng.toFixed(4)}
        </text>
      </svg>

      {/* Walk controls */}
      <div className="p-3 flex gap-2">
        <button
          type="button"
          onClick={
            walkState === "idle" ? startWalk
            : walkState === "paused" ? resumeWalk
            : undefined
          }
          disabled={walkState === "walking" || walkState === "complete"}
          className="relative flex-1 min-h-12 rounded-xl bg-amber-500 text-black font-black text-sm overflow-hidden disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-2 transition"
        >
          {/* progress bar fill */}
          <span
            className="absolute inset-y-0 left-0 bg-black/10 transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
          <span className="relative z-10">{buttonLabel}</span>
        </button>

        {walkState === "walking" && (
          <button
            type="button"
            onClick={pauseWalk}
            className="min-h-12 px-4 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 focus-visible:outline-offset-2"
          >
            Pause
          </button>
        )}
      </div>
    </div>
  );
}
