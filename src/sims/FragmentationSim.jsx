import { useState, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function FragmentationSim() {
  const [explosive, setExplosive] = useState("tnt");
  const [casing, setCasing] = useState("steel");
  const [cmRatio, setCmRatio] = useState(1.0);

  const expData = {
    tnt:   { gurney: 2440, label: "TNT", color: "#F6E05E" },
    compb: { gurney: 2700, label: "Comp-B", color: "#F6AD55" },
    hmx:   { gurney: 2900, label: "HMX", color: "#E53E3E" },
    cl20:  { gurney: 3100, label: "CL-20", color: "#9F7AEA" },
  };

  const casingData = {
    steel:    { density: 7.8, label: "Mild Steel", color: "#A0AEC0" },
    tungsten: { density: 17.5, label: "Tungsten Alloy", color: "#4A5568" },
    titanium: { density: 4.5, label: "Titanium", color: "#E2E8F0" },
  };

  const ed = expData[explosive];
  const cd = casingData[casing];

  // Gurney equation for cylinder: V_0 = sqrt(2E) * sqrt( (C/M) / (1 + 0.5 * C/M) )
  const v0 = Math.round(ed.gurney * Math.sqrt(cmRatio / (1 + 0.5 * cmRatio)));

  // Fragment mass estimate based on casing density and C/M ratio
  // Lower C/M ratio -> thicker casing -> heavier fragments
  const avgFragMass = Math.max(0.5, Math.round((2.0 / cmRatio) * (cd.density / 7.8) * 10) / 10); // grams
  
  // Kinetic energy per fragment at launch
  const ke = Math.round(0.5 * (avgFragMass / 1000) * v0 * v0); // Joules (1/2 m v^2)

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;

      // Base radius of the warhead casing
      const R_inner = 30 + (cmRatio > 1.5 ? 15 : cmRatio > 0.8 ? 5 : -5);
      const R_outer = R_inner + (1 / cmRatio) * 12;

      // Draw Unexploded Warhead Reference (Phantom)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, R_outer, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animation calculations
      // Cycle from fully intact -> exploded
      // frame runs roughly at 60fps. Cycle every 120 frames (2 seconds)
      const maxFrames = 120;
      const localFrame = frame % maxFrames;
      
      const t = localFrame < 10 ? 0 : Math.min(1, (localFrame - 10) / 80); // t goes from 0 to 1

      // Flash & Plasma
      if (t > 0 && t < 0.8) {
        const pRadius = R_outer + t * v0 * 0.05;
        const pAlpha = 1 - t;
        const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pRadius);
        flashGrad.addColorStop(0, `rgba(255, 255, 255, ${pAlpha})`);
        flashGrad.addColorStop(0.2, `${ed.color}${Math.round(pAlpha * 255).toString(16).padStart(2, "0")}`);
        flashGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, pRadius, 0, Math.PI * 2);
        ctx.fill();
        
        if (t < 0.2) {
           ctx.fillStyle = `rgba(255, 255, 255, ${1 - t * 5})`;
           ctx.fillRect(0, 0, W, H);
        }
      }

      // Draw Fragments
      const numFrags = Math.round(180 * Math.min(3, cmRatio)); 
      
      ctx.fillStyle = cd.color;
      
      for (let i = 0; i < numFrags; i++) {
        // Deterministic pseudo-randomness based on fragment index
        const angle = (i * 137.5 * Math.PI) / 180; // phyllotaxis spiral distribution
        const offset = Math.sin(i * 10) * 0.3 + 0.7; // slight velocity variance 70% to 100%
        
        // Speed directly proportional to computed V0
        const dist = t === 0 ? R_outer : R_outer + (t * (v0 * 0.08) * offset);
        
        const fx = cx + Math.cos(angle) * dist;
        const fy = cy + Math.sin(angle) * dist;
        
        const fragSize = Math.max(0.5, (avgFragMass * 0.8) + Math.cos(i) * 0.4);
        
        // Fade out slightly when far
        ctx.globalAlpha = t === 0 ? 1 : Math.max(0, 1 - t * 0.5);

        ctx.beginPath();
        // Casing chunks
        if (t === 0) {
            ctx.arc(cx + Math.cos(angle) * ((R_inner + R_outer)/2), cy + Math.sin(angle) * ((R_inner + R_outer)/2), (R_outer - R_inner)/1.8, 0, Math.PI*2);
        } else {
            // Irregular rotating shapes
            ctx.ellipse(fx, fy, fragSize * 1.5, fragSize, angle + localFrame * 0.1 * offset, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Draw Explosive core (when intact)
      if (t === 0) {
        ctx.fillStyle = ed.color;
        ctx.beginPath();
        ctx.arc(cx, cy, R_inner, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = `600 9px ${TECH_FONT}`;
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("EXPLOSIVE", cx, cy);
      }

      // Labels
      ctx.font = `10px ${TECH_FONT}`;
      ctx.fillStyle = T.white;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(`V0: ${v0} m/s`, 10, H - 10);
      
    },
    [explosive, casing, cmRatio, v0, ed, cd, avgFragMass],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Explosive fragmentation warhead simulation (Gurney Equation) — current parameters:
ROLE: "You are an expert in terminal ballistics and detonics. You have deep knowledge of DRDO (TBRL Chandigarh/HEMRL), ISRO, and global terminal ballistics programs."

PARAMETERS (numbered):
1. Explosive Charge: ${ed.label} (Gurney Constant: ${ed.gurney} m/s)
2. Casing Material: ${cd.label} (Density: ${cd.density} g/cc)
3. Charge-to-Mass Ratio (C/M): ${cmRatio.toFixed(2)}
4. Initial Fragment Velocity (V0): ${v0} m/s
5. Est. Fragment Mass: ${avgFragMass} g
6. Kinetic Energy per Fragment: ${ke} Joules

ANALYSIS REQUEST:
Part 1 — TERMINAL BALLISTICS: Analyze this C/M ratio and combination. Is this an effective fragmentation warhead? What target types would this velocity and mass be effective against (e.g., personnel, light armor, aircraft)?
Part 2 — MATERIAL TRADEOFFS: Contrast the selected casing material to steel, highlighting how density impacts kinetic retention at range versus initial V0. We are using ${cd.label}.
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/TBRL fragmentation tests, standard Indian field munitions (like Pinaka warheads or artillery shells), and the push toward CL-20 for high-velocity fragment projection?`,
    [explosive, casing, cmRatio, v0, ed, cd, avgFragMass, ke],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={240} maxWidth={460} />
      
      <PillRow>
        <Pill active={explosive === "tnt"} onClick={() => setExplosive("tnt")} color={T.gold}>TNT</Pill>
        <Pill active={explosive === "compb"} onClick={() => setExplosive("compb")} color={T.orange}>Comp-B</Pill>
        <Pill active={explosive === "hmx"} onClick={() => setExplosive("hmx")} color={T.red}>HMX</Pill>
        <Pill active={explosive === "cl20"} onClick={() => setExplosive("cl20")} color={T.purple}>CL-20</Pill>
      </PillRow>

      <PillRow>
        <Pill active={casing === "steel"} onClick={() => setCasing("steel")} color={T.gray}>Mild Steel</Pill>
        <Pill active={casing === "tungsten"} onClick={() => setCasing("tungsten")} color={T.cyan}>Tungsten Alloy</Pill>
        <Pill active={casing === "titanium"} onClick={() => setCasing("titanium")} color={T.white}>Titanium</Pill>
      </PillRow>

      <Slider label="Charge-to-Mass Ratio (C/M)" value={cmRatio} onChange={setCmRatio} min={0.1} max={3.0} step={0.1} unit="" color={T.accent} />
      
      <DataRow>
        <DataBox label="V0" value={v0} unit="m/s" color={v0 > 2500 ? T.red : v0 > 1500 ? T.orange : T.green} />
        <DataBox label="Mass/Frag" value={avgFragMass.toFixed(1)} unit="g" color={T.cyan} />
        <DataBox label="Frag KE" value={ke} unit="J" color={ke > 4000 ? T.purple : T.gold} />
        <DataBox label="Gurney" value={ed.gurney} unit="m/s" color={T.red} />
      </DataRow>

      <InfoBox color={T.red}>
        The <strong>Gurney Equation</strong> determines the initial velocity (V0) of expanding explosive casing fragments based on the C/M ratio and the specific explosive&apos;s Gurney energy constant. Dense metals like Tungsten launch slower but retain kinetic energy longer for penetrating light armor. DRDO&apos;s TBRL (Chandigarh) extensively models this for the Pinaka rocket warheads.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.red} />
      <ExportBtn simId="fragmentation" getData={() => ({ explosive, casing, cmRatio, v0, avgFragMass, ke })} color={T.red} />
    </div>
  );
}
