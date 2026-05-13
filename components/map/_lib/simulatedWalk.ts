export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Returns a 12-point closed-polygon path walking a ~150 m perimeter around
 * villageCenter. The shape varies per seed so adjacent farms look distinct.
 *
 * Algorithm: place 12 vertices at angles 0°, 30°, 60°, … 330° with a base
 * radius of ~60 m (≈ 0.00054°) plus a seeded perturbation of ±25 m so the
 * polygon is irregular. The 13th point repeats the 0th to close the ring.
 */
export function simulatedWalk(
  villageCenter: LatLng,
  seed: number,
): LatLng[] {
  const N = 12;
  // Degrees per metre at the equator; shrink lat slightly for equatorial bias.
  const DEG_PER_M_LAT = 1 / 111_320;
  const DEG_PER_M_LNG = 1 / (111_320 * Math.cos((villageCenter.lat * Math.PI) / 180));

  const BASE_RADIUS_M = 60; // ~150 m perimeter with 12 sides
  const PERTURB_M = 25;

  // Deterministic pseudo-random from seed
  function rand(i: number): number {
    const x = Math.sin(seed * 9301 + i * 49297 + 233) * 46_811.0;
    return x - Math.floor(x);
  }

  const points: LatLng[] = [];
  for (let i = 0; i < N; i++) {
    const angle = (2 * Math.PI * i) / N;
    const r = BASE_RADIUS_M + (rand(i) * 2 - 1) * PERTURB_M;
    const lat = villageCenter.lat + Math.cos(angle) * r * DEG_PER_M_LAT;
    const lng = villageCenter.lng + Math.sin(angle) * r * DEG_PER_M_LNG;
    points.push({ lat, lng });
  }

  // Close the ring
  points.push({ ...points[0] });
  return points;
}

/** Returns the subset of walk points up to index n (for animation ticks). */
export function walkFrame(path: LatLng[], n: number): LatLng[] {
  return path.slice(0, Math.min(n + 1, path.length));
}
