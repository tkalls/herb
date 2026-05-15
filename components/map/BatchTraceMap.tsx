"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Map as MaplibreMap, GeoJSONSource, StyleSpecification } from "maplibre-gl";
import { Loader2, Ship } from "lucide-react";

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
  /** Convex batchId — wires to live pings query when provided */
  batchId?: string;
  origin?: LatLng;
  destination?: LatLng;
  handoffs?: BatchHandoff[];
  /** External ping stream override */
  pings?: LatLng[];
  className?: string;
}

// ── Defaults: Dar es Salaam → Rotterdam ──────────────────────────────────────
const DAR: LatLng = { lat: -6.7924, lng: 39.2083 };
const RTM: LatLng = { lat: 51.9244, lng: 4.4777 };

// Route in GeoJSON [lng, lat] order — mirrors transit.ts ROUTE
const ROUTE_LNG_LAT: [number, number][] = [
  [39.2083, -6.7924],
  [40.5, -4.0],
  [44.0, 4.0],
  [43.5, 11.5],
  [38.0, 20.0],
  [32.5, 29.9],
  [25.0, 33.0],
  [15.0, 36.0],
  [5.0, 38.0],
  [-5.5, 36.0],
  [-8.0, 45.0],
  [-2.5, 49.0],
  [4.4792, 51.9225],
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function densify(coords: [number, number][], steps = 8): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      result.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
    }
  }
  result.push(coords[coords.length - 1]);
  return result;
}

const DENSE_ROUTE = densify(ROUTE_LNG_LAT);

const DEFAULT_HANDOFFS: BatchHandoff[] = [
  {
    stage: "cooperative_intake",
    label: "Cooperative intake",
    location: { lat: -3.3869, lng: 36.6827 },
    at: Date.now() - 86_400_000 * 8,
  },
  {
    stage: "processing",
    label: "Processing",
    location: { lat: -6.1659, lng: 35.7383 },
    at: Date.now() - 86_400_000 * 5,
  },
  {
    stage: "export_prep",
    label: "Export prep",
    location: DAR,
    at: Date.now() - 86_400_000 * 2,
  },
];

function buildMapStyle(): string | StyleSpecification {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (key) {
    return `https://api.maptiler.com/maps/satellite/style.json?key=${key}`;
  }
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "© <a href='https://openstreetmap.org'>OpenStreetMap</a>",
      },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": "#1c1917" } },
      {
        id: "osm",
        type: "raster",
        source: "osm",
        paint: { "raster-opacity": 0.55, "raster-saturation": -0.6 },
      },
    ],
  } as StyleSpecification;
}

// ── BatchTraceMap ─────────────────────────────────────────────────────────────
export default function BatchTraceMap({
  batchId,
  origin = DAR,
  destination = RTM,
  handoffs = DEFAULT_HANDOFFS,
  pings: externalPings,
  className = "",
}: BatchTraceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [stubPings, setStubPings] = useState<LatLng[]>([]);
  const stepRef = useRef(0);

  // Live pings from Convex when a real batchId is provided (returns newest-first)
  const convexPings = useQuery(
    api.batches.pingsForBatch,
    batchId ? { batchId: batchId as Id<"batches"> } : "skip",
  );

  // Stub simulator — runs only when no real data is available
  useEffect(() => {
    if (externalPings !== undefined) return;
    if (batchId && convexPings !== undefined && convexPings.length > 0) return;
    const path = densify(ROUTE_LNG_LAT, 6);
    const interval = setInterval(() => {
      if (stepRef.current >= path.length) {
        clearInterval(interval);
        return;
      }
      const [lng, lat] = path[stepRef.current];
      setStubPings((prev) => [...prev, { lat, lng }]);
      stepRef.current++;
    }, 400);
    return () => clearInterval(interval);
  }, [externalPings, batchId, convexPings]);

  // Resolve active pings — Convex (reversed to chronological) > external > stub
  let activePings: LatLng[];
  if (externalPings !== undefined) {
    activePings = externalPings;
  } else if (batchId && convexPings && convexPings.length > 0) {
    activePings = [...convexPings].reverse().map((p) => ({ lat: p.lat, lng: p.lng }));
  } else {
    activePings = stubPings;
  }

  // ── Initialize MapLibre ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let map: MaplibreMap;

    void (async () => {
      const maplibre = await import("maplibre-gl");

      map = new maplibre.Map({
        container: containerRef.current!,
        style: buildMapStyle(),
        bounds: [[-12, -12], [50, 57]],
        fitBoundsOptions: { padding: 40 },
        attributionControl: false,
      });

      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        // Full route — dashed emerald at 50% opacity
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: DENSE_ROUTE },
            properties: {},
          },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          paint: {
            "line-color": "#16a34a",
            "line-width": 2,
            "line-opacity": 0.5,
            "line-dasharray": [5, 4],
          },
        });

        // Handoff stage dots
        map.addSource("handoffs", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: handoffs.map((h) => ({
              type: "Feature" as const,
              geometry: {
                type: "Point" as const,
                coordinates: [h.location.lng, h.location.lat],
              },
              properties: { label: h.label },
            })),
          },
        });
        map.addLayer({
          id: "handoff-dots",
          type: "circle",
          source: "handoffs",
          paint: {
            "circle-radius": 5,
            "circle-color": "#15803d",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Fading trail of last 30 pings
        map.addSource("trail", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [] },
            properties: {},
          },
        });
        map.addLayer({
          id: "trail-line",
          type: "line",
          source: "trail",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#16a34a",
            "line-width": 2.5,
            "line-opacity": 0.9,
          },
        });

        // Current position — amber pulse ring + solid dot
        map.addSource("current", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "current-pulse",
          type: "circle",
          source: "current",
          paint: {
            "circle-radius": 14,
            "circle-color": "#f59e0b",
            "circle-opacity": 0.25,
          },
        });
        map.addLayer({
          id: "current-dot",
          type: "circle",
          source: "current",
          paint: {
            "circle-radius": 7,
            "circle-color": "#f59e0b",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        mapRef.current = map;
        setMapReady(true);
      });
    })();

    return () => {
      map?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync pings to map sources ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    const trail = activePings.slice(-30).map((p) => [p.lng, p.lat] as [number, number]);
    const current = activePings.length > 0 ? activePings[activePings.length - 1] : null;

    (map.getSource("trail") as GeoJSONSource | undefined)?.setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates: trail },
      properties: {},
    });

    (map.getSource("current") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: current
        ? [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [current.lng, current.lat] },
              properties: {},
            },
          ]
        : [],
    });
  }, [activePings, mapReady]);

  return (
    <div
      className={`relative rounded-xl border border-stone-200 overflow-hidden aspect-[4/3] md:aspect-[16/10] ${className}`}
      role="img"
      aria-label="Batch transit route map"
    >
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading skeleton shown until MapLibre fires 'load' */}
      {!mapReady && (
        <div className="absolute inset-0 bg-stone-950 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-stone-500 animate-spin" aria-hidden="true" />
        </div>
      )}

      {/* Status chip */}
      {mapReady && (
        <div className="absolute bottom-9 left-3 z-10 flex items-center gap-1.5 rounded-lg bg-stone-900/75 px-2.5 py-1.5 text-xs font-mono text-stone-300 backdrop-blur-sm">
          <Ship size={12} className="text-amber-500" aria-hidden="true" />
          {activePings.length > 0 ? "In transit" : "Route preview"}
        </div>
      )}
    </div>
  );
}
