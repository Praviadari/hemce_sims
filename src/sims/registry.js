// ═══════════════════════════════════════
// SIMULATION REGISTRY — Synchronous imports for kiosk performance
// ═══════════════════════════════════════

import { T } from "../utils";

import SolidRocketSim from "./SolidRocketSim";
import ScramjetSim from "./ScramjetSim";
import DetonationSim from "./DetonationSim";
import GunPropellantSim from "./GunPropellantSim";
import HybridRocketSim from "./HybridRocketSim";
import PropellantChemistrySim from "./PropellantChemistrySim";
import PressureVesselSim from "./PressureVesselSim";
import PAUTSim from "./PAUTSim";
import ExplosiveDetectionSim from "./ExplosiveDetectionSim";
import AdditiveManufacturingSim from "./AdditiveManufacturingSim";
import ShapedChargeSim from "./ShapedChargeSim";
import ReactiveArmorSim from "./ReactiveArmorSim";
import CombustionDiagnosticsSim from "./CombustionDiagnosticsSim";
import CocrystalSim from "./CocrystalSim";
import ThermobaricSim from "./ThermobaricSim";
import CombustionInstabilitySim from "./CombustionInstabilitySim";
import CookOffTestSim from "./CookOffTestSim";
import GreenPropellantSim from "./GreenPropellantSim";

export const CATEGORIES = [
  { id: "all", label: "All", color: T.accent },
  { id: "propulsion", label: "Propulsion", color: T.orange },
  { id: "detonics", label: "Detonics", color: T.red },
  { id: "materials", label: "Materials", color: T.purple },
  { id: "safety", label: "Safety", color: T.green },
  { id: "testing", label: "Testing", color: T.cyan },
];

export const SIM_REGISTRY = [
  {
    id: "rocket",
    icon: "🚀",
    label: "Solid Rocket",
    cat: "propulsion",
    color: T.orange,
    comp: SolidRocketSim,
    tags: ["solid propulsion", "combustion", "propellants"],
    related: ["hybrid", "instability", "diagnostics", "chemistry"],
  },
  {
    id: "scramjet",
    icon: "☄️",
    label: "Scramjet/Ramjet",
    cat: "propulsion",
    color: T.cyan,
    comp: ScramjetSim,
    tags: ["hypersonic", "scramjet", "ramjet", "irrt", "air-breathing", "propulsion", "mach"],
    related: ["thermobaric", "hybrid", "rocket"],
  },
  {
    id: "hybrid",
    icon: "🔥",
    label: "Hybrid Rocket",
    cat: "propulsion",
    color: T.lime,
    comp: HybridRocketSim,
    tags: ["hybrid", "propulsion", "combustion"],
    related: ["rocket", "scramjet", "diagnostics"],
  },
  {
    id: "cookoff",
    icon: "🌡️",
    label: "Cook-Off Test",
    cat: "safety",
    color: T.red,
    comp: CookOffTestSim,
    tags: ["cook-off", "thermal", "safety", "ignition"],
    related: ["vessel", "gun", "chemistry"],
  },
  {
    id: "greenprop",
    icon: "🌿",
    label: "Green Propellant",
    cat: "materials",
    color: T.green,
    comp: GreenPropellantSim,
    tags: ["green", "ADN", "HAN", "environment", "sustainable"],
    related: ["chemistry", "hybrid", "rocket"],
  },
  {
    id: "instability",
    icon: "〰️",
    label: "Combustion Instab.",
    cat: "propulsion",
    color: T.orange,
    comp: CombustionInstabilitySim,
    tags: ["instability", "acoustic", "combustion", "stability", "baffles"],
    related: ["rocket", "hybrid", "diagnostics"],
  },
  {
    id: "detonation",
    icon: "💥",
    label: "Detonation",
    cat: "detonics",
    color: T.red,
    comp: DetonationSim,
    tags: ["detonics", "shock loading", "blast effects"],
    related: ["thermobaric", "shaped", "armor"],
  },
  {
    id: "shaped",
    icon: "🎯",
    label: "Shaped Charge",
    cat: "detonics",
    color: T.red,
    comp: ShapedChargeSim,
    tags: ["shaped charge", "EFP", "warhead", "Munroe effect"],
    related: ["detonation", "armor", "thermobaric"],
  },
  {
    id: "thermobaric",
    icon: "🔥",
    label: "Thermobaric",
    cat: "detonics",
    color: T.red,
    comp: ThermobaricSim,
    tags: ["thermobaric", "FAE", "fuel-air", "TBX", "Klapotke"],
    related: ["detonation", "shaped", "scramjet"],
  },
  {
    id: "chemistry",
    icon: "🧪",
    label: "Propellant Chem",
    cat: "materials",
    color: T.purple,
    comp: PropellantChemistrySim,
    tags: ["synthesis", "green", "nano energetics"],
    related: ["cocrystal", "rocket", "gun"],
  },
  {
    id: "cocrystal",
    icon: "💎",
    label: "HEM Cocrystals",
    cat: "materials",
    color: T.purple,
    comp: CocrystalSim,
    tags: ["cocrystal", "CL-20", "insensitive munitions", "disruptive"],
    related: ["chemistry", "detonation"],
  },
  {
    id: "am",
    icon: "🖨",
    label: "Additive Mfg",
    cat: "materials",
    color: T.lime,
    comp: AdditiveManufacturingSim,
    tags: ["additive manufacturing", "3D printing"],
    related: ["vessel", "paut", "rocket"],
  },
  {
    id: "vessel",
    icon: "⚙",
    label: "Pressure Vessel",
    cat: "safety",
    color: T.accent,
    comp: PressureVesselSim,
    tags: ["quality control", "safety", "standards"],
    related: ["paut", "am", "gun"],
  },
  {
    id: "armor",
    icon: "🛡",
    label: "Reactive Armor",
    cat: "safety",
    color: T.accent,
    comp: ReactiveArmorSim,
    tags: ["armor", "ERA", "ballistic protection", "Kanchan"],
    related: ["shaped", "detonation", "vessel"],
  },
  {
    id: "gun",
    icon: "⚡",
    label: "Gun Propellant",
    cat: "safety",
    color: T.gold,
    comp: GunPropellantSim,
    tags: ["gun propellants", "interior ballistics"],
    related: ["detonation", "chemistry", "vessel"],
  },
  {
    id: "paut",
    icon: "🔍",
    label: "PAUT / NDT",
    cat: "testing",
    color: T.green,
    comp: PAUTSim,
    tags: ["NDT", "evaluation", "quality"],
    related: ["vessel", "am", "diagnostics"],
  },
  {
    id: "detection",
    icon: "🔬",
    label: "HE Detection",
    cat: "testing",
    color: T.pink,
    comp: ExplosiveDetectionSim,
    tags: ["explosive detection", "field testing"],
    related: ["detonation", "chemistry"],
  },
  {
    id: "diagnostics",
    icon: "📡",
    label: "Combustion Diag.",
    cat: "testing",
    color: T.cyan,
    comp: CombustionDiagnosticsSim,
    tags: ["diagnostics", "pyrometry", "spectroscopy", "combustion"],
    related: ["rocket", "hybrid", "instability"],
  },
];
