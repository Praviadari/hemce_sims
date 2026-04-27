import { useState, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function LiquidBiPropellantSim() {
  const [propellant, setPropellant] = useState("lox_kero");
  const [chamberP, setChamberP] = useState(10);
  const [ofRatio, setOfRatio] = useState(2.5);

  const pd = {
    lox_kero:  { opt: 2.56, tComb: 3600, ispMax: 310, color1: T.cyan, color2: T.orange, label: "LOX/Kerosene", env: "cryo" },
    lox_lh2:   { opt: 6.00, tComb: 3400, ispMax: 450, color1: T.cyan, color2: T.white, label: "LOX/LH₂", env: "cryo" },
    n2o4_mmh:  { opt: 2.16, tComb: 3200, ispMax: 320, color1: T.red, color2: T.purple, label: "N₂O₄/MMH", env: "storable" },
    udmh_n2o4: { opt: 2.60, tComb: 3300, ispMax: 310, color1: T.pink, color2: T.red, label: "N₂O₄/UDMH", env: "storable" },
  };

  const current = pd[propellant];
  
  // Calculate efficiency drop-off based on O/F offset
  const ratioDelta = Math.abs(current.opt - ofRatio) / current.opt;
  const offDesignPenalty = Math.max(0.6, 1 - ratioDelta * 0.8);
  
  // Chamber pressure scaling (roughly logarithmic increase in Isp with pressure)
  const pPenalty = Math.log10(chamberP / 1); // rough scaling factor
  
  const isp = Math.round(current.ispMax * offDesignPenalty * (0.8 + 0.2 * Math.min(1, pPenalty)));
  const tActual = Math.round(current.tComb * offDesignPenalty);
  const thrustEstimate = Math.round(chamberP * 15 * (isp / 300)); // nominal kN

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const t = frame * 0.05;

      // Rocket Engine Contour
      ctx.strokeStyle = "#4A5568";
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Left wall
      ctx.moveTo(cx - 30, 20);
      ctx.lineTo(cx - 30, 80);
      ctx.quadraticCurveTo(cx - 30, 110, cx - 10, 110);
      ctx.lineTo(cx - 10, 130);
      ctx.quadraticCurveTo(cx - 30, 170, cx - 40, 200);
      // Right wall
      ctx.moveTo(cx + 30, 20);
      ctx.lineTo(cx + 30, 80);
      ctx.quadraticCurveTo(cx + 30, 110, cx + 10, 110);
      ctx.lineTo(cx + 10, 130);
      ctx.quadraticCurveTo(cx + 30, 170, cx + 40, 200);
      ctx.stroke();

      // Injectors
      ctx.fillStyle = "#A0AEC0";
      ctx.fillRect(cx - 32, 10, 64, 10);
      
      // Injector Spray (Fuel & Oxidizer mixing)
      ctx.globalAlpha = 0.6;
      for(let i=0; i<15; i++) {
         const dropX = cx - 25 + (i * 50 / 14);
         const isFuel = i % 2 === 0;
         const dropY = 20 + ((t * 100 + i * 15) % 60);
         
         ctx.fillStyle = isFuel ? current.color2 : current.color1;
         ctx.beginPath();
         ctx.arc(dropX, dropY, 1.5, 0, Math.PI*2);
         ctx.fill();
         
         // Vapor trails before mixing
         ctx.fillRect(dropX - 0.5, 20, 1, dropY - 20);
      }
      ctx.globalAlpha = 1.0;

      // Combustion Plasma
      const mixZone = 50 + Math.sin(t) * 10;
      const plasmaGrad = ctx.createLinearGradient(cx, mixZone, cx, 200);
      
      if (offDesignPenalty > 0.8) {
          plasmaGrad.addColorStop(0, T.white);
          plasmaGrad.addColorStop(0.2, T.cyan); 
          plasmaGrad.addColorStop(1, T.accent);
      } else {
          // Inefficient orange/sooty burn
          plasmaGrad.addColorStop(0, T.gold);
          plasmaGrad.addColorStop(0.5, T.orange);
          plasmaGrad.addColorStop(1, T.red);
      }

      ctx.fillStyle = plasmaGrad;
      ctx.beginPath();
      ctx.moveTo(cx - 28, mixZone);
      ctx.quadraticCurveTo(cx - 28, 110, cx - 8, 110);
      ctx.lineTo(cx - 8, 130);
      ctx.quadraticCurveTo(cx - 28, 170, cx - 38, 200);
      ctx.lineTo(cx + 38, 200);
      ctx.quadraticCurveTo(cx + 28, 170, cx + 8, 130);
      ctx.lineTo(cx + 8, 110);
      ctx.quadraticCurveTo(cx + 28, 110, cx + 28, mixZone);
      ctx.fill();

      // Mach Diamonds in plume
      if (chamberP > 5 && offDesignPenalty > 0.8) {
         ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
         for(let i=0; i<3; i++) {
             const dy = 220 + i * 30 - ((t * 20) % 30);
             if (dy < 250) {
                ctx.beginPath();
                ctx.moveTo(cx, dy);
                ctx.lineTo(cx - 15 + i*2, dy + 15);
                ctx.lineTo(cx, dy + 30);
                ctx.lineTo(cx + 15 - i*2, dy + 15);
                ctx.fill();
             }
         }
      }

      // HUD Text
      ctx.font = `800 10px ${TECH_FONT}`;
      ctx.fillStyle = T.white;
      ctx.fillText(`T: ${tActual}K`, cx + 45, 60);
      ctx.fillText(`P_c: ${chamberP} MPa`, cx + 45, 75);
      
      // Injector labels
      ctx.font = `9px ${TECH_FONT}`;
      ctx.fillStyle = current.color1;
      ctx.fillText("OX", cx - 45, 15);
      ctx.fillStyle = current.color2;
      ctx.fillText("FL", cx + 35, 15);
      
    },
    [propellant, chamberP, ofRatio, current, offDesignPenalty, tActual],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Liquid rocket bipropellant analysis — current parameters:
ROLE: "You are an expert in liquid propulsion systems. You know DRDO, ISRO (LPSC), and advanced engine programs."

PARAMETERS:
1. Propellant mix: ${current.label} (${current.env === "cryo" ? "Cryogenic" : "Hypergolic Storable"})
2. Chamber Pressure: ${chamberP} MPa
3. O/F Ratio: ${ofRatio.toFixed(2)} (Optimal: ${current.opt.toFixed(2)})
4. Computed Isp: ${isp} s
5. Gas Temp: ${tActual} K
6. Est. Thrust Scale: ${thrustEstimate} kN

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze the efficiency drop-off given the O/F ratio vs optimum. 
Part 2 — APPLICATION: Discuss exactly where ISRO or DRDO uses this specific propellant mix (e.g., PSLV PS4, GSLV Vikas, SCE-200, Missiles).
Part 3 — THERMAL: How challenging is cooling at ${tActual}K for this specific propellant?`,
    [propellant, chamberP, ofRatio, current, isp, tActual, thrustEstimate],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={260} maxWidth={460} />
      
      <PillRow>
        <Pill active={propellant === "lox_kero"} onClick={() => setPropellant("lox_kero")} color={T.accent}>LOX/Kerosene</Pill>
        <Pill active={propellant === "lox_lh2"} onClick={() => setPropellant("lox_lh2")} color={T.cyan}>LOX/LH₂</Pill>
        <Pill active={propellant === "n2o4_mmh"} onClick={() => setPropellant("n2o4_mmh")} color={T.purple}>N₂O₄/MMH</Pill>
        <Pill active={propellant === "udmh_n2o4"} onClick={() => setPropellant("udmh_n2o4")} color={T.pink}>N₂O₄/UDMH</Pill>
      </PillRow>

      <Slider label="Chamber Pressure (Pc)" value={chamberP} onChange={setChamberP} min={1} max={25} step={0.5} unit=" MPa" color={T.accent} />
      <Slider label="O/F Ratio (Oxidizer:Fuel mass)" value={ofRatio} onChange={setOfRatio} min={1.0} max={8.0} step={0.1} unit="" color={T.orange} />
      
      <DataRow>
        <DataBox label="Isp" value={isp} unit="s" color={isp > current.ispMax * 0.9 ? T.green : T.orange} />
        <DataBox label="T_comb" value={tActual} unit="K" color={T.red} />
        <DataBox label="Thrust" value={thrustEstimate} unit="kN" color={T.gold} />
        <DataBox label="O/F Opt" value={current.opt} unit="" color={T.cyan} />
      </DataRow>

      <InfoBox color={T.cyan}>
        <strong>{current.env === "cryo" ? "Cryogenic" : "Storable"} Liquid Propulsion:</strong> ISRO&apos;s Vikas engine operates on N₂O₄/UDMH (~5.8 MPa), while modern semi-cryo engines like SCE-200 run LOX/Kerosene at extremely high pressures (18 MPa) using staged combustion. Running off-optimal O/F drastically reduces combustion efficiency and specific impulse (Isp).
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="liquidbiprop" getData={() => ({ propellant, chamberP, ofRatio, isp, tActual })} color={T.cyan} />
    </div>
  );
}
