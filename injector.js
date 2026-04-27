const fs = require('fs');
const files = [
  'AdditiveManufacturingSim.jsx', 'CocrystalSim.jsx', 'CombustionDiagnosticsSim.jsx',
  'CookOffTestSim.jsx', 'DetonationSim.jsx', 'ExplosiveDetectionSim.jsx',
  'GreenPropellantSim.jsx', 'GunPropellantSim.jsx', 'HybridRocketSim.jsx',
  'PAUTSim.jsx', 'PressureVesselSim.jsx', 'PropellantChemistrySim.jsx',
  'ReactiveArmorSim.jsx', 'ScramjetSim.jsx', 'ShapedChargeSim.jsx', 'SolidRocketSim.jsx'
];

for(const p of files) {
  const path = 'src/sims/' + p;
  if (!fs.existsSync(path)) continue;
  let code = fs.readFileSync(path, 'utf8');
  // Inject the component imports right after 'import { ... } from "../utils"'
  const target = code.match(/import\s+\{[^}]*\}\s+from\s+["']\.\.\/utils["'];?/);
  if (target && !code.includes('ExportBtn')) {
     const importStr = '\nimport { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ActionBtn, ResetBtn, ExportBtn, StripChart } from "../components";\nimport { AIInsight } from "../components/AIInsight";\n';
     code = code.replace(target[0], target[0] + importStr);
     fs.writeFileSync(path, code);
  } else {
     console.log('Skipped ' + p);
  }
}
console.log('Done mapping components');
