import { useState, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function BlastMitigationSim() {
  const [netExplosiveWeight, setNew] = useState(500); // kg TNT equivalent
  const [distance, setDistance] = useState(50); // meters
  const [barrier, setBarrier] = useState("none");

  const barrierData = {
    none:    { reduction: 1.0, label: "Open Air", color: "#A0AEC0" },
    wall:    { reduction: 0.6, label: "Concrete Blast Wall", color: "#F6AD55" },
    earth:   { reduction: 0.3, label: "Earth Berm / Igloo", color: "#9AE6B4" },
  };

  const currentBarrier = barrierData[barrier];

  // Quantity-Distance (Q-D) Scaling Law (Hopkinson-Cranz)
  // Scaled Distance: Z = R / (W ^ (1/3))
  const Z = distance / Math.pow(netExplosiveWeight, 1/3);
  
  // Incident Overpressure (rough empirical formula for TNT, output in kPa)
  let overpressure = 0;
  if (Z > 0) {
      // Simplified Kingery-Bulmash curve
      const pBar = (6.7 / Math.pow(Z, 3)) + (2 / Math.pow(Z, 2)) + (0.5 / Z);
      overpressure = Math.round(pBar * 100 * currentBarrier.reduction); // kPa
  }

  // Damage thresholds based on overpressure (kPa)
  let damageLevel = "Safe";
  let damageColor = T.green;
  if (overpressure > 100) { damageLevel = "Total Destruction"; damageColor = T.purple; }
  else if (overpressure > 35) { damageLevel = "Severe (Lethal)"; damageColor = T.red; }
  else if (overpressure > 15) { damageLevel = "Moderate (Eardrums)"; damageColor = T.orange; }
  else if (overpressure > 5)  { damageLevel = "Minor (Glass Break)"; damageColor = T.gold; }

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = 40;
      const cy = H / 2 + 30; // Ground line
      const t = (frame * 0.02) % 4; // looping blast wave

      // Draw Ground
      ctx.fillStyle = "#2D3748";
      ctx.fillRect(0, cy, W, H - cy);

      // Draw Facility / Target at given distance
      // scale distance visually: W-80 represents max distance (200m)
      const maxDist = 200;
      const targetX = cx + (distance / maxDist) * (W - 80);
      
      // Target structure (Office building)
      ctx.fillStyle = "#A0AEC0";
      ctx.fillRect(targetX, cy - 30, 20, 30);
      // Windows
      ctx.fillStyle = overpressure > 5 ? "#1A202C" : "#63B3ED"; // blown out if P > 5
      ctx.fillRect(targetX + 5, cy - 20, 10, 10);

      // Draw Explosive Source (Storage pad)
      const sizeRatio = Math.pow(netExplosiveWeight / 1000, 1/3) * 15;
      
      if (barrier === "earth") {
         // Igloo 
         ctx.fillStyle = "#48BB78";
         ctx.beginPath(); ctx.arc(cx, cy, sizeRatio+10, Math.PI, Math.PI*2); ctx.fill();
      } else if (barrier === "wall") {
         // Concrete wall next to source
         ctx.fillStyle = "#ED8936";
         ctx.fillRect(cx + sizeRatio + 5, cy - sizeRatio*1.5, 5, sizeRatio*1.5);
         ctx.fillStyle = "#E53E3E";
         ctx.fillRect(cx - sizeRatio/2, cy - sizeRatio, sizeRatio, sizeRatio);
      } else {
         // Open stack
         ctx.fillStyle = "#E53E3E";
         ctx.fillRect(cx - sizeRatio/2, cy - sizeRatio, sizeRatio, sizeRatio);
      }

      // Draw Blast Wave
      if (t < 2.0) {
         const waveRadius = t * (targetX - cx + 40);
         const waveThickness = Math.max(2, 30 - waveRadius*0.1);
         const alpha = Math.max(0, 1 - waveRadius / (targetX + 20));
         
         ctx.strokeStyle = `rgba(246, 173, 85, ${alpha * currentBarrier.reduction})`;
         ctx.lineWidth = waveThickness;
         ctx.beginPath(); 
         ctx.arc(cx, cy, waveRadius, Math.PI, Math.PI*2); 
         ctx.stroke();
      }

      // Damage text overlay exactly on target
      if (t > distance / maxDist * 2.0 && t < 3.0) { // Wave passed target
          ctx.font = `bold 9px ${TECH_FONT}`;
          ctx.textAlign = "center";
          ctx.fillStyle = damageColor;
          ctx.fillText(damageLevel, targetX + 10, cy - 40);
      }

      // Scales
      ctx.font = `8px ${TECH_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.textAlign = "center";
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(cx, cy+15); ctx.lineTo(targetX, cy+15); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText(`${distance} meters (Z = ${Z.toFixed(1)})`, cx + (targetX-cx)/2, cy + 25);

    },
    [netExplosiveWeight, distance, barrier, overpressure, Z, damageLevel, damageColor, currentBarrier],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Ammunition Storage Blast Mitigation calculation — current parameters:
ROLE: "You are a military safety infrastructure engineer applying Quantity-Distance (Q-D) principles for HEMRL/DRDO explosive storage limits."

PARAMETERS:
1. Net Explosive Weight (NEW): ${netExplosiveWeight} kg TNT eq
2. Standoff Distance: ${distance} m
3. Scaled Distance (Z): ${Z.toFixed(2)} m/kg^(1/3)
4. Barrier: ${currentBarrier.label} (Mitigation: ${currentBarrier.reduction}x)
5. Est. Incident Overpressure: ${overpressure} kPa
6. Anticipated Damage level: ${damageLevel}

ANALYSIS REQUEST:
Part 1 — HOPKINSON SCALING: Explain the cube-root scaling law ($Z = R / W^{1/3}$) used globally to calculate explosive overpressure over distances.
Part 2 — INFRASTRUCTURE: Explain the mechanics of why an Earth-covered Magazine (Igloo) focuses the blast vector upwards rather than horizontally, radically reducing incident overpressure on adjacent facilities compared to a basic concrete wall.
Part 3 — REGULATORY: With an overpressure of ${overpressure} kPa striking adjacent facilities, would this pass standard military safety audits for the location of an inhabited administrative building?`,
    [netExplosiveWeight, distance, currentBarrier, overpressure, Z, damageLevel],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={180} maxWidth={460} />
      
      <PillRow>
        <Pill active={barrier === "none"} onClick={() => setBarrier("none")} color={T.gray}>Open Air Stack</Pill>
        <Pill active={barrier === "wall"} onClick={() => setBarrier("wall")} color={T.orange}>Concrete Blast Wall</Pill>
        <Pill active={barrier === "earth"} onClick={() => setBarrier("earth")} color={T.green}>Earth Berm / Igloo</Pill>
      </PillRow>

      <Slider label="Net Explosive Weight (NEW)" value={netExplosiveWeight} onChange={setNew} min={100} max={5000} step={100} unit=" kg TNT" color={T.red} />
      <Slider label="Target Standoff Distance" value={distance} onChange={setDistance} min={10} max={200} step={5} unit=" m" color={T.accent} />
      
      <DataRow>
        <DataBox label="Z-Factor" value={Z.toFixed(1)} unit="m/kg⅓" color={T.gray} />
        <DataBox label="Overpressure" value={overpressure} unit="kPa" color={damageColor} />
        <DataBox label="Damage Tier" value={damageLevel} color={damageColor} />
      </DataRow>

      <InfoBox color={damageColor}>
        <strong>Quantity-Distance (Q-D) Standards:</strong> In military logistics, explosive magazines must be spaced according to Hopkinson-Cranz cube root scaling laws. Incident overpressure drops sharply with distance. Heavy Earth Covered Magazines (Igloos) are highly preferred as they channel the blast vector upwards into the sky rather than laterally across the ground, preserving adjacent buildings and drastically shrinking the required safe safety footprint.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="blast_mitig" getData={() => ({ netExplosiveWeight, distance, barrier, overpressure, z_factor: Z, damageLevel })} color={T.cyan} />
    </div>
  );
}
