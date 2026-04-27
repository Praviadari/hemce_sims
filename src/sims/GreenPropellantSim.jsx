import { useState, useMemo } from "react";
import { useCanvas, T, prng, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export function GreenPropellantSim() {
  const [propellant, setPropellant] = useState("adn_water");
  const [chamberP, setChamberP] = useState(1.5);
  const [preheaterTemp, setPreheaterTemp] = useState(300);

  const propData = {
    adn_water:    { isp: 220, density: 1.24, tFlame: 1900, toxicity: 0, preheatMin: 150, catalyst: "LiAlO₂", color: "#6ee7b7", label: "ADN/Water" },
    han_methanol: { isp: 266, density: 1.42, tFlame: 2100, toxicity: 0, preheatMin: 300, catalyst: "Ir/Al₂O₃", color: "#38bdf8", label: "HAN/Methanol" },
    lmp103s:      { isp: 252, density: 1.24, tFlame: 1700, toxicity: 0, preheatMin: 250, catalyst: "LiAlO₂", color: "#a78bfa", label: "LMP-103S" },
    af_m315e:     { isp: 266, density: 1.47, tFlame: 2160, toxicity: 0, preheatMin: 350, catalyst: "Ir/Al₂O₃", color: "#f472b6", label: "AF-M315E" },
  };
  const pd = propData[propellant];

  const hydrazine = { isp: 230, density: 1.01, toxicity: 100 };

  const actualIsp = Math.round(pd.isp * (0.8 + 0.2 * chamberP / 3.0));
  const rhoIspRatio = ((actualIsp * pd.density) / (hydrazine.isp * hydrazine.density) * 100).toFixed(0);

  const catalystOK = preheaterTemp >= pd.preheatMin;
  const startupDelay = catalystOK ? Math.round(500 / (preheaterTemp - pd.preheatMin + 1)) : "∞";
  const thrust = catalystOK ? (chamberP * 0.8 * pd.density).toFixed(2) : 0;

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cy = (H - 40) / 2; // Leave space for bottom bar

      // Thruster drawing
      // Tank (left)
      const tankX = 20, tankW = 60, tankH = 80;
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.roundRect(tankX, cy - tankH/2, tankW, tankH, 8);
      ctx.fill();
      
      // Tank color
      ctx.fillStyle = pd.color;
      ctx.beginPath();
      ctx.roundRect(tankX + 5, cy - tankH/2 + 5, tankW - 10, tankH - 10, 4);
      ctx.fill();

      // Feed pipe
      ctx.fillStyle = "#475569";
      ctx.fillRect(tankX + tankW, cy - 10, 30, 20);

      // Catalyst Bed
      const catX = tankX + tankW + 30, catW = 70, catH = 50;
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(catX, cy - catH/2, catW, catH, 4);
      ctx.fill();

      // Preheater coil
      const coilColor = preheaterTemp > 400 ? T.red : preheaterTemp > 200 ? T.orange : "#64748b";
      ctx.strokeStyle = coilColor;
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
         ctx.beginPath();
         ctx.moveTo(catX + 10 + i * 12, cy - catH/2 - 2);
         ctx.lineTo(catX + 10 + i * 12 + 6, cy + catH/2 + 2);
         ctx.stroke();
      }

      // Decomposition Chamber
      const chmX = catX + catW, chmW = 60, chmH = 40;
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(chmX, cy - chmH/2, chmW, chmH);

      // Nozzle
      const nozX = chmX + chmW, nozW = 50;
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(nozX, cy - chmH/2);
      ctx.lineTo(nozX + nozW, cy - chmH - 10);
      ctx.lineTo(nozX + nozW, cy + chmH + 10);
      ctx.lineTo(nozX, cy + chmH/2);
      ctx.fill();

      if (!catalystOK) {
        // Red X over catalyst bed
        ctx.strokeStyle = T.red;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(catX + 10, cy - 15); ctx.lineTo(catX + catW - 10, cy + 15);
        ctx.moveTo(catX + 10, cy + 15); ctx.lineTo(catX + catW - 10, cy - 15);
        ctx.stroke();

        ctx.fillStyle = T.red;
        ctx.font = `800 12px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("PREHEAT REQUIRED", catX + catW/2, cy - catH/2 - 15);
      } else {
        // Glowing chamber based on TFlame
        const glow = ctx.createLinearGradient(chmX, 0, chmX + chmW, 0);
        glow.addColorStop(0, "rgba(255,255,255,0.8)");
        glow.addColorStop(1, "rgba(56, 189, 248, 0.4)"); 
        ctx.fillStyle = glow;
        ctx.fillRect(chmX, cy - chmH/2, chmW, chmH);

        // Animated gas flow through catalyst->chamber->nozzle
        ctx.fillStyle = "rgba(167, 243, 208, 0.6)"; // subtle green tint
        for (let i = 0; i < 20; i++) {
           const px = catX + ((frame * 2 + prng(frame, i)*50) % (catW + chmW));
           const py = cy + (prng(frame, i + 1) - 0.5) * (catH - 10);
           ctx.beginPath();
           ctx.arc(px, py, 2 + prng(frame, i+2)*2, 0, Math.PI*2);
           ctx.fill();
        }

        // Exhaust plume
        const exGrad = ctx.createLinearGradient(nozX + nozW, 0, W, 0);
        exGrad.addColorStop(0, "rgba(167, 243, 208, 0.8)");
        exGrad.addColorStop(1, "transparent");
        ctx.fillStyle = exGrad;
        ctx.beginPath();
        ctx.moveTo(nozX + nozW, cy - chmH - 5);
        
        // Wavering plume end
        for (let i=0; i<10; i++) {
           const wy = cy - chmH*1.5 + (i/9) * chmH * 3;
           const wx = W - 20 + Math.sin(frame*0.1 + i) * 10;
           ctx.lineTo(wx, wy); 
        }
        
        ctx.lineTo(nozX + nozW, cy + chmH + 5);
        ctx.fill();
      }

      ctx.textAlign = "left";

      // Comparison bar at bottom
      const barY = H - 30;
      const originX = 120;
      const maxBarW = W - originX - 40;
      const refIsp = hydrazine.isp * hydrazine.density;
      const curIsp = actualIsp * pd.density;
      
      const widthRef = maxBarW * 0.6; // Scale so 60% is hydrazine
      const widthCur = widthRef * (curIsp / refIsp);

      ctx.fillStyle = T.dimText;
      ctx.font = `800 10px monospace`;
      ctx.fillText("Density-Isp:", 10, barY + 12);

      // Hydrazine Bar
      ctx.fillStyle = T.orange;
      ctx.fillRect(originX, barY - 2, widthRef, 10);
      ctx.fillStyle = T.black;
      ctx.font = `800 9px monospace`;
      ctx.fillText("N2H4", originX + 5, barY + 6);

      // Green Prop Bar
      ctx.fillStyle = rhoIspRatio > 100 ? T.green : T.purple;
      ctx.fillRect(originX, barY + 12, widthCur, 10);
      ctx.fillStyle = T.black;
      ctx.fillText(pd.label, originX + 5, barY + 20);

      // 100% Marker Line
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.moveTo(originX + widthRef, barY - 10);
      ctx.lineTo(originX + widthRef, barY + 30);
      ctx.stroke();

    },
    [propellant, chamberP, preheaterTemp, pd, actualIsp, rhoIspRatio, catalystOK],
    { animate: true }
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={200} />

      <PillRow>
        <Pill active={propellant === "adn_water"} onClick={() => setPropellant("adn_water")} color="#6ee7b7">ADN/Water</Pill>
        <Pill active={propellant === "han_methanol"} onClick={() => setPropellant("han_methanol")} color="#38bdf8">HAN/Meth</Pill>
        <Pill active={propellant === "lmp103s"} onClick={() => setPropellant("lmp103s")} color="#a78bfa">LMP-103S</Pill>
        <Pill active={propellant === "af_m315e"} onClick={() => setPropellant("af_m315e")} color="#f472b6">AF-M315E</Pill>
      </PillRow>

      <Slider label="Chamber Pressure" value={chamberP} onChange={setChamberP} min={0.5} max={3.0} step={0.1} unit="MPa" color={T.cyan} />
      <Slider label="Preheater Temp" value={preheaterTemp} onChange={setPreheaterTemp} min={200} max={600} unit="°C" color={T.orange} />

      <DataRow>
        <DataBox label="Isp" value={actualIsp} unit="s" color={T.green} />
        <DataBox label="ρIsp" value={(actualIsp * pd.density).toFixed(0)} unit="kg·s/m³" color={T.purple} />
        <DataBox label="vs Hydrazine" value={rhoIspRatio} unit="%" color={rhoIspRatio > 100 ? T.green : T.orange} />
      </DataRow>
      <DataRow style={{marginTop: 8}}>
        <DataBox label="Thrust" value={thrust} unit="N" color={T.accent} />
        <DataBox label="Startup" value={startupDelay} unit="ms" color={catalystOK ? T.green : T.red} />
        <DataBox label="Toxicity" value="ZERO ✓" unit="" color={T.green} />
      </DataRow>

      <div style={{ fontSize: 10, color: T.dimText, textAlign: "center", marginTop: 8, marginBottom: 8, fontFamily: 'monospace' }}>
        Requires {pd.preheatMin}°C using {pd.catalyst} catalyst.
        {!catalystOK && <strong style={{color: T.red, marginLeft: 8}}>⚠ PREHEAT REQUIRED</strong>}
      </div>

      <InfoBox>
         Green propellants (ADN, HAN) replace toxic hydrazine (N₂H₄) for spacecraft thrusters. LMP-103S powered Sweden&apos;s PRISMA and SkySat satellites. AF-M315E offers 50% higher density-Isp. ISRO is evaluating ADN-based thrusters for future missions. Key challenge: catalyst preheating (300-500°C) for reliable ignition. Paper FA16-P06 at HEMCE 2026 covers catalytic decomposition of ADN.
      </InfoBox>

      <AIInsight
        buildPrompt={() => `Focus domain: green propellant chemistry and low-toxicity thruster systems.
Context: You are evaluating a green thruster using ${pd.label} at ${chamberP} MPa with a preheater set to ${preheaterTemp}°C.
Current thrust: ${thrust}N. Relative density-Isp compared to hydrazine: ${rhoIspRatio}%.
Mention paper FA16-P06 from HEMCE 2026 covering catalytic decomposition of ADN. Analyze the challenges of catalyst preheating for ${pd.catalyst} and how this compares to traditional hydrazine handling.
`}
        color={T.green}
      />
      <ExportBtn simId="greenprop" getData={() => ({ propellant, chamberP, preheaterTemp, thrust, isp: actualIsp })} color={T.green} />
    </div>
  );
}

export default GreenPropellantSim;
