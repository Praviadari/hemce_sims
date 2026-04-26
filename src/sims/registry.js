// ═══════════════════════════════════════
// SIMULATION REGISTRY — Lazy-loaded for code splitting
// To add a new sim: create component in sims/, lazy-import below, add entry. Done.
// ═══════════════════════════════════════

import { lazy } from "react";
import { T } from "../utils";

const SolidRocketSim = lazy(() => import("./SolidRocketSim"));
const PressureVesselSim = lazy(() => import("./PressureVesselSim"));
const PAUTSim = lazy(() => import("./PAUTSim"));
const ScramjetSim = lazy(() => import("./ScramjetSim"));
const DetonationSim = lazy(() => import("./DetonationSim"));
const PropellantChemistrySim = lazy(() => import("./PropellantChemistrySim"));
const GunPropellantSim = lazy(() => import("./GunPropellantSim"));
const HybridRocketSim = lazy(() => import("./HybridRocketSim"));
const ExplosiveDetectionSim = lazy(() => import("./ExplosiveDetectionSim"));
const AdditiveManufacturingSim = lazy(() => import("./AdditiveManufacturingSim"));
const GreenPropellantSim = lazy(() => import("./GreenPropellantSim"));
const CookOffTestSim = lazy(() => import("./CookOffTestSim"));
const ShapedChargeSim = lazy(() => import("./ShapedChargeSim"));
const ReactiveArmorSim = lazy(() => import("./ReactiveArmorSim"));

export const SIM_REGISTRY = [
  {
    id: "rocket",
    icon: "🚀",
    label: "Solid Rocket",
    cat: "propulsion",
    color: T.orange,
    comp: SolidRocketSim,
    tags: ["solid propulsion", "combustion", "propellants"],
  },
  {
    id: "vessel",
    icon: "⚙",
    label: "Pressure Vessel",
    cat: "safety",
    color: T.accent,
    comp: PressureVesselSim,
    tags: ["quality control", "safety", "standards"],
  },
  {
    id: "paut",
    icon: "🔍",
    label: "PAUT / NDT",
    cat: "testing",
    color: T.green,
    comp: PAUTSim,
    tags: ["NDT", "evaluation", "quality"],
  },
  {
    id: "scramjet",
    icon: "✈",
    label: "Scramjet",
    cat: "propulsion",
    color: T.cyan,
    comp: ScramjetSim,
    tags: ["ramjet", "scramjet", "hypersonic"],
  },
  {
    id: "detonation",
    icon: "💥",
    label: "Detonation",
    cat: "detonics",
    color: T.red,
    comp: DetonationSim,
    tags: ["detonics", "shock loading", "blast effects"],
  },
  {
    id: "chemistry",
    icon: "🧪",
    label: "Propellant Chem",
    cat: "materials",
    color: T.purple,
    comp: PropellantChemistrySim,
    tags: ["synthesis", "green", "nano energetics"],
  },
  {
    id: "gun",
    icon: "⚡",
    label: "Gun Propellant",
    cat: "propulsion",
    color: T.gold,
    comp: GunPropellantSim,
    tags: ["gun propellants", "interior ballistics"],
  },
  {
    id: "hybrid",
    icon: "🔥",
    label: "Hybrid Rocket",
    cat: "propulsion",
    color: T.lime,
    comp: HybridRocketSim,
    tags: ["hybrid combustion", "liquid propulsion"],
  },
  {
    id: "detection",
    icon: "🔬",
    label: "HE Detection",
    cat: "safety",
    color: T.pink,
    comp: ExplosiveDetectionSim,
    tags: ["explosive detection", "field testing"],
  },
  {
    id: "am",
    icon: "🖨",
    label: "Additive Mfg",
    cat: "manufacturing",
    color: T.lime,
    comp: AdditiveManufacturingSim,
    tags: ["additive manufacturing", "3D printing"],
  },
  {
    id: "greenprop",
    icon: "🍃",
    label: "Green Propellant",
    cat: "materials",
    color: "#2ecc71",
    comp: GreenPropellantSim,
    tags: ["green energetics", "nano energetics"],
  },
  {
    id: "im",
    icon: "🛡",
    label: "Cook-Off Test",
    cat: "safety",
    color: "#3b82f6",
    comp: CookOffTestSim,
    tags: ["insensitive munitions", "safety"],
  },
  {
    id: "shaped",
    icon: "🎯",
    label: "Shaped Charge",
    cat: "detonics",
    color: T.red,
    comp: ShapedChargeSim,
    tags: ["shaped charge", "EFP", "warhead", "Munroe effect"],
  },
  {
    id: "armor",
    icon: "🛡",
    label: "Reactive Armor",
    cat: "safety",
    color: T.accent,
    comp: ReactiveArmorSim,
    tags: ["armor", "ERA", "ballistic protection", "Kanchan"],
  },
];

export const CATEGORIES = [
  { id: "all", label: "All", color: T.white },
  { id: "propulsion", label: "Propulsion", color: T.orange },
  { id: "materials", label: "Materials", color: T.purple },
  { id: "detonics", label: "Detonics", color: T.red },
  { id: "testing", label: "NDT/QC", color: T.green },
  { id: "safety", label: "Safety", color: T.pink },
  { id: "manufacturing", label: "Mfg", color: T.lime },
];
