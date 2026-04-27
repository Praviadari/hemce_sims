import { useState, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function KineticPenetratorSim() {
  const [velocity, setVelocity] = useState(1500); // m/s
  const [material, setMaterial] = useState("du");
  const [aspectRatio, setAspectRatio] = useState(20); // Length/Diameter
  const targetDensity = 7.85; // RHA Steel

  const rodData = {
    du: { density: 19.1, label: "Depleted Uranium (DU)", color: "#9AE6B4", autoSharpen: true },
    w:  { density: 17.6, label: "Tungsten Alloy", color: "#A0AEC0", autoSharpen: false },
    st: { density: 7.85, label: "Hardened Steel", color: "#E2E8F0", autoSharpen: false },
  };

  const current = rodData[material];

  // Idealized Penetration Eq: P = L * sqrt(rho_p / rho_t)
  // Lanz-Odermatt modifiers can handle velocity profiles
  
  const vScale = Math.min(1.0, velocity / 2000); // Standard limit 2km/s
  const rodLength = aspectRatio * 25; // Base L scale
  
  // DU achieves greater depth via adiabatic shear banding (self-sharpening). Tungsten mushrooms.
  const penetratorEfficiency = current.autoSharpen ? 1.1 : 0.9;
  
  const rawPenetration = rodLength * Math.sqrt(current.density / targetDensity) * vScale;
  const finalPenetration = Math.round(rawPenetration * penetratorEfficiency);

  // Kinetic Energy (assuming 25mm diameter)
  const vol = Math.PI * Math.pow(1.25, 2) * (rodLength / 10); // cm^3
  const massKg = (vol * current.density) / 1000;
  const keMJ = Math.round(0.5 * massKg * velocity * velocity / 1e6 * 10) / 10;

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = 80;
      const cy = H / 2;
      const targetX = 140;
      
      const t = (frame * 0.03) % 3; // Loop
      
      // Target RHA Block
      ctx.fillStyle = "#2D3748";
      ctx.fillRect(targetX, cy - 60, W - targetX - 20, 120);
      
      // Steel texture lines
      ctx.strokeStyle = "#4A5568";
      ctx.lineWidth = 1;
      for(let i=0; i<W-targetX-20; i+=20) {
         ctx.beginPath(); ctx.moveTo(targetX+i, cy-60); ctx.lineTo(targetX+i, cy+60); ctx.stroke();
      }

      const visualRodL = Math.max(10, aspectRatio * 2);
      const rodThickness = 6;

      if (t < 0.5) {
         // Flight phase
         const flightT = t / 0.5;
         const rodX = targetX - visualRodL - 20 + flightT * 20;
         
         ctx.fillStyle = current.color;
         ctx.fillRect(rodX, cy - rodThickness/2, visualRodL, rodThickness);
         
         // APFSDS Sabot petals falling away (implied early flight but we show generic blur)
         ctx.strokeStyle = "rgba(255,255,255,0.4)";
         ctx.beginPath();
         ctx.moveTo(rodX - 10, cy); ctx.lineTo(rodX - 40, cy);
         ctx.stroke();
      } 
      else if (t >= 0.5 && t < 2.0) {
         // Penetration phase (Erosion)
         const pT = (t - 0.5) / 1.5;
         const currentDepth = Math.min(finalPenetration / 5, pT * (finalPenetration / 5)); // Scaling depth visually
         
         // Crater
         ctx.fillStyle = theme.canvasBackground;
         ctx.beginPath();
         ctx.ellipse(targetX + currentDepth / 2, cy, currentDepth / 2, rodThickness + 2, 0, 0, Math.PI*2);
         ctx.fill();

         // The eroding rod moving in while shortening
         const remainingL = Math.max(2, visualRodL * (1 - pT * 0.8)); // Consumed length
         
         ctx.fillStyle = current.color;
         ctx.beginPath();
         if (current.autoSharpen) {
             // Chisel point (DU)
             ctx.moveTo(targetX + currentDepth - remainingL, cy - rodThickness/2);
             ctx.lineTo(targetX + currentDepth, cy);
             ctx.lineTo(targetX + currentDepth - remainingL, cy + rodThickness/2);
         } else {
             // Mushrooming head (Tungsten)
             ctx.fillRect(targetX + currentDepth - remainingL, cy - rodThickness/2, remainingL, rodThickness);
             ctx.fillStyle = "#ED8936"; // Heat
             ctx.fillRect(targetX + currentDepth - 5, cy - rodThickness, 5, rodThickness*2);
         }
         ctx.fill();

         // Sparks/Plasma ejection at root
         ctx.fillStyle = "#ED8936";
         for(let i=0; i<5; i++) {
            ctx.beginPath();
            ctx.arc(targetX - 5 + Math.random()*5, cy + (Math.random()-0.5)*30, 1+Math.random()*2, 0, Math.PI*2);
            ctx.fill();
         }
      } 
      else {
         // Final rest
         const currentDepth = finalPenetration / 5;
         ctx.fillStyle = theme.canvasBackground;
         ctx.beginPath();
         ctx.ellipse(targetX + currentDepth / 2, cy, currentDepth / 2, rodThickness + 2, 0, 0, Math.PI*2);
         ctx.fill();

         ctx.fillStyle = current.color;
         // Remaining nub inside crater
         if (current.autoSharpen) {
             ctx.beginPath();
             ctx.moveTo(targetX + currentDepth - 5, cy - rodThickness/2);
             ctx.lineTo(targetX + currentDepth, cy);
             ctx.lineTo(targetX + currentDepth - 5, cy + rodThickness/2);
             ctx.fill();
         } else {
             ctx.fillRect(targetX + currentDepth - 5, cy - rodThickness, 5, rodThickness*2);
         }

         ctx.font = `bold 10px ${TECH_FONT}`;
         ctx.fillStyle = T.white;
         ctx.fillText(`${finalPenetration} mm RHA Depth`, targetX + currentDepth + 10, cy + 4);
      }

      ctx.fillStyle = T.white;
      ctx.font = `9px ${TECH_FONT}`;
      ctx.fillText("RHA STEEL TARGET", targetX + 10, cy - 45);

    },
    [velocity, aspectRatio, material, current, finalPenetration],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Kinetic Energy Penetrator (APFSDS) simulation — current parameters:
ROLE: "You are a terminal ballistics engineer mapping kinetic penetrators against heavy rolled homogeneous armor (RHA)."

PARAMETERS:
1. Impact Velocity: ${velocity} m/s
2. Material: ${current.label} (Density: ${current.density} g/cc)
3. Aspect Ratio (L/D): ${aspectRatio}
4. Penetrator Mass Est.: ${massKg.toFixed(2)} kg
5. Impact Energy: ${keMJ} MJ
6. Final RHA Penetration: ${finalPenetration} mm

ANALYSIS REQUEST:
Part 1 — PHYSICS: Briefly explain the Tate/Alekseevskii hydrodynamic penetration model where at hypervelocity (above 1000m/s), both the steel armor and penetrator behave like fluids.
Part 2 — MATERIAL TRADEOFF: Explain why Depleted Uranium (DU) out-penetrates Tungsten heavy alloys due to adiabatic shear banding (self-sharpening), whereas Tungsten tends to "mushroom" upon impact.
Part 3 — REAL-WORLD CONTEXT: Relate this penetration (${finalPenetration} mm) to modern Main Battle Tanks (like Arjun MK1A or T-90S Bhishma). Which standard anti-tank guns fire rounds of this kinetic profile?`,
    [velocity, aspectRatio, current, massKg, keMJ, finalPenetration],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={180} maxWidth={460} />
      
      <PillRow>
        <Pill active={material === "du"} onClick={() => setMaterial("du")} color={T.green}>Depleted Uranium (DU)</Pill>
        <Pill active={material === "w"} onClick={() => setMaterial("w")} color={T.gray}>Tungsten Alloy (W)</Pill>
        <Pill active={material === "st"} onClick={() => setMaterial("st")} color={T.white}>Hardened Steel</Pill>
      </PillRow>

      <Slider label="Impact Velocity" value={velocity} onChange={setVelocity} min={800} max={2000} step={50} unit=" m/s" color={T.red} />
      <Slider label="Rod Aspect Ratio (L/D)" value={aspectRatio} onChange={setAspectRatio} min={5} max={30} step={1} unit="" color={T.accent} />
      
      <DataRow>
        <DataBox label="Penetration" value={finalPenetration} unit="mm RHA" color={finalPenetration > 600 ? T.purple : T.cyan} />
        <DataBox label="Energy" value={keMJ.toFixed(1)} unit="MJ" color={T.orange} />
        <DataBox label="L/D Ratio" value={aspectRatio} unit="" color={T.gray} />
        <DataBox label="Density" value={current.density} unit="g/cc" color={T.gold} />
      </DataRow>

      <InfoBox color={T.cyan}>
        <strong>APFSDS (Armor-Piercing Fin-Stabilized Discarding Sabot)</strong> relies entirely on kinetic energy (0.5 * m * v²). At hypervelocities, penetration follows hydrodynamic limits (scales with penetrator length and the square root of relative densities). <strong style={{ color: T.green }}>Depleted Uranium (DU)</strong> achieves ~10% greater depth than Tungsten by failing via <em>adiabatic shear banding</em>, constantly shearing off blunt edges to maintain a sharp chisel point, while Tungsten mushrooms against armor.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="kinetic_pnt" getData={() => ({ material, velocity, aspectRatio, finalPenetration, keMJ })} color={T.cyan} />
    </div>
  );
}
