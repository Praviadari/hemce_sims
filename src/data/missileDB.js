// ═══════════════════════════════════════════════════════════════════
// MISSILE DATABASE — Indian Missile Systems
// Structured reference data for HEMCE 2026 Simulation Hub
// All data sourced from PIB, DRDO press releases, and Wikipedia.
// ═══════════════════════════════════════════════════════════════════

export const MISSILE_DB = [
  // ─────────────────────────── AGNI SERIES ───────────────────────────
  {
    id: "agni1",
    name: "Agni-I",
    type: "MRBM",
    developer: "DRDO (ASL Hyderabad)",
    status: "Inducted 2004",
    image_emoji: "🚀",
    propulsion: {
      stages: "1-Stage Solid",
      propellant: "HTPB/AP composite",
      thrust: "~48,000 kgf",
      isp: "~270 s",
      motorNotes: "SLV-3 derived 1m-diameter booster motor",
    },
    performance: {
      range: "700–900 km",
      speed: "Mach 5+",
      payload: "1,000 kg (nuclear / conventional)",
      accuracy: "CEP ~25 m (GPS-aided)",
      guidance: "Inertial + Terminal GPS",
    },
    milestones: [
      { year: 1989, event: "Agni-TD (Technology Demonstrator) first test" },
      { year: 2002, event: "Agni-I first test as MRBM" },
      { year: 2004, event: "Inducted into service (Strategic Forces Command)" },
    ],
    specialFeatures: [
      "Derived from SLV-3 space launch vehicle solid motor",
      "Road-mobile, rail-mobile launch capability",
      "Canisterised for rapid deployment",
      "Basis for India's solid-motor MRBM capability",
    ],
    relatedSimId: "rocket",
    category: "ballistic",
    sources: [
      { label: "Wikipedia: Agni-I", url: "https://en.wikipedia.org/wiki/Agni-I" },
    ],
  },

  {
    id: "agni2",
    name: "Agni-II",
    type: "IRBM",
    developer: "DRDO (ASL Hyderabad)",
    status: "Inducted 2003",
    image_emoji: "🚀",
    propulsion: {
      stages: "2-Stage Solid",
      propellant: "HTPB composite",
      thrust: "~50,000 kgf (Stage 1)",
      isp: "~270 s",
      motorNotes: "Lighter composite casing vs Agni-I; improved mass fraction",
    },
    performance: {
      range: "2,000–3,000 km",
      speed: "Mach 12 (re-entry)",
      payload: "1,000 kg",
      accuracy: "CEP ~40 m",
      guidance: "Ring Laser Gyro INS",
    },
    milestones: [
      { year: 1999, event: "First full-range test" },
      { year: 2003, event: "Inducted into Strategic Forces Command" },
      { year: 2011, event: "Canisterised version tested" },
    ],
    specialFeatures: [
      "First Indian 2-stage IRBM",
      "Composite motor casing reduces structural mass",
      "Covers entire Pakistan + northwest China",
      "Canisterised rail-mobile variant developed",
    ],
    relatedSimId: "rocket",
    category: "ballistic",
    sources: [
      { label: "Wikipedia: Agni-II", url: "https://en.wikipedia.org/wiki/Agni-II" },
    ],
  },

  {
    id: "agni3",
    name: "Agni-III",
    type: "IRBM",
    developer: "DRDO (ASL Hyderabad)",
    status: "Inducted ~2011",
    image_emoji: "🚀",
    propulsion: {
      stages: "2-Stage Solid",
      propellant: "HTPB/AP + Aluminium composite",
      thrust: "~60,000 kgf (Stage 1)",
      isp: "~275 s",
      motorNotes: "Larger 2m-diameter motor; electro-mechanical thrust vector control",
    },
    performance: {
      range: "3,000–5,000 km",
      speed: "Mach 15+ (re-entry)",
      payload: "1,500 kg",
      accuracy: "CEP <40 m",
      guidance: "Redundant RLG INS + stellar navigation",
    },
    milestones: [
      { year: 2006, event: "First test (partial success)" },
      { year: 2007, event: "Second test — mass simulation payload, full range" },
      { year: 2011, event: "Inducted into SFC inventory" },
    ],
    specialFeatures: [
      "First Indian missile to use 2m-diameter motor",
      "Covers all major Chinese cities",
      "Advanced thermal-protection system for MARV re-entry",
      "Stellar navigation for long-range accuracy",
    ],
    relatedSimId: "rocket",
    category: "ballistic",
    sources: [
      { label: "Wikipedia: Agni-III", url: "https://en.wikipedia.org/wiki/Agni-III" },
    ],
  },

  {
    id: "agni4",
    name: "Agni-IV",
    type: "IRBM",
    developer: "DRDO (ASL Hyderabad)",
    status: "Inducted 2014",
    image_emoji: "🚀",
    propulsion: {
      stages: "2-Stage Solid",
      propellant: "Composite HTPB / AP",
      thrust: "~55,000 kgf (Stage 1)",
      isp: "~275 s",
      motorNotes: "Ring Laser Gyro INS; composite motor casing lighter than Agni-III",
    },
    performance: {
      range: "3,500–4,000 km",
      speed: "Mach 12 (re-entry)",
      payload: "800 kg",
      accuracy: "CEP < 50 m",
      guidance: "Ring Laser Gyro INS + GPS terminal",
    },
    milestones: [
      { year: 2011, event: "First developmental test" },
      { year: 2014, event: "Final user trials, inducted" },
      { year: 2018, event: "Night test from Odisha coast" },
    ],
    specialFeatures: [
      "Bridge between Agni-III and Agni-V",
      "Composite motor casing — lighter than steel",
      "Advanced re-entry vehicle with TPS",
      "Can be canisterised, road-mobile TEL",
    ],
    relatedSimId: "rocket",
    category: "ballistic",
    sources: [
      { label: "Wikipedia: Agni-IV", url: "https://en.wikipedia.org/wiki/Agni-IV" },
    ],
  },

  {
    id: "agni5",
    name: "Agni-V",
    type: "ICBM-class IRBM",
    developer: "DRDO (ASL Hyderabad)",
    status: "Inducted 2020, MIRV 2024",
    image_emoji: "🚀",
    propulsion: {
      stages: "3-Stage All-Solid",
      propellant: "Advanced HTPB/AP/Al composite",
      thrust: "~60,000+ kgf (Stage 1)",
      isp: "~280 s",
      motorNotes: "Composite casing, electro-mechanical actuators Stage 2/3",
    },
    performance: {
      range: "5,400–8,000 km",
      speed: "Mach 24 (re-entry)",
      payload: "1,500 kg (nuclear)",
      accuracy: "CEP < 100 m",
      guidance: "Ring Laser Gyro INS + GPS",
    },
    milestones: [
      { year: 2012, event: "First test flight" },
      { year: 2018, event: "5th successful test, full range verified" },
      { year: 2020, event: "Inducted into Strategic Forces Command" },
      { year: 2024, event: "Mission Divyastra — MIRV maiden flight (4–6 RVs)" },
    ],
    specialFeatures: [
      "MIRV: Multiple Independently Targetable Re-entry Vehicles",
      "Road-mobile TEL, canisterised launch",
      "India became 6th nation with MIRV capability",
      "Each RV independently guided, includes decoys",
    ],
    relatedSimId: "rocket",
    category: "ballistic",
    sources: [
      { label: "PIB: Mission Divyastra", url: "https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2013549" },
      { label: "Wikipedia: Agni-V", url: "https://en.wikipedia.org/wiki/Agni-V" },
      { label: "The Diplomat: MIRV Analysis", url: "https://thediplomat.com/2024/03/maiden-test-for-indias-agni-5-mirv-missile/" },
    ],
  },

  {
    id: "agniP",
    name: "Agni-P (Agni Prime)",
    type: "Tactical IRBM",
    developer: "DRDO (ASL Hyderabad)",
    status: "Trials ongoing (2021–present)",
    image_emoji: "🚀",
    propulsion: {
      stages: "2-Stage Solid",
      propellant: "Improved composite (higher energy density)",
      thrust: "~50,000 kgf (Stage 1, estimated)",
      isp: "~280 s",
      motorNotes: "Next-gen lightweight composite casing; improved Isp over Agni-I/II",
    },
    performance: {
      range: "1,000–2,000 km",
      speed: "Mach 12 (re-entry)",
      payload: "Up to 1,000 kg",
      accuracy: "CEP < 30 m (MaRV terminal guidance)",
      guidance: "Advanced INS + MaRV terminal",
    },
    milestones: [
      { year: 2021, event: "First test flight (June)" },
      { year: 2022, event: "Second successful test" },
      { year: 2023, event: "Third test — full range, night trial" },
    ],
    specialFeatures: [
      "Canister-launched — cold-launch from TEL",
      "MaRV (Manoeuvring Re-entry Vehicle) capability",
      "Replaces Agni-I and Agni-II in inventory",
      "Lower signatures, harder to intercept",
    ],
    relatedSimId: "rocket",
    category: "ballistic",
    sources: [
      { label: "Wikipedia: Agni-P", url: "https://en.wikipedia.org/wiki/Agni-P" },
    ],
  },

  // ─────────────────────────── BRAHMOS ───────────────────────────
  {
    id: "brahmos",
    name: "BrahMos",
    type: "Supersonic Cruise Missile",
    developer: "BrahMos Aerospace (DRDO 50.5% + NPO Mashinostroyenia 49.5%)",
    status: "Inducted 2003 (Army), 2005 (Navy), 2012 (Air Force — Su-30MKI)",
    image_emoji: "⚡",
    propulsion: {
      stages: "Solid booster + Liquid Ramjet sustainer",
      propellant: "Stage 1: HTPB solid (~48,000 kgf, ~3 s burn) | Stage 2: JP-10 kerosene + atmospheric O₂",
      thrust: "~300 kN sustainer thrust (air-breathing)",
      isp: "~800 s (air-breathing effective Isp)",
      motorNotes: "Indian solid booster outsourced to Solar Industries (2018 ToT); ramjet uses turbine pump",
    },
    performance: {
      range: "450–500 km (post-MTCR waiver 2016)",
      speed: "Mach 2.8–3.0",
      payload: "200–300 kg conventional",
      accuracy: "CEP < 1 m (active radar seeker)",
      guidance: "Inertial + GPS mid-course + Active AESA terminal",
    },
    milestones: [
      { year: 2001, event: "First test flight (PJ-10 designation)" },
      { year: 2003, event: "Army Block-I induction" },
      { year: 2012, event: "First Su-30MKI air-launch test" },
      { year: 2022, event: "Philippines — first export customer (3 batteries)" },
      { year: 2024, event: "BrahMos-NG (Next Gen) full-scale development approved" },
    ],
    specialFeatures: [
      "World's fastest operational cruise missile in service",
      "4 variants: Land / Ship / Submarine / Air (Su-30MKI)",
      "Supersonic through entire flight; no vulnerable subsonic phase",
      "SLAM (Supersonic Low-Altitude Mission) at 10m sea-skimming",
      "Export customers: Philippines, Indonesia, Vietnam (expected)",
    ],
    relatedSimId: "scramjet",
    category: "cruise",
    sources: [
      { label: "Wikipedia: BrahMos", url: "https://en.wikipedia.org/wiki/BrahMos" },
    ],
  },

  // ─────────────────────────── AKASH ───────────────────────────
  {
    id: "akash",
    name: "Akash",
    type: "Medium-Range Surface-to-Air Missile (SAM)",
    developer: "DRDO (DRDL + HEMRL)",
    status: "Inducted 2009 (Air Force), 2015 (Army); Akash-1S + Akash-NG in service",
    image_emoji: "🛡️",
    propulsion: {
      stages: "Integrated solid booster + Ramjet sustainer",
      propellant: "HTPB/AP composite (booster) + AP-based (sustainer ramjet grain)",
      thrust: "~55 kN (boost phase)",
      isp: "~500 s (ramjet sustainer effective)",
      motorNotes: "Unique integrated Ramjet-Rocket motor design; HEMRL developed AP-HTPB propellant",
    },
    performance: {
      range: "25–80 km (Akash-NG)",
      speed: "Mach 2.5–3.5",
      payload: "Proximity blast-frag warhead (60 kg)",
      accuracy: "Miss distance < 2 m (Rajendra AESA radar)",
      guidance: "Rajendra radar (AESA) command uplink + terminal active",
    },
    milestones: [
      { year: 1990, event: "Development begins (IGMDP Phase)" },
      { year: 2009, event: "Inducted into Indian Air Force" },
      { year: 2015, event: "Indian Army induction" },
      { year: 2022, event: "Philippines — first export customer" },
      { year: 2023, event: "Armenia export delivery" },
    ],
    specialFeatures: [
      "Indigenous AESA radar (Rajendra) fire-control system",
      "Simultaneously engages 4 targets",
      "Ramjet sustainer: no jet tabs, cleaner aerodynamics",
      "Exported: Philippines 2022, Armenia 2023",
      "Akash-NG: extended range, AESA seeker, improved motor",
    ],
    relatedSimId: "hybrid",
    category: "sam",
    sources: [
      { label: "Wikipedia: Akash", url: "https://en.wikipedia.org/wiki/Akash_(missile)" },
    ],
  },

  // ─────────────────────────── ASTRA ───────────────────────────
  {
    id: "astraMk1",
    name: "Astra Mk1",
    type: "BVRAAM (Beyond Visual Range Air-to-Air Missile)",
    developer: "DRDO (ADE Bengaluru + HEMRL)",
    status: "Inducted 2022 (IAF Sukhoi Sq)",
    image_emoji: "✈️",
    propulsion: {
      stages: "Single-stage solid (smokeless)",
      propellant: "Smokeless composite (HTPB/AP, no signature flame)",
      thrust: "~30 kN",
      isp: "~260 s",
      motorNotes: "Smokeless — reduces visual signature; dual-pulse capability in later batches",
    },
    performance: {
      range: "80 km (head-on), 20 km (tail-chase)",
      speed: "Mach 4.5",
      payload: "15 kg blast-frag warhead",
      accuracy: "Active AESA Ku-band radar seeker; INS midcourse",
      guidance: "INS mid-course + Active radar terminal",
    },
    milestones: [
      { year: 2003, event: "First test at Balasore ITR" },
      { year: 2017, event: "User trials on Su-30MKI completed" },
      { year: 2022, event: "Formally inducted, first active unit (Sukhoi Sqn)" },
    ],
    specialFeatures: [
      "India's first indigenous BVRAAM",
      "Smokeless motor: reduces detection by DIRCM / IRST",
      "Integrated with Su-30MKI, LCA Tejas (Mk1A)",
      "Dual-redundant INS + GPS midcourse guidance",
    ],
    relatedSimId: "rocket",
    category: "aam",
    sources: [
      { label: "Wikipedia: Astra", url: "https://en.wikipedia.org/wiki/Astra_(missile)" },
    ],
  },

  {
    id: "astraMk2",
    name: "Astra Mk2",
    type: "BVRAAM (Extended Range)",
    developer: "DRDO (ADE Bengaluru + HEMRL)",
    status: "Under trials (2024–25)",
    image_emoji: "✈️",
    propulsion: {
      stages: "Improved single-stage solid",
      propellant: "High-energy density composite (improved over Mk1)",
      thrust: "~35 kN (estimated)",
      isp: "~270 s",
      motorNotes: "Higher volumetric loading, improved nozzle throat material",
    },
    performance: {
      range: "160 km (head-on)",
      speed: "Mach 4.5+",
      payload: "20 kg warhead",
      accuracy: "Active AESA seeker + datalink",
      guidance: "INS + GPS + Datalink + Active AESA terminal",
    },
    milestones: [
      { year: 2023, event: "Development contract awarded" },
      { year: 2024, event: "First captive carry trial under Su-30MKI" },
      { year: 2025, event: "First live firing trials (reported)" },
    ],
    specialFeatures: [
      "Double the range of Astra Mk1 (160 vs 80 km)",
      "Two-way datalink for retargeting mid-flight",
      "Improved seeker against stealth targets",
      "Will equip AMCA and TEJAS Mk2",
    ],
    relatedSimId: "rocket",
    category: "aam",
    sources: [
      { label: "Wikipedia: Astra", url: "https://en.wikipedia.org/wiki/Astra_(missile)" },
    ],
  },

  {
    id: "astraMk3",
    name: "Astra Mk3 (SFDR)",
    type: "VLRAAM (Very Long Range AAM) — Solid Fuel Ducted Ramjet",
    developer: "DRDO (DRDL + HEMRL) — India-Russia co-dev",
    status: "Development, induction ~2029",
    image_emoji: "⚡",
    propulsion: {
      stages: "Solid Fuel Ducted Ramjet (SFDR) — single motor, air-breathing",
      propellant: "Solid fuel grain (Boron-AP) + atmospheric O₂ via ram-air intakes",
      thrust: "Variable — throttleable via grain port area",
      isp: "~1,200 s (effective air-breathing Isp)",
      motorNotes: "India's first SFDR propulsion. Solid fuel grain replaces liquid fuel. Tested at DRDL 2021.",
    },
    performance: {
      range: "350 km",
      speed: "Mach 4.5+",
      payload: "~25 kg warhead",
      accuracy: "Advanced AESA seeker + 2-way datalink",
      guidance: "INS + GPS + Datalink + Imaging IR + Active AESA",
    },
    milestones: [
      { year: 2017, event: "SFDR propulsion development contract" },
      { year: 2021, event: "SFDR ground test success (DRDL)" },
      { year: 2023, event: "Free-flight test of SFDR vehicle at Balasore" },
    ],
    specialFeatures: [
      "SFDR: air-breathing with solid fuel — no cryogenics, no liquid fuel complexity",
      "Ranges comparable to MBDA Meteor (340 km)",
      "Throttleable thrust: high energy in terminal phase",
      "India-Russia co-developed SFDR, but India to produce independently",
      "Places India in exclusive club (Europe, China, Russia) with SFDR AAMs",
    ],
    relatedSimId: "scramjet",
    category: "aam",
    sources: [
      { label: "Wikipedia: Astra", url: "https://en.wikipedia.org/wiki/Astra_(missile)" },
    ],
  },

  // ─────────────────────────── PRITHVI ───────────────────────────
  {
    id: "prithvi",
    name: "Prithvi-I / II",
    type: "Short-Range Ballistic Missile (SRBM)",
    developer: "DRDO (DRDL Hyderabad)",
    status: "Inducted 1994 (Prithvi-I Army); 1996 (Prithvi-II Air Force)",
    image_emoji: "🚀",
    propulsion: {
      stages: "Single-stage liquid bipropellant",
      propellant: "UDMH (Unsymmetrical DiMethyl Hydrazine) + N₂O₄",
      thrust: "~75 kN (twin Vikas-derivative engines)",
      isp: "~300 s",
      motorNotes: "Twin turbopump-fed liquid engines; Dhanush naval variant with booster",
    },
    performance: {
      range: "150 km (Prithvi-I) / 350 km (Prithvi-II)",
      speed: "Mach 3",
      payload: "500–1,000 kg (nuclear or conventional)",
      accuracy: "CEP ~25 m",
      guidance: "Inertial + GPS terminal",
    },
    milestones: [
      { year: 1988, event: "First Prithvi test (IGMDP milestone)" },
      { year: 1994, event: "Prithvi-I inducted into Army" },
      { year: 1996, event: "Prithvi-II inducted (Air Force, 250 km range)" },
      { year: 2004, event: "Dhanush (naval) first test from INS Subhadra" },
    ],
    specialFeatures: [
      "First IGMDP ballistic missile to be inductured",
      "Liquid propellant — higher Isp but slower response vs solid",
      "Dhanush = naval variant, 350 km, ship-launched",
      "To be replaced by Pralay (solid-fuel, SRBM)",
    ],
    relatedSimId: "rocket",
    category: "ballistic",
    sources: [
      { label: "Wikipedia: Prithvi", url: "https://en.wikipedia.org/wiki/Prithvi_(missile)" },
    ],
  },

  // ─────────────────────────── NAG ───────────────────────────
  {
    id: "nag",
    name: "Nag ATGM",
    type: "Anti-Tank Guided Missile (3rd Gen, Fire & Forget)",
    developer: "DRDO (DRDL + HEMRL)",
    status: "Inducted 2021 (NAMICA vehicle)",
    image_emoji: "🎯",
    propulsion: {
      stages: "Solid dual-pulse (boost + sustainer tandem)",
      propellant: "Smokeless composite AP/HTPB",
      thrust: "~5 kN boost",
      isp: "~260 s",
      motorNotes: "Dual-pulse: boost (~0.3s) + coast + sustainer; minimal smoke signature",
    },
    performance: {
      range: "4–7 km (ground) / 8–10 km (HELINA from helicopter)",
      speed: "Mach 0.5 (230 m/s)",
      payload: "8 kg tandem shaped charge (penetrates 650 mm RHA behind ERA)",
      accuracy: "Miss distance < 0.5 m (IIR seeker)",
      guidance: "Imaging Infrared (IIR) — fire & forget, passive, jam-proof",
    },
    milestones: [
      { year: 1990, event: "Development begins under IGMDP" },
      { year: 2012, event: "Final user trials (hot desert, Rajasthan)" },
      { year: 2017, event: "HELINA (helicopter variant) first test from Dhruv ALH" },
      { year: 2021, event: "Inducted on NAMICA vehicle (Sarath APC based)" },
    ],
    specialFeatures: [
      "Fire-and-forget IIR — no wire, no laser beam riding",
      "Tandem HEAT penetrates modern ERA-equipped tanks",
      "Variants: Nag (ground), HELINA (helicopter), MPATGM (man-portable ~2026)",
      "HEMRL developed smokeless propellant for low IR signature",
    ],
    relatedSimId: "rocket",
    category: "atgm",
    sources: [
      { label: "Wikipedia: Nag", url: "https://en.wikipedia.org/wiki/Nag_(missile)" },
    ],
  },

  // ─────────────────────────── NIRBHAY ───────────────────────────
  {
    id: "nirbhay",
    name: "Nirbhay",
    type: "Long-Range Subsonic Cruise Missile",
    developer: "DRDO (ADE Bengaluru + GTRE Bengaluru)",
    status: "Final trials; induction expected 2025–26",
    image_emoji: "🛩️",
    propulsion: {
      stages: "HTPB solid booster + GTRE Manik turbofan sustainer",
      propellant: "HTPB solid (booster) + JP-10 / aviation fuel (Manik, Mach 0.7)",
      thrust: "~1 kN (Manik turbofan cruise); ~100 kN (solid booster, 6s)",
      isp: "~3,000 s (turbofan effective; includes fuel burn time)",
      motorNotes: "GTRE Manik: 350 N thrust, axial turbofan, indigenous; booster from HEMRL",
    },
    performance: {
      range: "800–1,000 km",
      speed: "Mach 0.7 (cruise)",
      payload: "200–300 kg",
      accuracy: "CEP < 1 m (terrain contour matching + GPS + digital scene-matching)",
      guidance: "INS + Terrain contour matching (TERCOM) + DSMAC + GPS",
    },
    milestones: [
      { year: 2013, event: "First test (partial success — engine stall)" },
      { year: 2019, event: "5th test — full range, low-level terrain following" },
      { year: 2020, event: "6th test (night) — successful" },
      { year: 2024, event: "Air-launched variant trial from Su-30MKI (reported)" },
    ],
    specialFeatures: [
      "India's first cruise missile with turbofan sustainer (GTRE Manik)",
      "TERCOM terrain-following at 100m altitude — defeats radar coverage",
      "Sea-skimming mode + pop-up terminal manoeuvre",
      "India's Tomahawk / SCALP equivalent",
      "Air-launched variant in development (ALCM for IAF)",
    ],
    relatedSimId: "scramjet",
    category: "cruise",
    sources: [
      { label: "Wikipedia: Nirbhay", url: "https://en.wikipedia.org/wiki/Nirbhay" },
    ],
  },

  // ─────────────────────────── LR-AShM ───────────────────────────
  {
    id: "lrashm",
    name: "LR-AShM",
    type: "Hypersonic Glide Anti-Ship Missile",
    developer: "DRDO (ASL Hyderabad)",
    status: "Unveiled Republic Day Jan 2026; entering limited serial production",
    image_emoji: "🌐",
    propulsion: {
      stages: "2-Stage Solid propulsion + unpowered hypersonic glide phase",
      propellant: "Advanced high-energy composite solid",
      thrust: "Classified (estimated Stage 1: ~80,000 kgf class)",
      isp: "~280 s (solid boost phases)",
      motorNotes: "Boost-glide architecture; waverider glide vehicle; thermal protection system for sustained Mach 5+ glide",
    },
    performance: {
      range: "1,500+ km",
      speed: "Mach 10 (initial boost), avg Mach 5+ (glide)",
      payload: "Conventional / nuclear",
      accuracy: "X-band SAR seeker (ECIL) + INS",
      guidance: "INS + GPS + X-band SAR active seeker (ECIL developed)",
    },
    milestones: [
      { year: 2026, event: "Publicly unveiled at Republic Day parade (January 26, 2026)" },
      { year: 2026, event: "Limited serial production order placed (reported)" },
    ],
    specialFeatures: [
      "~13 m length, ~12 tonne launch weight",
      "Quasi-ballistic trajectory with skip manoeuvres (harder to intercept)",
      "X-band SAR seeker enables all-weather, day/night targeting of moving ships",
      "Primary target: aircraft carrier battle groups",
      "India's first operational hypersonic strike weapon",
    ],
    relatedSimId: "detonation",
    category: "hypersonic",
    sources: [
      { label: "PIB: Republic Day 2026 DRDO", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2217280" },
      { label: "Naval News: LR-AShM", url: "https://www.navalnews.com/naval-news/2026/01/india-showcases-first-hypersonic-anti-ship-missile-system-in-national-parade/" },
      { label: "Wikipedia: LR-AShM", url: "https://en.wikipedia.org/wiki/Long_Range_%E2%80%93_Anti_Ship_Missile_(India)" },
      { label: "DD News: DRDO LR-AShM", url: "https://ddnews.gov.in/en/r-day-drdo-unveils-long-range-anti-ship-hypersonic-missile/" },
    ],
  },

  // ─────────────────────────── HSTDV ───────────────────────────
  {
    id: "hstdv",
    name: "HSTDV / Scramjet Programme",
    type: "Hypersonic Technology Demonstrator Vehicle",
    developer: "DRDO (DRDL Hyderabad)",
    status: "Flight tested Sep 2020 (20s); Ground tests: 120s (Jan 2025), 1000s (Apr 2025), 720s / 12-min (Jan 2026)",
    image_emoji: "🔥",
    propulsion: {
      stages: "Agni-I solid booster + Scramjet cruise vehicle",
      propellant: "Solid HTPB boost + Endothermic hydrocarbon fuel (scramjet)",
      thrust: "Scramjet: variable, estimated 5–15 kN range",
      isp: "~1,500–2,000 s (scramjet at Mach 6)",
      motorNotes: "Active regenerative cooling (fuel as coolant); ceramic TBC thermal barrier coating; indigenous endothermic fuel developed by NFTDC",
    },
    performance: {
      range: "Not disclosed (demonstrator)",
      speed: "Mach 6+",
      payload: "None (demonstrator, instrumentation only)",
      accuracy: "N/A",
      guidance: "GPS telemetry + pre-programmed",
    },
    milestones: [
      { year: 2020, event: "First successful Mach 6 flight test (20s scramjet run) — Sep 7, 2020" },
      { year: 2025, event: "120-second ground hot-fire test (Jan 2025, PIB confirmed)" },
      { year: 2025, event: "1,000-second ground hot-fire test (Apr 2025, PIB confirmed)" },
      { year: 2026, event: "12-minute (720s) full-scale ground test (Jan 2026, DRDL Hyderabad)" },
    ],
    specialFeatures: [
      "India's only successful scramjet flight test to date",
      "Endothermic hydrocarbon fuel: cools combustor walls before burning",
      "Active cooling: fuel channels machined into combustor wall",
      "Advanced ceramic TBC (thermal barrier coating) for hypersonic leading edges",
      "Building block for BrahMos-NG hypersonic and future HGV payloads",
    ],
    relatedSimId: "scramjet",
    category: "experimental",
    sources: [
      { label: "PIB: Scramjet 120s Test Jan 2025", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2094886" },
      { label: "PIB: Scramjet 1000s Test Apr 2025", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2124415" },
      { label: "Wikipedia: HSTDV", url: "https://en.wikipedia.org/wiki/Hypersonic_Technology_Demonstrator_Vehicle" },
    ],
  },

  // ─────────────────────────── BRAHMOS-II ───────────────────────────
  {
    id: "brahmos2",
    name: "BrahMos-II (Hypersonic)",
    type: "Hypersonic Cruise Missile",
    developer: "BrahMos Aerospace (DRDO + NPO Mashinostroyenia JV)",
    status: "Under development — no confirmed induction timeline",
    image_emoji: "🔥",
    propulsion: {
      stages: "Scramjet-powered (air-breathing hypersonic)",
      propellant: "Hydrocarbon fuel + atmospheric O₂ (scramjet)",
      thrust: "Classified",
      isp: "~1,500–2,000 s (scramjet effective)",
      motorNotes: "Based on Russian 3M22 Zircon scramjet technology; India adapting for BrahMos airframe",
    },
    performance: {
      range: "600+ km",
      speed: "Mach 7–8 (target operational speed)",
      payload: "200 kg (estimated)",
      accuracy: "Active radar seeker + INS",
      guidance: "INS + Active AESA terminal seeker",
    },
    milestones: [
      { year: 2010, event: "Concept studies begun (India-Russia JV)" },
      { year: 2016, event: "Joint development agreement renewed" },
      { year: 2025, event: "Development ongoing; HSTDV results being integrated" },
    ],
    specialFeatures: [
      "Successor to supersonic BrahMos — Mach 7–8 vs Mach 3",
      "Scramjet sustainer: requires pre-heating by solid booster to Mach 4+",
      "Russia's 3M22 Zircon provides technology baseline",
      "Expected to complement LR-AShM for sea denial missions",
    ],
    relatedSimId: "scramjet",
    category: "hypersonic",
    sources: [
      { label: "Wikipedia: BrahMos-II", url: "https://en.wikipedia.org/wiki/BrahMos-II" },
    ],
  },
];

// ─────────────────────────── META EXPORTS ───────────────────────────

export const MISSILE_CATEGORIES = [
  { id: "all",          label: "All" },
  { id: "ballistic",    label: "Ballistic" },
  { id: "cruise",       label: "Cruise" },
  { id: "sam",          label: "SAM" },
  { id: "aam",          label: "AAM" },
  { id: "atgm",         label: "ATGM" },
  { id: "hypersonic",   label: "Hypersonic" },
  { id: "experimental", label: "R&D" },
];

export const ECOSYSTEM = [
  {
    name: "HEMRL, Pune",
    role: "Research",
    desc: "HTPB/AP/RDX propellant formulation & ballistic evaluation",
  },
  {
    name: "DRDL, Hyderabad",
    role: "Design",
    desc: "Missile integration, motor design, ramjet & scramjet R&D",
  },
  {
    name: "ASL, Hyderabad",
    role: "Strategic",
    desc: "Agni series motors, composite casings, strategic propulsion",
  },
  {
    name: "GTRE, Bengaluru",
    role: "Turbofan",
    desc: "Manik turbofan for Nirbhay, gas turbine R&D",
  },
  {
    name: "Solar Industries, Nagpur",
    role: "Private",
    desc: "Solid boosters for BrahMos (2018 ToT), Pinaka rockets",
  },
  {
    name: "Premier Explosives, Telangana",
    role: "Private",
    desc: "Propellants for BrahMos, Astra, Akash, LRSAM, Agni",
  },
];

export const MILESTONES_TIMELINE = [
  { year: 1983, event: "IGMDP launched by Dr. APJ Abdul Kalam" },
  { year: 1989, event: "Agni-I (Technology Demonstrator) first test" },
  { year: 2001, event: "BrahMos first test flight" },
  { year: 2012, event: "Agni-V first test" },
  { year: 2020, event: "HSTDV Mach 6 scramjet flight test" },
  { year: 2024, event: "Mission Divyastra — Agni-V MIRV maiden flight" },
  { year: 2025, event: "Scramjet 1,000-second ground test (DRDL)" },
  { year: 2026, event: "LR-AShM unveiled at Republic Day, Scramjet 12-min test" },
];
