import { T } from "../utils/theme";

// Lazy-load sim components for code splitting
import { lazy } from "react";

const SolidRocketSim = lazy(() => import("../simulations/SolidRocketSim"));
const PressureVesselSim = lazy(() => import("../simulations/PressureVesselSim"));
const PAUTSim = lazy(() => import("../simulations/PAUTSim"));
const ScramjetSim = lazy(() => import("../simulations/ScramjetSim"));
const DetonationSim = lazy(() => import("../simulations/DetonationSim"));
const PropellantChemistrySim = lazy(() => import("../simulations/PropellantChemistrySim"));
const GunPropellantSim = lazy(() => import("../simulations/GunPropellantSim"));
const HybridRocketSim = lazy(() => import("../simulations/HybridRocketSim"));
const ExplosiveDetectionSim = lazy(() => import("../simulations/ExplosiveDetectionSim"));
const AdditiveManufacturingSim = lazy(() => import("../simulations/AdditiveManufacturingSim"));

/**
 * SIMULATION REGISTRY
 * ────────────────────
 * To add a new simulation:
 *   1. Create component in /simulations/YourSim.jsx (default export)
 *   2. Lazy-import it above
 *   3. Add entry below with unique id, category, tags
 *   4. Done — no routing or wiring changes needed
 */
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
    tags: ["ramjet", "scramjet", "advanced propulsion", "hypersonic"],
  },
  {
    id: "detonation",
    icon: "💥",
    label: "Detonation",
    cat: "detonics",
    color: T.red,
    comp: DetonationSim,
    tags: ["detonics", "shock loading", "blast effects", "mitigation"],
  },
  {
    id: "chemistry",
    icon: "🧪",
    label: "Propellant Chem",
    cat: "materials",
    color: T.purple,
    comp: PropellantChemistrySim,
    tags: ["synthesis", "characterization", "green", "nano energetics"],
  },
  {
    id: "gun",
    icon: "⚡",
    label: "Gun Propellant",
    cat: "propulsion",
    color: T.gold,
    comp: GunPropellantSim,
    tags: ["gun propellants", "interior ballistics", "explosive devices"],
  },
  {
    id: "hybrid",
    icon: "🔥",
    label: "Hybrid Rocket",
    cat: "propulsion",
    color: T.lime,
    comp: HybridRocketSim,
    tags: ["hybrid combustion", "liquid", "solid", "propulsion"],
  },
  {
    id: "detection",
    icon: "🔬",
    label: "HE Detection",
    cat: "safety",
    color: T.pink,
    comp: ExplosiveDetectionSim,
    tags: ["explosive detection", "safety", "field testing"],
  },
  {
    id: "am",
    icon: "🖨",
    label: "Additive Mfg",
    cat: "manufacturing",
    color: T.lime,
    comp: AdditiveManufacturingSim,
    tags: ["additive manufacturing", "processing", "3D printing", "scale-up"],
  },
];

/**
 * CATEGORY FILTERS
 */
export const CATEGORIES = [
  { id: "all", label: "All", color: T.white },
  { id: "propulsion", label: "Propulsion", color: T.orange },
  { id: "materials", label: "Materials", color: T.purple },
  { id: "detonics", label: "Detonics", color: T.red },
  { id: "testing", label: "NDT/QC", color: T.green },
  { id: "safety", label: "Safety", color: T.pink },
  { id: "manufacturing", label: "Mfg", color: T.lime },
];
