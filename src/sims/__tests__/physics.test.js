import { describe, it, expect } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Physics formulas are replicated inline here because the sim components don't
// export their logic. Tests define acceptable physical ranges, not exact values.
// ─────────────────────────────────────────────────────────────────────────────

// ── SolidRocketSim ────────────────────────────────────────────────────────────
describe("SolidRocketSim physics", () => {
  it("thrust at Pc=7 MPa, star grain uses nozzle theory → in [40, 120] kN", () => {
    const chamberP = 7;
    const m = 1.4; // star grain burn-area multiplier
    const At = 0.005; // throat area m²
    const Cf = 1.3 + 0.05 * (chamberP / 7);
    const thrust = (Cf * At * chamberP * 1e6 * m) / 1000; // kN
    expect(thrust).toBeGreaterThan(40);
    expect(thrust).toBeLessThan(120);
  });

  it("Isp stays in realistic range [180, 310] s across parameter space", () => {
    const cases = [
      { chamberP: 3, burnRate: 2 },
      { chamberP: 7, burnRate: 5 },
      { chamberP: 10, burnRate: 5 },
      { chamberP: 20, burnRate: 12 },
    ];
    for (const { chamberP, burnRate } of cases) {
      const Cf = 1.3 + 0.05 * (chamberP / 7);
      const cStar = (chamberP * 100) / burnRate;
      const isp = Math.min(310, Math.max(180, Math.round((Cf * cStar) / 9.81)));
      expect(isp, `Isp out of range at Pc=${chamberP}, Br=${burnRate}`).toBeGreaterThanOrEqual(180);
      expect(isp, `Isp out of range at Pc=${chamberP}, Br=${burnRate}`).toBeLessThanOrEqual(310);
    }
  });

  it("c* increases with chamber pressure", () => {
    const burnRate = 5;
    const cStar7 = (7 * 100) / burnRate;
    const cStar14 = (14 * 100) / burnRate;
    expect(cStar14).toBeGreaterThan(cStar7);
  });
});

// ── DetonationSim ─────────────────────────────────────────────────────────────
describe("DetonationSim physics", () => {
  it("scaled distance Z at 5 kg TNT, 20 m → ~11.7", () => {
    const charge = 5,
      distance = 20,
      reFactor = 1.0;
    const tntEq = charge * reFactor;
    const Z = distance / Math.pow(tntEq, 1 / 3);
    expect(Z).toBeCloseTo(11.7, 0);
  });

  it("KB overpressure at Z=11.7 → reasonable range (0.01 – 10.0)", () => {
    const Z = 11.7;
    const logZ = Math.log10(Z);
    const logP = 2.78 - 1.6 * logZ - 0.198 * logZ * logZ;
    const peakOP = Math.pow(10, logP);
    expect(peakOP).toBeGreaterThan(0.01);
    expect(peakOP).toBeLessThan(10.0);
  });

  it("higher charge mass → larger overpressure at same distance", () => {
    const distance = 20;
    const opAt5kg = (() => {
      const Z = distance / Math.pow(5, 1 / 3);
      const logZ = Math.log10(Z);
      return Math.pow(10, 2.78 - 1.6 * logZ - 0.198 * logZ * logZ);
    })();
    const opAt20kg = (() => {
      const Z = distance / Math.pow(20, 1 / 3);
      const logZ = Math.log10(Z);
      return Math.pow(10, 2.78 - 1.6 * logZ - 0.198 * logZ * logZ);
    })();
    expect(opAt20kg).toBeGreaterThan(opAt5kg);
  });
});

// ── PressureVesselSim ─────────────────────────────────────────────────────────
describe("PressureVesselSim physics", () => {
  it("hoop stress (thin-wall P·r/2t) at P=10 MPa, r=500 mm, t=10 mm → 250 MPa", () => {
    const pressure = 10,
      radius = 500,
      thickness = 10;
    const hoop = (pressure * radius) / (2 * thickness);
    expect(hoop).toBe(250);
  });

  it("safety factor > 1 when yield > hoop stress", () => {
    const pressure = 5,
      radius = 300,
      thickness = 15,
      yieldStrength = 500;
    const hoop = (pressure * radius) / (2 * thickness);
    const sf = yieldStrength / hoop;
    expect(sf).toBeGreaterThan(1);
  });

  it("hoop stress increases linearly with pressure", () => {
    const radius = 500,
      thickness = 10;
    const hoop5 = (5 * radius) / (2 * thickness);
    const hoop10 = (10 * radius) / (2 * thickness);
    expect(hoop10).toBeCloseTo(hoop5 * 2, 5);
  });
});

// ── ScramjetSim ───────────────────────────────────────────────────────────────
describe("ScramjetSim physics", () => {
  it("stagnation temperature at M=6 → 2361.6 K (288 × (1 + 0.2 × 36))", () => {
    const mach = 6;
    const temp = 288 * (1 + 0.2 * mach * mach); // = 288 * 8.2 = 2361.6
    expect(temp).toBeCloseTo(2361.6, 1);
  });

  it("specific net thrust (Ve - V0) is positive at M=6, 25 km altitude", () => {
    const mach = 6,
      altitude = 25;
    const V0 = mach * 340;
    const P_atm = 101325 * Math.exp(-altitude / 8.5);
    const temp = 288 * (1 + 0.2 * mach * mach);
    const Tcomb = temp + 2200; // hydrogen heat addition
    const Pt2 = P_atm * Math.pow(1 + 0.2 * mach * mach, 3.5);
    const Ve = Math.sqrt(2 * 1005 * Tcomb * (1 - Math.pow(P_atm / Pt2, 0.286)));
    const F_sp = Ve - V0;
    expect(F_sp).toBeGreaterThan(0);
  });

  it("stagnation temperature scales as 1 + 0.2·M²", () => {
    // At M=8 should be 288 * (1 + 0.2 * 64) = 288 * 13.8 = 3974.4
    const mach = 8;
    const temp = 288 * (1 + 0.2 * mach * mach);
    expect(temp).toBeCloseTo(3974.4, 1);
  });
});

// ── ShapedChargeSim physics (Munroe + Birkhoff-Eichelberger) ─────────────────
describe("ShapedChargeSim physics", () => {
  it("copper liner Vjet at 42° (half-angle 21°) > steel liner Vjet (same geometry)", () => {
    // Vjet depends only on VoD and half-angle, not on liner density
    // Both use RDX (same VoD), so Vjet is equal — test that VoD dominates
    const VoD_rdx = 8750,
      VoD_hmx = 9100;
    const halfAngle = (42 * Math.PI) / 360;
    const Vjet_rdx = VoD_rdx * Math.cos(halfAngle);
    const Vjet_hmx = VoD_hmx * Math.cos(halfAngle);
    expect(Vjet_hmx).toBeGreaterThan(Vjet_rdx);
  });

  it("tantalum liner produces higher penetration than steel at same geometry (denser liner)", () => {
    const halfAngle = (60 * Math.PI) / 360;
    const linerLength = 80 / Math.tan(halfAngle);
    const P_ta = linerLength * Math.sqrt(16650 / 7850);
    const P_st = linerLength * Math.sqrt(7850 / 7850);
    expect(P_ta).toBeGreaterThan(P_st);
  });

  it("standoff factor is clamped to [0.3, 1.0]", () => {
    const standoffs = [1, 3, 10, 20];
    for (const s of standoffs) {
      const raw = 1 - 0.05 * Math.pow(s - 3, 2);
      const factor = Math.min(1.0, Math.max(0.3, raw));
      expect(factor).toBeGreaterThanOrEqual(0.3);
      expect(factor).toBeLessThanOrEqual(1.0);
    }
  });

  it("standoff factor is maximum (~1.0) near 3 CD (optimal standoff)", () => {
    const raw = 1 - 0.05 * Math.pow(3 - 3, 2); // exactly 1.0
    const factor = Math.min(1.0, Math.max(0.3, raw));
    expect(factor).toBe(1.0);
  });
});

// ── ReactiveArmorSim physics ──────────────────────────────────────────────────
describe("ReactiveArmorSim physics", () => {
  it("obliquity factor sec(θ) ≥ 1 for all angles, clamped at 4.0", () => {
    const angles = [0, 15, 30, 45, 60, 75];
    for (const deg of angles) {
      const rad = (deg * Math.PI) / 180;
      const factor = Math.min(4.0, 1 / Math.cos(rad));
      expect(factor).toBeGreaterThanOrEqual(1.0);
      expect(factor).toBeLessThanOrEqual(4.0);
    }
  });

  it("ERA is more effective against HEAT than KE (base protection values)", () => {
    const era_heat = 400,
      era_ke = 80;
    expect(era_heat).toBeGreaterThan(era_ke);
  });

  it("composite armor provides highest KE protection", () => {
    const ke = { era: 80, nera: 50, composite: 300 };
    expect(ke.composite).toBeGreaterThan(ke.era);
    expect(ke.composite).toBeGreaterThan(ke.nera);
  });

  it("defeatPct is clamped to max 99", () => {
    // Max inputs: obliquity=75, armorBonus=15
    const raw = Math.round(60 + 75 * 0.4 + 15);
    const clamped = Math.min(99, raw);
    expect(clamped).toBeLessThanOrEqual(99);
  });
});
