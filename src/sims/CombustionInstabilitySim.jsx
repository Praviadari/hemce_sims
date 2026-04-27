import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import {
  Pill,
  Slider,
  DataBox,
  InfoBox,
  PillRow,
  DataRow,
  SimCanvas,
  AIInsight,
  ExportBtn,
} from "../components";

export default function CombustionInstabilitySim() {
  const [motorLength, setMotorLength] = useState(1.5);
  const [motorDia, setMotorDia] = useState(0.5);
  const [chamberP, setChamberP] = useState(8);
  const [propellant, setPropellant] = useState("htpb_ap");
  const [dampingMethod, setDampingMethod] = useState("none");

  const speedOfSound = 1000 + chamberP * 30;
  const f1L = speedOfSound / (2 * motorLength);
  const f2L = 2 * f1L;
  const f1T = 1.84 * speedOfSound / (Math.PI * motorDia);

  const nIndex = { htpb_ap_al: 0.35, htpb_ap: 0.45, db: 0.55 }[propellant];
  const responseFunc = nIndex / (1 - nIndex);
  const dampFactor = { none: 1.0, baffles: 0.4, acoustic_liner: 0.3, resonance_rod: 0.5 }[dampingMethod];

  const gain = responseFunc * (1 + chamberP * 0.02);
  const loss = (1 / (motorLength * motorDia)) * 0.5 / dampFactor;
  const stabilityMargin = ((loss - gain) / loss * 100);
  
  const oscAmplitude = stabilityMargin < 0 ? Math.min(30, Math.abs(stabilityMargin) * 0.5) : 0;

  const riskLevel = stabilityMargin > 20 ? "STABLE" : stabilityMargin > 0 ? "MARGINAL" : "UNSTABLE";
  const riskColor = stabilityMargin > 20 ? T.green : stabilityMargin > 0 ? T.orange : T.red;

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const topH = H * 0.6;
      const botH = H * 0.4;

      const mPadL = 20, mPadR = 40;
      const mW = W - mPadL - mPadR;
      const mH = Math.max(20, Math.min(topH - 20, motorDia * 40));
      const mY = (topH - mH) / 2;

      ctx.strokeStyle = T.dimText;
      ctx.lineWidth = 2;
      ctx.strokeRect(mPadL, mY, mW, mH);

      const pColor = { htpb_ap_al: "#8B8B83", htpb_ap: "#A0522D", db: "#CD853F" }[propellant];
      
      ctx.fillStyle = pColor;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(mPadL, mY, mW, mH * 0.3);
      ctx.fillRect(mPadL, mY + mH * 0.7, mW, mH * 0.3);
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.moveTo(mPadL + mW, mY);
      ctx.lineTo(mPadL + mW + 20, mY - 10);
      ctx.lineTo(mPadL + mW + 20, mY + mH + 10);
      ctx.lineTo(mPadL + mW, mY + mH);
      ctx.fillStyle = "#333";
      ctx.fill();

      ctx.strokeStyle = T.cyan;
      ctx.lineWidth = 2;
      if (dampingMethod === "baffles") {
        const x1 = mPadL + mW * 0.33;
        const x2 = mPadL + mW * 0.67;
        ctx.beginPath();
        ctx.moveTo(x1, mY); ctx.lineTo(x1, mY + mH * 0.45);
        ctx.moveTo(x2, mY); ctx.lineTo(x2, mY + mH * 0.45);
        ctx.moveTo(x1, mY + mH); ctx.lineTo(x1, mY + mH * 0.55);
        ctx.moveTo(x2, mY + mH); ctx.lineTo(x2, mY + mH * 0.55);
        ctx.stroke();
      } else if (dampingMethod === "acoustic_liner") {
        ctx.strokeStyle = `${T.cyan}80`;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(mPadL + 2, mY + 2, mW - 4, mH - 4);
        ctx.setLineDash([]);
      } else if (dampingMethod === "resonance_rod") {
        ctx.fillStyle = T.cyan;
        ctx.fillRect(mPadL, mY + mH * 0.45, mW * 0.8, mH * 0.1);
      }

      const timeSec = frame * 0.016; 
      const displayAmp = stabilityMargin > 0 ? Math.max(1, 10 * Math.exp(-timeSec * 0.5)) : (5 + oscAmplitude * Math.min(1, timeSec * 0.5) * 0.5);
      
      const boreY = mY + mH * 0.5;
      
      ctx.beginPath();
      ctx.strokeStyle = riskColor;
      ctx.lineWidth = stabilityMargin < 0 ? 2 : 1;
      for(let x = 0; x <= mW; x += 2) {
        const phase = (x / mW) * Math.PI;
        const waveY = boreY + Math.sin(phase) * Math.cos(timeSec * 10) * displayAmp;
        x === 0 ? ctx.moveTo(mPadL + x, waveY) : ctx.lineTo(mPadL + x, waveY);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `${riskColor}50`;
      ctx.lineWidth = 1;
      for(let x = 0; x <= mW; x += 2) {
        const phase = (x / mW) * Math.PI * 2;
        const waveY = boreY + Math.sin(phase) * Math.cos(timeSec * 20) * (displayAmp * 0.5);
        x === 0 ? ctx.moveTo(mPadL + x, waveY) : ctx.lineTo(mPadL + x, waveY);
      }
      ctx.stroke();

      const stripY = topH;
      ctx.fillStyle = `${theme.canvasSurface}`;
      ctx.fillRect(0, stripY, W, botH);
      ctx.strokeStyle = `rgba(255,255,255,0.1)`;
      ctx.beginPath();
      ctx.moveTo(0, stripY);
      ctx.lineTo(W, stripY);
      ctx.stroke();

      ctx.fillStyle = T.dimText;
      ctx.font = `600 7px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText("GAIN (red) vs LOSS (green) vs FREQUENCY", 5, stripY + 12);
      
      const maxF = f1T * 1.2;
      const pad = 15;
      const bW = W - pad * 2;
      const bH = botH - 20;
      const bY = stripY + 15;

      const normG = Math.max(0, gain * 20);
      const normL = Math.max(0, loss * 20);

      ctx.fillStyle = gain > loss ? `${T.red}20` : `${T.green}20`;
      ctx.fillRect(pad, bY, bW, bH);

      ctx.beginPath(); ctx.strokeStyle = T.red; ctx.lineWidth = 2;
      ctx.moveTo(pad, Math.max(bY, bY + bH - normG - 5));
      ctx.lineTo(pad + bW, Math.max(bY, bY + bH - normG * 0.5 - 5));
      ctx.stroke();

      ctx.beginPath(); ctx.strokeStyle = T.green; ctx.lineWidth = 2;
      ctx.moveTo(pad, Math.max(bY, bY + bH - normL));
      ctx.lineTo(pad + bW, Math.max(bY, bY + bH - normL));
      ctx.stroke();

      const markFreq = (f, col, lbl) => {
        if(f > maxF) return;
        const px = pad + (f / maxF) * bW;
        ctx.strokeStyle = col;
        ctx.setLineDash([2, 5]);
        ctx.beginPath();
        ctx.moveTo(px, bY);
        ctx.lineTo(px, bY + bH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = col;
        ctx.textAlign = "center";
        ctx.font = `800 8px ${MONO_FONT}`;
        ctx.fillText(lbl, px, bY + bH + 8);
      };

      markFreq(f1L, T.cyan, "f1L");
      markFreq(f2L, `${T.cyan}80`, "f2L");
      markFreq(f1T, T.purple, "f1T");

    },
    [motorLength, motorDia, chamberP, propellant, dampingMethod, f1L, f2L, f1T, gain, loss, stabilityMargin, oscAmplitude, riskColor],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Solid rocket motor combustion instability and acoustic stability analysis — current parameters:
ROLE: "You are an expert in solid propulsion and acoustic instability analysis. You have deep knowledge of DRDO, HEMRL, and ISRO programs."

PARAMETERS (numbered):
1. Motor length: ${motorLength} m
2. Motor diameter: ${motorDia} m
3. Chamber pressure: ${chamberP} MPa
4. Propellant type: ${propellant.toUpperCase()} (burn rate exponent n=${nIndex})
5. Damping method: ${dampingMethod.toUpperCase()}
6. First longitudinal mode (f1L): ${f1L.toFixed(0)} Hz
7. First tangential mode (f1T): ${f1T.toFixed(0)} Hz
8. Calculated Stability Margin: ${stabilityMargin.toFixed(1)}%
9. Oscillation Amplitude Prediction: ${oscAmplitude > 0 ? oscAmplitude.toFixed(1) + "% of Pc" : "Stable (0%)"}

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL/ISRO programs? Reference specific Indian systems (e.g., Agni, PSLV, GSLV, Pinaka, SMART, Astra) where applicable. What are India's current capabilities and gaps in this domain?`,
    [motorLength, motorDia, chamberP, propellant, nIndex, dampingMethod, f1L, f1T, stabilityMargin, oscAmplitude],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={420} height={200} maxWidth={420} />
      <PillRow>
        <Pill active={propellant === "htpb_ap_al"} onClick={() => setPropellant("htpb_ap_al")} color={T.accent}>HTPB/AP/Al</Pill>
        <Pill active={propellant === "htpb_ap"} onClick={() => setPropellant("htpb_ap")} color={T.orange}>HTPB/AP</Pill>
        <Pill active={propellant === "db"} onClick={() => setPropellant("db")} color={T.gold}>Double-Base</Pill>
      </PillRow>
      <PillRow>
        <Pill active={dampingMethod === "none"} onClick={() => setDampingMethod("none")} color={T.red}>No Damping</Pill>
        <Pill active={dampingMethod === "baffles"} onClick={() => setDampingMethod("baffles")} color={T.cyan}>Baffles</Pill>
        <Pill active={dampingMethod === "acoustic_liner"} onClick={() => setDampingMethod("acoustic_liner")} color={T.green}>Acoustic Liner</Pill>
        <Pill active={dampingMethod === "resonance_rod"} onClick={() => setDampingMethod("resonance_rod")} color={T.purple}>Resonance Rod</Pill>
      </PillRow>
      <Slider label="Motor Length" value={motorLength} onChange={setMotorLength} min={0.5} max={3.0} step={0.1} unit=" m" color={T.orange} />
      <Slider label="Motor Diameter" value={motorDia} onChange={setMotorDia} min={0.2} max={1.0} step={0.05} unit=" m" color={T.gold} />
      <Slider label="Chamber Pressure" value={chamberP} onChange={setChamberP} min={3} max={15} step={0.5} unit=" MPa" color={T.red} />
      
      <DataRow>
        <DataBox label="f1L" value={f1L.toFixed(0)} unit="Hz" color={T.cyan} />
        <DataBox label="f1T" value={f1T.toFixed(0)} unit="Hz" color={T.purple} />
        <DataBox label="Margin" value={stabilityMargin.toFixed(0)} unit="%" color={riskColor} />
        <DataBox label="Osc." value={oscAmplitude.toFixed(1)} unit="%" color={riskColor} />
        <DataBox label="n" value={nIndex} unit="" color={T.gold} />
      </DataRow>
      
      <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: riskColor, fontFamily: TECH_FONT, marginTop: 10 }}>
        {riskLevel === "UNSTABLE" ? "⚠ COMBUSTION INSTABILITY PREDICTED" :
         riskLevel === "MARGINAL" ? "⚡ MARGINAL STABILITY — ADD DAMPING" :
         "✓ MOTOR IS STABLE"}
      </div>

      <InfoBox>
        Combustion instability occurs when acoustic modes couple with pressure-dependent burn rate (Pc^n). The burn rate exponent &apos;n&apos; is critical — higher n means stronger coupling. Session 5A (HEMCE 2026) covers mitigation strategies including baffles, acoustic liners, and inert particle damping. ISRO&apos;s PSLV and Agni motors use baffles for longitudinal mode suppression.
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.orange} />
      <ExportBtn
        simId="instability"
        getData={() => ({ motorLength, motorDia, chamberP, propellant, dampingMethod, f1L, f1T, stabilityMargin, oscAmplitude })}
        color={T.orange}
      />
    </div>
  );
}
