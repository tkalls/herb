"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { simulatedWalk, walkFrame } from "./_lib/simulatedWalk";
import type { LatLng } from "./_lib/simulatedWalk";

export type GeoJSONPolygon = { type: "Polygon"; coordinates: number[][][] };

export interface PolygonCaptureProps {
  villageCenter: LatLng;
  seed?: number;
  mode?: "simulated";
  onComplete: (geojson: GeoJSONPolygon, areaHa: number) => void;
}

const TOTAL_POINTS = 12;
const WALK_INTERVAL_MS = 1500;

export default function PolygonCapture({
  villageCenter,
  seed = 42,
  onComplete,
}: PolygonCaptureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // maplibre-gl Map type — use unknown to avoid importing types at module level (ssr:false)
  const mapRef = useRef<{ remove: () => void; on: (e: string, cb: () => void) => void; getSource: (id: string) => { setData: (d: unknown) => void } | undefined; addSource: (id: string, src: unknown) => void; addLayer: (l: unknown) => void } | null>(null);
  const mapLoadedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const walkPathRef = useRef<LatLng[]>([]);
  const stepRef = useRef(0);

  const [walkState, setWalkState] = useState<"idle" | "walking" | "paused" | "complete">("idle");
  const [displayStep, setDisplayStep] = useState(0);
  const [areaHa, setAreaHa] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !containerRef.current) return;

      const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: apiKey
          ? `https://api.maptiler.com/maps/satellite/style.json?key=${apiKey}`
          : {
              version: 8 as const,
              sources: {
                osm: {
                  type: "raster" as const,
                  tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                  tileSize: 256,
                },
              },
              layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
            },
        center: [villageCenter.lng, villageCenter.lat] as [number, number],
        zoom: 16,
        attributionControl: {},
      });

      map.on("load", () => {
        mapLoadedRef.current = true;
      });

      mapRef.current = map as typeof mapRef.current;
    })();

    return () => {
      cancelled = true;
      mapLoadedRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [villageCenter.lat, villageCenter.lng]);

  const renderPolygon = useCallback(
    async (pts: LatLng[], closed: boolean) => {
      const map = mapRef.current;
      if (!map || !mapLoadedRef.current || pts.length < 2) return;

      const coords = pts.map((p) => [p.lng, p.lat]);
      const geojsonData = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [coords] },
            properties: {},
          },
        ],
      };

      const src = map.getSource("walk-polygon");
      if (src) {
        src.setData(geojsonData);
      } else {
        map.addSource("walk-polygon", { type: "geojson", data: geojsonData });
        map.addLayer({
          id: "walk-fill",
          type: "fill",
          source: "walk-polygon",
          paint: { "fill-color": "#059669", "fill-opacity": 0.15 },
        });
        map.addLayer({
          id: "walk-stroke",
          type: "line",
          source: "walk-polygon",
          paint: {
            "line-color": "#047857",
            "line-width": 2,
            "line-dasharray": [6, 4],
          },
        });
      }

      if (closed && pts.length >= 3) {
        // Upgrade fill and stroke to solid on close
        map.addLayer({
          id: "walk-fill-closed",
          type: "fill",
          source: "walk-polygon",
          paint: { "fill-color": "#059669", "fill-opacity": 0.25 },
        });
        map.addLayer({
          id: "walk-stroke-closed",
          type: "line",
          source: "walk-polygon",
          paint: { "line-color": "#047857", "line-width": 2 },
        });

        const { polygon } = await import("@turf/helpers");
        const { default: turfArea } = await import("@turf/area");
        const poly = polygon([coords]);
        const sqM = turfArea(poly) as number;
        const ha = sqM / 10_000;
        setAreaHa(ha);

        const geojsonPolygon: GeoJSONPolygon = {
          type: "Polygon",
          coordinates: [coords],
        };
        onComplete(geojsonPolygon, ha);
      }
    },
    [onComplete],
  );

  const tick = useCallback(async () => {
    stepRef.current += 1;
    const n = stepRef.current;
    setDisplayStep(n);

    const closed = n >= TOTAL_POINTS;
    // Show n+1 points: at step 12, walkFrame(path, 13) = all 13 pts (ring closed)
    const frame = walkFrame(walkPathRef.current, closed ? walkPathRef.current.length : n + 1);
    await renderPolygon(frame, closed);

    if (closed) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setWalkState("complete");
    }
  }, [renderPolygon]);

  const startWalk = useCallback(() => {
    walkPathRef.current = simulatedWalk(villageCenter, seed);
    stepRef.current = 0;
    setWalkState("walking");
    setDisplayStep(0);

    intervalRef.current = setInterval(() => {
      tick();
    }, WALK_INTERVAL_MS);
  }, [villageCenter, seed, tick]);

  const pauseWalk = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setWalkState("paused");
  }, []);

  const resumeWalk = useCallback(() => {
    setWalkState("walking");
    intervalRef.current = setInterval(() => {
      tick();
    }, WALK_INTERVAL_MS);
  }, [tick]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const progress =
    walkState === "complete" ? 1 : displayStep / TOTAL_POINTS;

  let buttonLabel: string;
  if (walkState === "idle") {
    buttonLabel = "Start walk";
  } else if (walkState === "complete") {
    buttonLabel = "Walk complete";
  } else {
    buttonLabel = `Walking — ${displayStep} of ${TOTAL_POINTS}`;
  }

  return (
    <div className="relative rounded-xl border border-stone-200 overflow-hidden aspect-[4/3] md:aspect-[16/10]">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Accuracy chip — top left */}
      <div className="absolute top-2 left-2 z-10 rounded-md bg-white/90 border border-stone-200 px-2 py-1 text-xs font-mono text-emerald-700">
        ±3 m
      </div>

      {/* Area chip — bottom left, visible once polygon closes */}
      {areaHa !== null && (
        <div className="absolute bottom-16 left-2 z-10 rounded-md bg-white/90 border border-stone-200 px-2 py-1 text-xs font-mono tabular-nums text-stone-800">
          {areaHa.toFixed(2)} ha
        </div>
      )}

      {/* Walk controls */}
      <div className="absolute bottom-2 inset-x-2 z-10 flex gap-2">
        <button
          type="button"
          onClick={walkState === "idle" ? startWalk : undefined}
          disabled={walkState === "walking" || walkState === "complete"}
          className="relative flex-1 min-h-14 rounded-2xl bg-emerald-700 text-white font-semibold text-sm overflow-hidden disabled:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
        >
          <span
            className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
          <span className="relative z-10">{buttonLabel}</span>
        </button>

        {walkState === "walking" && (
          <button
            type="button"
            onClick={pauseWalk}
            className="min-h-14 px-4 rounded-2xl bg-white border border-stone-200 text-stone-700 font-medium text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
          >
            Pause
          </button>
        )}
        {walkState === "paused" && (
          <button
            type="button"
            onClick={resumeWalk}
            className="min-h-14 px-4 rounded-2xl bg-white border border-stone-200 text-stone-700 font-medium text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2"
          >
            Resume
          </button>
        )}
      </div>
    </div>
  );
}
