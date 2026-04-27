import { useState, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function EFPSim() {
  const [explosive, setExplosive] = useState("compb");
  const [liner, setLiner] = useState("cu");
  const [standoff, setStandoff] = useState(10); // calibers

  const expData = {
    tnt:   { energy: 1.0,  detV: 6900, label: "TNT", color: "#F6E05E" },
    compb: { energy: 1.15, detV: 7900, label: "Comp-B", color: "#ED8936" },
    hmx:   { energy: 1.35, detV: 9100, label: "HMX/PBX", color: "#E53E3E" },
  };

  const linerData = {
    cu: { density: 8.96,  ductility: 0.9,  label: "Copper",   color: "#DD6B20", slugVOffset: 0 },
    ta: { density: 16.65, ductility: 0.95, label: "Tantalum", color: "#718096", slugVOffset: -500 }, // heavier, slower
    fe: { density: 7.87,  ductility: 0.7,  label: "Iron",     color: "#A0AEC0", slugVOffset: 200 },  // lighter, faster
  };

  const currentExp = expData[explosive];
  const currentLiner = linerData[liner];

  // EFP Physics Estimation (Misznay-Schardin effect)
  // Slug velocity V_s = f(detV, liner density)
  const baseV = currentExp.detV * 0.35; // Rough estimate (2000-3000m/s range typically)
  let slugVelocity = Math.round(baseV + currentLiner.slugVOffset);

  // Aerodynamic drag scaling over standoff.
  // EFPs are meant for high standoff (up to 1000 calibers), unlike shape charges (2-4 calibers).
  const dragFactor = (standoff / 100); 
  const impactVelocity = Math.round(slugVelocity * Math.exp(-dragFactor * 0.05));

  // Penetration roughly scales with sqrt(density_liner / density_target) * length
  const rhaDensity = 7.85;
  const targetPenetration = Math.round((currentLiner.density / rhaDensity) * (impactVelocity / 1000) * 80); // mm RHA

  const isEFPStable = currentLiner.ductility > 0.8 && standoff < 500;

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = 50;
      const cy = H / 2;
      const t = (frame * 0.03) % 4; // Animation cycle

      // Draw Standoff Target (RHA Steel Plate)
      const targetX = cx + 80 + (standoff * 1.5);
      ctx.fillStyle = "#4A5568";
      ctx.fillRect(targetX, cy - 40, 20, 80);

      if (t < 0.2) {
          // Frame 1: Intact Warhead (Flat/Shallow dish liner)
          ctx.fillStyle = currentExp.color;
          ctx.fillRect(cx - 30, cy - 20, 30, 40);
          ctx.fillStyle = currentLiner.color;
          
          ctx.beginPath();
          ctx.moveTo(cx, cy - 20);
          ctx.quadraticCurveTo(cx - 15, cy, cx, cy + 20);
          ctx.lineTo(cx + 5, cy + 20);
          ctx.quadraticCurveTo(cx - 10, cy, cx + 5, cy - 20);
          ctx.fill();

          ctx.font = `8px ${TECH_FONT}`;
          ctx.fillStyle = T.dimText;
          ctx.fillText("SHALLOW LINER", cx - 20, cy - 30);
      } 
      else if (t >= 0.2 && t < 1.0) {
          // Explosion and Deformation
          const defT = (t - 0.2) / 0.8;
          ctx.fillStyle = `rgba(229, 62, 62, ${1 - defT})`;
          ctx.beginPath(); ctx.arc(cx, cy, 30 * defT + 10, 0, Math.PI*2); ctx.fill();
          
          // Liner inverting into slug
          const sx = cx + defT * 40;
          ctx.fillStyle = currentLiner.color;
          ctx.beginPath();
          // from shallow dish to egg shape
          ctx.ellipse(sx, cy, 5 + defT*10, 20 - defT*10, 0, 0, Math.PI*2);
          ctx.fill();
      }
      else if (t >= 1.0 && t < 2.5) {
          // Slug in flight
          const flightT = (t - 1.0) / 1.5;
          const sx = cx + 40 + flightT * (targetX - cx - 40);
          ctx.fillStyle = currentLiner.color;
          ctx.beginPath();
          if (isEFPStable) {
             ctx.ellipse(sx, cy, 15, 6, 0, 0, Math.PI*2);
          } else {
             // Tumbling
             ctx.ellipse(sx, cy, 15, 6, flightT * Math.PI * 4, 0, Math.PI*2);
          }
          ctx.fill();
          
          // Mach cone lines
          if (flightT < 0.9) {
             ctx.strokeStyle = "rgba(255,255,255,0.3)";
             ctx.beginPath();
             ctx.moveTo(sx + 15, cy); ctx.lineTo(sx - 10, cy - 15);
             ctx.moveTo(sx + 15, cy); ctx.lineTo(sx - 10, cy + 15);
             ctx.stroke();
          }
      }
      else {
          // Impact
          ctx.fillStyle = `rgba(237, 137, 54, ${(4.0 - t)*0.8})`;
          ctx.beginPath(); ctx.arc(targetX, cy, 20, 0, Math.PI*2); ctx.fill();
          
          // Crater depth
          ctx.fillStyle = theme.canvasBackground;
          ctx.beginPath();
          ctx.arc(targetX, cy, 15, Math.PI/2, Math.PI*1.5);
          ctx.fill();

          ctx.font = `bold 10px ${TECH_FONT}`;
          ctx.fillStyle = T.white;
          ctx.textAlign = "center";
          ctx.fillText(`${targetPenetration} mm RHA`, targetX + 10, cy - 45);
      }

      // Dimensioning Standoff
      ctx.strokeStyle = T.dimText;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 30); ctx.lineTo(cx, cy + 50);
      ctx.moveTo(targetX, cy + 30); ctx.lineTo(targetX, cy + 50);
      ctx.moveTo(cx, cy + 40); ctx.lineTo(targetX, cy + 40);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.font = `8px ${TECH_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.textAlign = "center";
      ctx.fillText(`${standoff} CD Standoff`, cx + (targetX - cx)/2, cy + 35);
      
    },
    [explosive, liner, standoff, targetPenetration, isEFPStable, currentExp, currentLiner],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Explosively Formed Penetrator (EFP) simulation — current parameters:
ROLE: "You are an expert in terminal ballistics and detonics, familiar with DRDO's anti-armor programs."

PARAMETERS:
1. Explosive Charge: ${currentExp.label}
2. Liner Material: ${currentLiner.label}
3. Standoff Distance: ${standoff} CD (Charge Diameters)
4. Launch Velocity: ${slugVelocity} m/s
5. Impact Velocity: ${impactVelocity} m/s
6. Target Penetration: ${targetPenetration} mm RHA

ANALYSIS REQUEST:
Part 1 — PHYSICS: Explain the Misznay-Schardin effect. How does it radically differ from the Munroe effect (Shaped Charges) in terms of jet vs slug formation?
Part 2 — STANDOFF: Notice that an EFP functions at enormous standoffs (${standoff} CD) compared to Shaped Charges (2-4 CD). Why do EFPs retain lethality over such distances?
Part 3 — MATERIAL: Why is Tantalum increasingly replacing Copper as the premium liner metal for high-end top-attack or off-route mines?`,
    [explosive, liner, standoff, currentExp, currentLiner, slugVelocity, impactVelocity, targetPenetration],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={180} maxWidth={460} />
      
      <PillRow>
        <Pill active={explosive === "compb"} onClick={() => setExplosive("compb")} color={T.orange}>Comp-B</Pill>
        <Pill active={explosive === "tnt"} onClick={() => setExplosive("tnt")} color={T.gold}>TNT</Pill>
        <Pill active={explosive === "hmx"} onClick={() => setExplosive("hmx")} color={T.red}>HMX / PBX</Pill>
      </PillRow>

      <PillRow>
        <Pill active={liner === "cu"} onClick={() => setLiner("cu")} color={T.orange}>Copper</Pill>
        <Pill active={liner === "ta"} onClick={() => setLiner("ta")} color={T.gray}>Tantalum (Ta)</Pill>
        <Pill active={liner === "fe"} onClick={() => setLiner("fe")} color={T.cyan}>Iron</Pill>
      </PillRow>

      <Slider label="Standoff Distance (Charge Diameters)" value={standoff} onChange={setStandoff} min={5} max={150} step={5} unit=" CD" color={T.accent} />
      
      <DataRow>
        <DataBox label="V_launch" value={slugVelocity} unit="m/s" color={T.red} />
        <DataBox label="V_impact" value={impactVelocity} unit="m/s" color={T.orange} />
        <DataBox label="Penetration" value={targetPenetration} unit="mm RHA" color={T.purple} />
        <DataBox label="Stability" value={isEFPStable ? "STABLE" : "TUMBLING"} color={isEFPStable ? T.green : T.red} />
      </DataRow>

      <InfoBox color={T.orange}>
        <strong>Misznay-Schardin effect:</strong> Unlike standard shaped charges that focus a hypervelocity liquid-state jet to pierce armor instantly, an <strong>EFP</strong> uses a very shallow concave liner. The explosive blast completely inverts the liner, forging it into a solid, aerodynamic metallic slug flying at ~2000 m/s. This allows EFPs to strike heavy armor from extreme standoff ranges (e.g., top-attack munitions or IEDs).
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.orange} />
      <ExportBtn simId="efp" getData={() => ({ explosive, liner, standoff, impactVelocity, targetPenetration })} color={T.orange} />
    </div>
  );
}
