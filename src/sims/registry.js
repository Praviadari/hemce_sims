// ═══════════════════════════════════════
// SIMULATION REGISTRY
// To add a new sim: import component, add entry below. Done.
// ═══════════════════════════════════════

import { T } from "../utils";
import SolidRocketSim from "./SolidRocketSim";
import PressureVesselSim from "./PressureVesselSim";
import PAUTSim from "./PAUTSim";
import ScramjetSim from "./ScramjetSim";
import DetonationSim from "./DetonationSim";
import PropellantChemistrySim from "./PropellantChemistrySim";
import GunPropellantSim from "./GunPropellantSim";
import HybridRocketSim from "./HybridRocketSim";
import ExplosiveDetectionSim from "./ExplosiveDetectionSim";
import AdditiveManufacturingSim from "./AdditiveManufacturingSim";

export const SIM_REGISTRY = [
  { id: "rocket",     icon: "🚀", label: "Solid Rocket",    cat: "propulsion",     color: T.orange,  comp: SolidRocketSim,          tags: ["solid propulsion", "combustion", "propellants"] },
  { id: "vessel",     icon: "⚙",  label: "Pressure Vessel", cat: "safety",         color: T.accent,  comp: PressureVesselSim,       tags: ["quality control", "safety", "standards"] },
  { id: "paut",       icon: "🔍", label: "PAUT / NDT",      cat: "testing",        color: T.green,   comp: PAUTSim,                 tags: ["NDT", "evaluation", "quality"] },
  { id: "scramjet",   icon: "✈",  label: "Scramjet",        cat: "propulsion",     color: T.cyan,    comp: ScramjetSim,             tags: ["ramjet", "scramjet", "hypersonic"] },
  { id: "detonation", icon: "💥", label: "Detonation",      cat: "detonics",       color: T.red,     comp: DetonationSim,           tags: ["detonics", "shock loading", "blast effects"] },
  { id: "chemistry",  icon: "🧪", label: "Propellant Chem", cat: "materials",      color: T.purple,  comp: PropellantChemistrySim,  tags: ["synthesis", "green", "nano energetics"] },
  { id: "gun",        icon: "⚡", label: "Gun Propellant",  cat: "propulsion",     color: T.gold,    comp: GunPropellantSim,        tags: ["gun propellants", "interior ballistics"] },
  { id: "hybrid",     icon: "🔥", label: "Hybrid Rocket",   cat: "propulsion",     color: T.lime,    comp: HybridRocketSim,         tags: ["hybrid combustion", "liquid propulsion"] },
  { id: "detection",  icon: "🔬", label: "HE Detection",    cat: "safety",         color: T.pink,    comp: ExplosiveDetectionSim,   tags: ["explosive detection", "field testing"] },
  { id: "am",         icon: "🖨", label: "Additive Mfg",    cat: "manufacturing",  color: T.lime,    comp: AdditiveManufacturingSim, tags: ["additive manufacturing", "3D printing"] },
];

export const CATEGORIES = [
  { id: "all",           label: "All",        color: T.white },
  { id: "propulsion",    label: "Propulsion",  color: T.orange },
  { id: "materials",     label: "Materials",   color: T.purple },
  { id: "detonics",      label: "Detonics",    color: T.red },
  { id: "testing",       label: "NDT/QC",      color: T.green },
  { id: "safety",        label: "Safety",      color: T.pink },
  { id: "manufacturing", label: "Mfg",         color: T.lime },
];
