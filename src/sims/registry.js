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
import WaterRamjetSim from "./WaterRamjetSim";
import FragmentationSim from "./FragmentationSim";
import LiquidBiPropellantSim from "./LiquidBiPropellantSim";
import ETCGunSim from "./ETCGunSim";
import HallThrusterSim from "./HallThrusterSim";
import EFPSim from "./EFPSim";
import KineticPenetratorSim from "./KineticPenetratorSim";
import HypersonicTPSSim from "./HypersonicTPSSim";
import PyrotechnicDelaySim from "./PyrotechnicDelaySim";
import IMBulletImpactSim from "./IMBulletImpactSim";
import BlastMitigationSim from "./BlastMitigationSim";
import SympatheticDetonationSim from "./SympatheticDetonationSim";

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
    related: ["hybrid", "waterjet", "instability", "diagnostics", "chemistry"],
  },
  {
    id: "scramjet",
    icon: "☄️",
    label: "Scramjet/Ramjet",
    cat: "propulsion",
    color: T.cyan,
    comp: ScramjetSim,
    tags: ["hypersonic", "scramjet", "ramjet", "irrt", "air-breathing", "propulsion", "mach"],
    related: ["thermobaric", "hybrid", "rocket", "waterjet"],
  },
  {
    id: "hybrid",
    icon: "🔥",
    label: "Hybrid Rocket",
    cat: "propulsion",
    color: T.lime,
    comp: HybridRocketSim,
    tags: ["hybrid", "propulsion", "combustion"],
    related: ["rocket", "scramjet", "waterjet", "diagnostics"],
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
  {
    id: "waterjet",
    icon: "🌊",
    label: "Water Ramjet",
    cat: "propulsion",
    color: T.cyan,
    comp: WaterRamjetSim,
    tags: ["water ramjet", "underwater", "torpedo", "hydro-reactive", "Mg fuel", "Shkval", "supercavitation"],
    related: ["hybrid", "scramjet", "rocket"],
  },
  {
    id: "fragmentation",
    icon: "💥",
    label: "Frag Warhead",
    cat: "detonics",
    color: T.red,
    comp: FragmentationSim,
    tags: ["fragmentation", "Gurney equation", "warhead", "terminal ballistics", "shrapnel", "TBRL"],
    related: ["detonation", "shaped", "armor"],
  },
  {
    id: "liquidbiprop",
    icon: "🚀",
    label: "Liquid BiProp",
    cat: "propulsion",
    color: T.cyan,
    comp: LiquidBiPropellantSim,
    tags: ["liquid propulsion", "bipropellant", "cryo", "Vikas", "SCE-200"],
    related: ["rocket", "hybrid", "hallthruster"],
  },
  {
    id: "etcgun",
    icon: "⚡",
    label: "ETC Gun",
    cat: "propulsion",
    color: T.purple,
    comp: ETCGunSim,
    tags: ["ETC", "electrothermal", "plasma", "artillery"],
    related: ["gun", "rocket"],
  },
  {
    id: "hallthruster",
    icon: "🛰️",
    label: "Hall Thruster",
    cat: "propulsion",
    color: T.cyan,
    comp: HallThrusterSim,
    tags: ["ion", "electric propulsion", "ExB drift", "xenon"],
    related: ["liquidbiprop", "rocket"],
  },
  {
    id: "efp",
    icon: "🎯",
    label: "EFP Warhead",
    cat: "detonics",
    color: T.orange,
    comp: EFPSim,
    tags: ["EFP", "Misznay-Schardin", "top attack", "slug"],
    related: ["shaped", "fragmentation", "armor"],
  },
  {
    id: "kineticpnt",
    icon: "🏹",
    label: "Kinetic Pen.",
    cat: "detonics",
    color: T.cyan,
    comp: KineticPenetratorSim,
    tags: ["APFSDS", "DU", "tungsten", "terminal ballistics"],
    related: ["armor", "efp"],
  },
  {
    id: "tps",
    icon: "☄️",
    label: "Hypersonic TPS",
    cat: "materials",
    color: T.red,
    comp: HypersonicTPSSim,
    tags: ["HGV", "hypersonic", "ablation", "carbon-carbon"],
    related: ["scramjet", "am"],
  },
  {
    id: "delay",
    icon: "⏱️",
    label: "Pyrotech Delay",
    cat: "materials",
    color: T.gold,
    comp: PyrotechnicDelaySim,
    tags: ["delay", "fuze", "gasless", "chromate"],
    related: ["chemistry", "cookoff"],
  },
  {
    id: "imbullet",
    icon: "🛡️",
    label: "IM Bullet Test",
    cat: "safety",
    color: T.red,
    comp: IMBulletImpactSim,
    tags: ["IM", "insensitive", "bullet impact", "STANAG"],
    related: ["cookoff", "vessel", "cocrystal"],
  },
  {
    id: "blastmitig",
    icon: "🧱",
    label: "Blast Mitig.",
    cat: "safety",
    color: T.green,
    comp: BlastMitigationSim,
    tags: ["QD", "quantity distance", "igloo", "hopkinson"],
    related: ["detonation", "am"],
  },
  {
    id: "sympdet",
    icon: "💥",
    label: "Gap Test",
    cat: "safety",
    color: T.purple,
    comp: SympatheticDetonationSim,
    tags: ["gap test", "sympathetic", "shock", "barrier"],
    related: ["imbullet", "detonation", "cookoff"],
  },
];
