import { simulatedWalk, walkFrame } from "./simulatedWalk";

const CENTER = { lat: -3.2691, lng: 37.3311 }; // Kibosho, Kilimanjaro

describe("simulatedWalk", () => {
  it("returns 13 points (12 vertices + closing repeat)", () => {
    const path = simulatedWalk(CENTER, 1);
    expect(path).toHaveLength(13);
  });

  it("closes the ring — last point equals first", () => {
    const path = simulatedWalk(CENTER, 1);
    expect(path[12]).toEqual(path[0]);
  });

  it("all points are within ~300 m of the center", () => {
    const path = simulatedWalk(CENTER, 1);
    const DEG_PER_M_LAT = 1 / 111_320;
    for (const p of path) {
      const dLat = Math.abs(p.lat - CENTER.lat) / DEG_PER_M_LAT;
      const dLng =
        Math.abs(p.lng - CENTER.lng) /
        (1 / (111_320 * Math.cos((CENTER.lat * Math.PI) / 180)));
      const dist = Math.sqrt(dLat ** 2 + dLng ** 2);
      expect(dist).toBeLessThan(300);
    }
  });

  it("different seeds produce different paths", () => {
    const a = simulatedWalk(CENTER, 1);
    const b = simulatedWalk(CENTER, 2);
    expect(a[1]).not.toEqual(b[1]);
  });

  it("same seed always produces the same path (deterministic)", () => {
    expect(simulatedWalk(CENTER, 42)).toEqual(simulatedWalk(CENTER, 42));
  });
});

describe("walkFrame", () => {
  const path = simulatedWalk(CENTER, 1);

  it("returns n+1 points for tick n", () => {
    expect(walkFrame(path, 0)).toHaveLength(1);
    expect(walkFrame(path, 5)).toHaveLength(6);
  });

  it("never exceeds path length", () => {
    expect(walkFrame(path, 999)).toHaveLength(path.length);
  });
});
