const fs = require('fs');
const files = [
  'AdditiveManufacturingSim.jsx', 'CocrystalSim.jsx', 'CombustionDiagnosticsSim.jsx',
  'CookOffTestSim.jsx', 'DetonationSim.jsx', 'ExplosiveDetectionSim.jsx',
  'GreenPropellantSim.jsx', 'GunPropellantSim.jsx', 'HybridRocketSim.jsx',
  'PAUTSim.jsx', 'PressureVesselSim.jsx', 'PropellantChemistrySim.jsx',
  'ReactiveArmorSim.jsx', 'ScramjetSim.jsx', 'ShapedChargeSim.jsx', 'SolidRocketSim.jsx'
];

for (const p of files) {
  const path = 'src/sims/' + p;
  if (!fs.existsSync(path)) continue;
  let code = fs.readFileSync(path, 'utf8');
  
  if (!code.includes('import { AIInsight }')) {
    const target = code.match(/import\s+\{[^}]*\}\s+from\s+["']\.\.\/utils["'];?/);
    if (target) {
       const importStr = '\nimport { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ActionBtn, ResetBtn, ExportBtn, StripChart } from "../components";\nimport { AIInsight } from "../components/AIInsight";\n';
       code = code.replace(target[0], target[0] + importStr);
       fs.writeFileSync(path, code);
       console.log('Injected ' + p);
    }
  } else {
    // If AIInsight is imported, verify the other components
    if (!code.includes('import { Pill,')) {
      const target2 = code.match(/import\s+\{\s*AIInsight\s*\}\s+from\s+["']\.\.\/components\/AIInsight["'];?/);
      if (target2) {
        const importStr2 = '\nimport { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ActionBtn, ResetBtn, ExportBtn, StripChart } from "../components";\n';
        code = code.replace(target2[0], target2[0] + importStr2);
        fs.writeFileSync(path, code);
        console.log('Injected Primitives into ' + p);
      }
    }
  }
}
console.log('Done mapping components');
