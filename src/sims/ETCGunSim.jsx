import { useState, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function ETCGunSim() {
  const [energy, setEnergy] = useState(2.0); // MJ from capacitor
  const [propellant, setPropellant] = useState("m30");
  const [chamberVol, setChamberVol] = useState(0.5);

  const propData = {
    m30:   { label: "M30 Nitroguanidine", sens: 1.0, color: "#F6E05E" },
    m3a1:  { label: "M3A1 Single Base", sens: 0.8, color: "#A0AEC0" },
    ja2:   { label: "JA2 Double Base", sens: 1.2, color: "#E53E3E" },
  };
  
  const current = propData[propellant];

  // Conventional spike vs ETC flattened curve
  // A conventional gun has a sharp pressure peak.
  // ETC allows tailoring the ignition using plasma, generating a flatter curve (more area under curve = higher muzzle velocity without exceeding material yield strength).
  
  const peakPConv = 400 + (1/chamberVol) * 100 * current.sens; // MPa
  const peakPETC = peakPConv * 0.75 + energy * 20; // Lower peak + plasma boost
  
  // Muzzle velocity estimate (integral of P dV scaling)
  const mvConv = Math.round(Math.sqrt(peakPConv * 1500));
  const mvETC = Math.round(Math.sqrt(peakPETC * 2000 * (1 + energy * 0.1))); // ETC provides more sustained push

  const pressureYieldLimit = 600; // MPa for the barrel
  const isDanger = peakPETC > pressureYieldLimit;

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const t = (frame * 0.05) % Math.PI; // Pulse cycle

      // Draw Gun Chamber & Barrel
      ctx.strokeStyle = "#4A5568";
      ctx.lineWidth = 6;
      ctx.beginPath();
      // Chamber
      ctx.moveTo(cx - 100, H/2 - 20);
      ctx.lineTo(cx - 30, H/2 - 20);
      ctx.lineTo(cx - 20, H/2 - 10);
      // Barrel
      ctx.lineTo(cx + 100, H/2 - 10);
      
      ctx.moveTo(cx - 100, H/2 + 20);
      ctx.lineTo(cx - 30, H/2 + 20);
      ctx.lineTo(cx - 20, H/2 + 10);
      ctx.lineTo(cx + 100, H/2 + 10);
      ctx.stroke();

      // Casing back end
      ctx.fillStyle = "#A0AEC0";
      ctx.fillRect(cx - 110, H/2 - 25, 10, 50);

      // Capacitor / Pulse forming network wires
      ctx.strokeStyle = T.purple;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 120, H/2);
      ctx.lineTo(cx - 105, H/2);
      ctx.stroke();

      // Shot Cycle Animation
      const phase = t / Math.PI; // 0 to 1
      
      if (phase > 0.1 && phase < 0.8) {
          // Inner Plasma Injection (Capacitor discharge)
          const pAlpha = Math.sin((phase - 0.1) * Math.PI / 0.7);
          ctx.fillStyle = `rgba(159, 122, 234, ${pAlpha * energy * 0.1})`;
          ctx.beginPath();
          ctx.moveTo(cx - 100, H/2);
          ctx.lineTo(cx - 30, H/2 - 15);
          ctx.lineTo(cx - 30, H/2 + 15);
          ctx.fill();

          // Lightning bolts inside capillary
          ctx.strokeStyle = T.cyan;
          ctx.lineWidth = 1;
          for(let i=0; i<3; i++) {
             ctx.beginPath();
             ctx.moveTo(cx - 100, H/2);
             ctx.lineTo(cx - 65, H/2 + (Math.random()-0.5)*20);
             ctx.lineTo(cx - 30, H/2 + (Math.random()-0.5)*20);
             ctx.stroke();
          }

          // Bullet moving down barrel
          const bx = cx - 20 + phase * 150;
          ctx.fillStyle = "#ED8936"; // copper jacket
          ctx.beginPath();
          ctx.moveTo(bx, H/2 - 8);
          ctx.lineTo(bx + 15, H/2 - 8);
          ctx.lineTo(bx + 25, H/2);
          ctx.lineTo(bx + 15, H/2 + 8);
          ctx.lineTo(bx, H/2 + 8);
          ctx.fill();

          // Combustion Gas trailing bullet
          ctx.fillStyle = isDanger ? `rgba(229, 62, 62, ${pAlpha * 0.8})` : `rgba(237, 137, 54, ${pAlpha * 0.8})`;
          ctx.fillRect(cx - 30, H/2 - 8, bx - (cx - 30), 16);
      }

      // Pressure Graph HUD overlay (Bottom Right)
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      const gX = W - 140, gY = 20, gW = 120, gH = 80;
      ctx.strokeRect(gX, gY, gW, gH);
      
      // Yield Line
      const yY = gY + gH - (pressureYieldLimit / 1000) * gH;
      ctx.strokeStyle = T.red;
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(gX, yY); ctx.lineTo(gX+gW, yY); ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw Curves
      const steps = 40;
      
      // Conventional Curve (Spikey)
      ctx.strokeStyle = T.dimText;
      ctx.beginPath();
      for (let i=0; i<=steps; i++) {
         const xt = i / steps;
         const p = peakPConv * Math.pow(xt, 2) * Math.exp(-xt * 5); // Rough Rayleigh shape
         const py = gY + gH - (p * 4.5 / 1000) * gH;
         i===0 ? ctx.moveTo(gX, py) : ctx.lineTo(gX + xt*gW, py);
      }
      ctx.stroke();

      // ETC Curve (Flatter, sustained)
      ctx.strokeStyle = isDanger ? T.red : T.purple;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i=0; i<=steps; i++) {
         const xt = i / steps;
         // Plasma inject delay smooths curve
         const p = peakPETC * (xt * 8) * Math.exp(-xt * 3); 
         const py = Math.min(gY+gH, Math.max(gY, gY + gH - (p / 1000) * gH));
         i===0 ? ctx.moveTo(gX, py) : ctx.lineTo(gX + xt*gW, py);
      }
      ctx.stroke();

      ctx.fillStyle = T.white;
      ctx.font = `8px ${TECH_FONT}`;
      ctx.fillText("TIME →", gX + gW/2 - 10, gY + gH + 10);
      ctx.fillText("PRESS", gX - 25, gY + gH/2);

      // Warning text
      if (isDanger) {
         ctx.fillStyle = T.red;
         ctx.font = `bold 12px ${TECH_FONT}`;
         ctx.fillText("⚠ BARREL YIELD EXCEEDED", cx - 80, 20);
      }

    },
    [energy, propellant, chamberVol, current, isDanger, peakPConv, peakPETC],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Electrothermal-Chemical (ETC) gun simulation — current parameters:
ROLE: "You are a ballistician specializing in plasma-augmented propulsion and ETC guns. You understand ARDE (DRDO) artillery programs."

PARAMETERS:
1. Propellant Base: ${current.label}
2. Chamber Volume: ${chamberVol} L
3. Pulse Forming Network (Plasma) Energy: ${energy} MJ
4. Peak Pressure (Conv): ${peakPConv.toFixed(1)} MPa
5. Peak Pressure (ETC): ${peakPETC.toFixed(1)} MPa
6. Yield Limit: ${pressureYieldLimit} MPa
7. Status: ${isDanger ? "CATASTROPHIC FAILURE" : "SAFE"}

ANALYSIS REQUEST:
Part 1 — BALLISTICS: How does injecting ${energy}MJ of electrical power via capillary plasma alter the combustion curve to flatten the pressure profile? 
Part 2 — VELOCITY: This flat curve generates more area under the integral. What are the theoretical muzzle velocity gains limits for APFSDS rounds?
Part 3 — INDIA/DRDO: ARDE Pune has researched ETC technology for tank guns. Discuss the logistical difficulties of placing multimegawatt capacitor banks in MBTs.`,
    [energy, current, chamberVol, peakPConv, peakPETC, isDanger],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={160} maxWidth={460} />
      
      <PillRow>
        <Pill active={propellant === "m30"} onClick={() => setPropellant("m30")} color={T.gold}>M30</Pill>
        <Pill active={propellant === "m3a1"} onClick={() => setPropellant("m3a1")} color={T.gray}>M3A1</Pill>
        <Pill active={propellant === "ja2"} onClick={() => setPropellant("ja2")} color={T.red}>JA2 Db-Base</Pill>
      </PillRow>

      <Slider label="Capacitor Plasma Energy" value={energy} onChange={setEnergy} min={0.5} max={8.0} step={0.5} unit=" MJ" color={T.purple} />
      <Slider label="Chamber Volume" value={chamberVol} onChange={setChamberVol} min={0.2} max={1.0} step={0.1} unit=" L" color={T.cyan} />
      
      <DataRow>
        <DataBox label="Peak (Conv)" value={peakPConv.toFixed(0)} unit="MPa" color={T.gray} />
        <DataBox label="Peak (ETC)" value={peakPETC.toFixed(0)} unit="MPa" color={isDanger ? T.red : T.purple} />
        <DataBox label="V_muz (Conv)" value={mvConv} unit="m/s" color={T.gray} />
        <DataBox label="V_muz (ETC)" value={mvETC} unit="m/s" color={T.accent} />
      </DataRow>

      <InfoBox color={T.purple}>
        <strong>Electrothermal-Chemical (ETC) Guns</strong> replace pyrotechnic primers with a high-voltage plasma cartridge. The 10,000K plasma ignites the propellant simultaneously across the bed, flattening the pressure-time curve. This allows higher muzzle velocities without exceeding the steel barrel&apos;s maximum yield pressure (unlike conventional spikes). ARDE performs advanced research in this domain.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.purple} />
      <ExportBtn simId="etcgun" getData={() => ({ propellant, energy, chamberVol, peakPETC, mvETC })} color={T.purple} />
    </div>
  );
}
