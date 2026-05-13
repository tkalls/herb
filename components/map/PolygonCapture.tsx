"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl";
import { simulatedWalk, walkFrame, type LatLng } from "./_lib/simulatedWalk";

// Inline type until @types/geojson is installed
type GeoJSONPolygon = { type: "Polygon"; coordinates: number[][][] };

// @turf imports — resolved once deps are installed by Lane 1
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let turfArea: (geojson: any) => number = () => 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let turfHelpers: { polygon: (coords: number[][][]) => any } = { polygon: () => null };
if (typeof window !== "undefined") {
  import("@turf/area").then((m) => { turfArea = m.default ?? m; });
  import("@turf/helpers").then((m) => { turfHelpers = m; });
}

export interface PolygonCaptureProps {
  /** Center point for the walk path */
  villageCenter: LatLng;
  /** Seed for the deterministic walk — use farm code hash or index */
  seed?: number;
  /** v1 always passes "simulated"; v1.1 will add "geolocation" */
  mode?: "simulated";
  onComplete: (geojson: GeoJSONPolygon, areaHa: number) => void;
}

type CaptureState = "idle" | "walking" | "paused" | "complete";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";
const WALK_INTERVAL_MS = 1500;
const TOTAL_POINTS = 12;

function latlngToCoord(p: LatLng): [number, number] {
  return [p.lng, p.lat];
}

export default function PolygonCapture({
  villageCenter,
  seed = 1,
  mode = "simulated",
  onComplete,
}: PolygonCaptureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathRef = useRef<LatLng[]>([]);
  const tickRef = useRef(0);

  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [pointCount, setPointCount] = useState(0);
  const [areaHa, setAreaHa] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialise MapLibre once
  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;
    let destroyed = false;

    import("maplibre-gl").then(({ Map, NavigationControl }) => {
      if (destroyed || !containerRef.current) return;

      const styleUrl = MAPTILER_KEY
        ? `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`
        : "https://demotiles.maplibre.org/style.json";

      const map = new Map({
        container: containerRef.current,
        style: styleUrl,
        center: [villageCenter.lng, villageCenter.lat],
        zoom: 16,
        attributionControl: true,
      });

      map.addControl(new NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        // Polygon source
        map.addSource("walk-polygon", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "Polygon", coordinates: [[]] }, properties: {} },
        });
        map.addLayer({
          id: "walk-polygon-fill",
          type: "fill",
          source: "walk-polygon",
          paint: { "fill-color": "#10b981", "fill-opacity": 0.15 },
        });
        map.addLayer({
          id: "walk-polygon-line",
          type: "line",
          source: "walk-polygon",
          paint: {
            "line-color": "#059669",
            "line-width": 2,
            "line-dasharray": [6, 4],
          },
        });

        // Head marker source
        map.addSource("walk-head", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "Point", coordinates: [villageCenter.lng, villageCenter.lat] }, properties: {} },
        });
        map.addLayer({
          id: "walk-head-circle",
          type: "circle",
          source: "walk-head",
          paint: {
            "circle-radius": 7,
            "circle-color": "#059669",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        if (!destroyed) setMapReady(true);
      });

      mapRef.current = map;
    });

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // villageCenter is stable per render; seed does not change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMapSources = useCallback((points: LatLng[], closed: boolean) => {
    const map = mapRef.current;
    if (!map) return;

    const coords = points.map(latlngToCoord);
    const ring = closed ? coords : [...coords, coords[0]].filter((_, i) => i < coords.length || coords.length >= 3);

    const polygonSrc = map.getSource("walk-polygon") as GeoJSONSource | undefined;
    polygonSrc?.setData({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [ring.length >= 3 ? ring : []] },
      properties: {},
    });

    if (points.length > 0) {
      const last = points[points.length - 1];
      const headSrc = map.getSource("walk-head") as GeoJSONSource | undefined;
      headSrc?.setData({
        type: "Feature",
        geometry: { type: "Point", coordinates: latlngToCoord(last) },
        properties: {},
      });
      map.panTo([last.lng, last.lat], { duration: 400 });
    }
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finishWalk = useCallback((fullPath: LatLng[]) => {
    stopInterval();
    // Drop the closing duplicate before building GeoJSON
    const ring = fullPath.slice(0, TOTAL_POINTS).map(latlngToCoord);
    ring.push(ring[0]); // close

    const poly = turfHelpers.polygon([ring]);
    const m2 = poly ? turfArea(poly) : 0;
    const ha = Math.round((m2 / 10_000) * 100) / 100;

    setAreaHa(ha);
    setCaptureState("complete");
    updateMapSources(fullPath.slice(0, TOTAL_POINTS), true);

    // Solid line for completed polygon
    mapRef.current?.setPaintProperty("walk-polygon-line", "line-dasharray", [1, 0]);
    mapRef.current?.setPaintProperty("walk-polygon-fill", "fill-opacity", 0.25);

    const geojson: GeoJSONPolygon = { type: "Polygon", coordinates: [ring] };
    onComplete(geojson, ha);
  }, [stopInterval, updateMapSources, onComplete]);

  const startWalk = useCallback(() => {
    if (!mapReady) return;
    const path = simulatedWalk(villageCenter, seed);
    pathRef.current = path;
    tickRef.current = 0;
    setCaptureState("walking");
    setPointCount(0);

    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      const n = tickRef.current;
      const frame = walkFrame(path, n - 1);
      setPointCount(n);
      updateMapSources(frame, false);

      if (n >= TOTAL_POINTS) {
        finishWalk(path);
      }
    }, WALK_INTERVAL_MS);
  }, [mapReady, villageCenter, seed, updateMapSources, finishWalk]);

  const pauseWalk = useCallback(() => {
    stopInterval();
    setCaptureState("paused");
  }, [stopInterval]);

  const resumeWalk = useCallback(() => {
    if (captureState !== "paused") return;
    setCaptureState("walking");

    intervalRef.current = setInterval(() => {
      tickRef.current += 1;
      const n = tickRef.current;
      const frame = walkFrame(pathRef.current, n - 1);
      setPointCount(n);
      updateMapSources(frame, false);

      if (n >= TOTAL_POINTS) {
        finishWalk(pathRef.current);
      }
    }, WALK_INTERVAL_MS);
  }, [captureState, updateMapSources, finishWalk]);

  useEffect(() => () => stopInterval(), [stopInterval]);

  // Button label + progress
  const progress = Math.round((pointCount / TOTAL_POINTS) * 100);

  let buttonLabel: string;
  let buttonAction: (() => void) | null = null;
  let buttonDisabled = false;

  if (captureState === "idle") {
    buttonLabel = "Start walk";
    buttonAction = startWalk;
    buttonDisabled = !mapReady;
  } else if (captureState === "walking") {
    buttonLabel = `Walking — ${pointCount} of ${TOTAL_POINTS} points`;
    buttonAction = null; // pause handled by separate button
    buttonDisabled = true;
  } else if (captureState === "paused") {
    buttonLabel = "Resume";
    buttonAction = resumeWalk;
  } else {
    buttonLabel = "Walk complete";
    buttonDisabled = true;
  }

  void mode; // prop reserved for v1.1 geolocation branch

  return (
    <div className="flex flex-col gap-3">
      {/* Map container */}
      <div className="relative rounded-xl border border-stone-200 overflow-hidden aspect-[4/3] md:aspect-[16/10]">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Accuracy chip — top left */}
        <div className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-mono text-emerald-700 shadow-sm">
          ±3 m
        </div>

        {/* Area chip — bottom left */}
        {areaHa !== null && (
          <div className="absolute bottom-2 left-2 z-10 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-mono tabular-nums text-stone-900 shadow-sm">
            {areaHa.toFixed(2)} ha
          </div>
        )}

        {/* Loading state */}
        {!mapReady && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-100">
            <svg className="w-6 h-6 animate-spin text-stone-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Capture controls */}
      <div className="relative">
        {/* Primary walk button */}
        <button
          onClick={buttonAction ?? undefined}
          disabled={buttonDisabled || captureState === "complete"}
          aria-label={buttonLabel}
          className="relative w-full overflow-hidden inline-flex items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3.5 text-base font-medium text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 min-h-14"
        >
          {/* Progress bar inside button */}
          {captureState === "walking" && (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          )}
          <span className="relative z-10">{buttonLabel}</span>
        </button>

        {/* Pause / resume secondary button */}
        {captureState === "walking" && (
          <button
            onClick={pauseWalk}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white min-h-9"
          >
            Pause
          </button>
        )}
      </div>
    </div>
  );
}
