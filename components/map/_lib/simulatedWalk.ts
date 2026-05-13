export interface LatLng {
  lat: number;
  lng: number;
}

// ~75m radius → ~150m perimeter
const BASE_RAD = 0.000675;
const JITTER = 0.000225; // ±25m

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967295;
  };
}

export function simulatedWalk(center: LatLng, seed: number): LatLng[] {
  const rand = lcg(seed);
  const N = 12;
  const pts: LatLng[] = [];
  for (let i = 0; i < N; i++) {
    const θ = (i / N) * 2 * Math.PI;
    const r = BASE_RAD + (rand() - 0.5) * 2 * JITTER;
    const δ = (rand() - 0.5) * 0.3;
    pts.push({
      lat: center.lat + r * Math.sin(θ + δ),
      lng: center.lng + r * Math.cos(θ + δ),
    });
  }
  pts.push({ ...pts[0] }); // close ring — 13 points total
  return pts;
}

export function walkFrame(path: LatLng[], n: number): LatLng[] {
  return path.slice(0, n);
}
