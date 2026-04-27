import { describe, it, expect } from "vitest";
import { SIM_REGISTRY, CATEGORIES } from "../registry";
import { MISSILE_DB } from "../../data/missileDB";
import { HEMCE_SCHEDULE } from "../../data/hemceSchedule";

describe("Registry completeness", () => {
  it("has exactly 30 sims (including the new massive 10 array expansion)", () => {
    expect(SIM_REGISTRY.length).toBe(30);
  });

  it("all IDs are unique", () => {
    const ids = SIM_REGISTRY.map(s => s.id);
    expect(new Set(ids).size).toBe(30);
  });

  it("all sims have comp function", () => {
    SIM_REGISTRY.forEach(s => {
      expect(typeof s.comp).toBe("function");
    });
  });

  it("all sims have related array", () => {
    SIM_REGISTRY.forEach(s => {
      expect(Array.isArray(s.related)).toBe(true);
      expect(s.related.length).toBeGreaterThan(0);
    });
  });

  it("all related IDs exist in registry", () => {
    const allIds = new Set(SIM_REGISTRY.map(s => s.id));
    SIM_REGISTRY.forEach(s => {
      s.related.forEach(r => {
        expect(allIds.has(r)).toBe(true);
      });
    });
  });

  it("all categories are valid", () => {
    const validCats = CATEGORIES.map(c => c.id);
    SIM_REGISTRY.forEach(s => {
      expect(validCats).toContain(s.cat);
    });
  });

  it("all categories have required fields", () => {
    CATEGORIES.forEach(c => {
      expect(typeof c.id).toBe("string");
      expect(typeof c.label).toBe("string");
      expect(typeof c.color).toBe("string");
    });
  });

  it("all sims have required fields (icon, label, color, tags)", () => {
    SIM_REGISTRY.forEach(s => {
      expect(typeof s.icon).toBe("string");
      expect(typeof s.label).toBe("string");
      expect(typeof s.color).toBe("string");
      expect(Array.isArray(s.tags)).toBe(true);
    });
  });
});

describe("Data modules", () => {
  it("missile DB has 17+ entries with sources", () => {
    expect(MISSILE_DB.length).toBeGreaterThanOrEqual(17);
    MISSILE_DB.forEach(m => {
      expect(m.sources.length).toBeGreaterThan(0);
      m.sources.forEach(s => {
        expect(s.url).toMatch(/^https?:\/\//);
      });
    });
  });

  it("missile DB entries have correct schema", () => {
    MISSILE_DB.forEach(m => {
      expect(typeof m.id).toBe("string");
      expect(typeof m.name).toBe("string");
      expect(typeof m.type).toBe("string");
      expect(typeof m.propulsion).toBe("object");
      expect(typeof m.propulsion.stages).toBe("string");
    });
  });

  it("schedule has 3 days", () => {
    expect(HEMCE_SCHEDULE.length).toBe(3);
    HEMCE_SCHEDULE.forEach(d => {
      expect(d.events.length).toBeGreaterThan(5);
    });
  });

  it("schedule events have correct schema", () => {
    HEMCE_SCHEDULE.forEach(d => {
      expect(typeof d.day).toBe("number");
      expect(typeof d.date).toBe("string");
      d.events.forEach(e => {
        expect(typeof e.time).toBe("string");
        expect(typeof e.title).toBe("string");
      });
    });
  });
});
