"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl";

// Inline type until @types/geojson is installed
type GeoJSONPolygon = { type: "Polygon"; coordinates: number[][][] };

export interface PolygonViewProps {
  farmCode: string;
  /** Presigned R2 URL. If provided, fetch GeoJSON from here. */
  polygonR2Url?: string;
  /** Inline GeoJSON — used during optimistic UI before R2 is ready. */
  polygonInline?: GeoJSONPolygon;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";

export default function PolygonView({ farmCode, polygonR2Url, polygonInline }: PolygonViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let destroyed = false;

    async function init() {
      let polygon: GeoJSONPolygon | null = polygonInline ?? null;

      // Fetch from R2 if no inline polygon
      if (!polygon && polygonR2Url) {
        try {
          const res = await fetch(polygonR2Url);
          if (!res.ok) throw new Error(`R2 fetch failed: ${res.status}`);
          polygon = await res.json() as GeoJSONPolygon;
        } catch (err) {
          if (!destroyed) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to load farm boundary");
            setLoadState("error");
          }
          return;
        }
      }

      if (!polygon || !containerRef.current || destroyed) return;

      const { Map, NavigationControl } = await import("maplibre-gl");

      // Compute center from polygon ring
      const ring = polygon.coordinates[0];
      const centerLng = ring.reduce((s: number, c: number[]) => s + c[0], 0) / ring.length;
      const centerLat = ring.reduce((s: number, c: number[]) => s + c[1], 0) / ring.length;

      const styleUrl = MAPTILER_KEY
        ? `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`
        : "https://demotiles.maplibre.org/style.json";

      const map = new Map({
        container: containerRef.current,
        style: styleUrl,
        center: [centerLng, centerLat],
        zoom: 16,
        interactive: false,
        attributionControl: {},
      });

      map.addControl(new NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (destroyed) return;

        map.addSource("polygon", {
          type: "geojson",
          data: { type: "Feature", geometry: polygon!, properties: { farmCode } },
        });

        map.addLayer({
          id: "polygon-fill",
          type: "fill",
          source: "polygon",
          paint: { "fill-color": "#10b981", "fill-opacity": 0.25 },
        });

        map.addLayer({
          id: "polygon-line",
          type: "line",
          source: "polygon",
          paint: { "line-color": "#059669", "line-width": 2 },
        });

        // Fit bounds to polygon
        const lngs = ring.map((c: number[]) => c[0]);
        const lats = ring.map((c: number[]) => c[1]);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 32, duration: 0 },
        );

        if (!destroyed) setLoadState("loaded");
      });

      mapRef.current = map;
    }

    init();

    return () => {
      destroyed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [polygonR2Url, polygonInline, farmCode]);

  return (
    <div className="relative rounded-xl border border-stone-200 overflow-hidden aspect-[4/3] md:aspect-[16/10]">
      <div ref={containerRef} className="absolute inset-0" />

      {loadState === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-100">
          <div className="h-8 w-8 rounded-lg bg-stone-200 animate-pulse" />
        </div>
      )}

      {loadState === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-50 p-4">
          <div className="text-center">
            <p className="text-sm font-medium text-red-800">Unable to load farm boundary</p>
            {errorMsg && (
              <details className="mt-1">
                <summary className="text-xs text-red-600 cursor-pointer">Details</summary>
                <p className="text-xs text-red-600 mt-1 font-mono">{errorMsg}</p>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Farm code chip */}
      <div className="absolute top-2 left-2 z-10 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-mono text-stone-700 shadow-sm">
        {farmCode}
      </div>
    </div>
  );
}
