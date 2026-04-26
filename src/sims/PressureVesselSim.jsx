import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";


export default function PressureVesselSim() {
  const [pressure, setPressure] = useState(5);
  const [thickness, setThickness] = useState(8);
  const [radius, setRadius] = useState(200);
  const [mat, setMat] = useState("steel");

  const ys = { steel: 700, aluminium: 280, composite: 450 }[mat];
  const hoop = (pressure * radius) / thickness;
  const axial = hoop / 2;
  const fos = ys / hoop;
  const burst = ((ys * thickness) / radius).toFixed(1);
  const safe = fos >= 1.5;
  const warn = fos >= 1 && fos < 1.5;
  const wallColor = hoop > ys ? T.red : hoop > ys * 0.67 ? T.gold : T.green;

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const cx = W / 2,
        cy = H / 2,
        p = pressure;
      const canvasTheme = getCanvasTheme();

      // Deep technical background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W / 2);
      bg.addColorStop(0, canvasTheme.bgStart);
      bg.addColorStop(1, canvasTheme.bgEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const dr = 65,
        ww = Math.max(4, thickness * 0.7);

      // Internal Stress Heatmap (Glow)
      const stressP = Math.min(1.5, hoop / ys);
      const heatGrad = ctx.createRadialGradient(cx, cy, dr - ww, cx, cy, dr + ww);
      heatGrad.addColorStop(0, "transparent");
      heatGrad.addColorStop(0.5, stressP > 1.0 ? T.red : stressP > 0.7 ? T.orange : T.green);
      heatGrad.addColorStop(1, "transparent");

      ctx.globalAlpha = 0.3 * stressP;
      ctx.fillStyle = heatGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, dr + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Composite Winding Pattern / Vessel Structure
      ctx.strokeStyle = wallColor;
      ctx.lineWidth = ww;
      ctx.beginPath();
      ctx.arc(cx, cy, dr, 0, Math.PI * 2);
      ctx.stroke();

      // Fiber Winding details
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (dr - ww / 2), cy + Math.sin(a) * (dr - ww / 2));
        ctx.lineTo(cx + Math.cos(a + 0.4) * (dr + ww / 2), cy + Math.sin(a + 0.4) * (dr + ww / 2));
        ctx.stroke();
      }

      // Internal Pressure Vectors (Pulse)
      const pulse = Math.sin(performance.now() / 200) * 0.2 + 0.8;
      const pn = Math.min(pressure / 20, 1);
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2,
          len = 10 + pn * 15 * pulse;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (dr - ww / 2 - 2), cy + Math.sin(a) * (dr - ww / 2 - 2));
        ctx.lineTo(cx + Math.cos(a) * (dr - ww / 2 - 2 - len), cy + Math.sin(a) * (dr - ww / 2 - 2 - len));
        ctx.stroke();
      }

      // Safety Valve Venting (Particle Effect)
      if (stressP > 1.0) {
        ctx.fillStyle = T.white;
        for (let i = 0; i < 5; i++) {
          const vx = cx + prng(frame, i * 2) * 10 - 5;
          const vy = cy - dr - ww - prng(frame, i * 2 + 1) * 30;
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          ctx.arc(vx, vy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.font = `900 8px ${MONO_FONT}`;
        ctx.fillStyle = T.red;
        ctx.fillText("VALVE VENTING", cx + dr, cy - dr - 10);
      }

      // Labels & HUD
      ctx.font = `900 10px ${TECH_FONT}`;
      ctx.fillStyle = T.accent;
      ctx.textAlign = "center";
      ctx.fillText("UNIT: PRESSURE VESSEL", cx, cy + 4);

      // Indicators for Hoop Stress
      ctx.strokeStyle = T.orange;
      ctx.lineWidth = 2;
      const startA = -0.2,
        endA = 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, dr + ww + 10, startA, endA);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, dr + ww + 10, startA + Math.PI, endA + Math.PI);
      ctx.stroke();

      ctx.font = `bold 9px ${MONO_FONT}`;
      ctx.fillStyle = T.orange;
      ctx.fillText("STR: HOOP", cx + dr + 35, cy);

      ctx.fillStyle = wallColor;
      ctx.font = `900 11px ${TECH_FONT}`;
      ctx.fillText(safe ? "STATUS: STABLE" : warn ? "STATUS: MARGINAL" : "STATUS: CRITICAL", cx, H - 15);
      ctx.textAlign = "left";
    },
    [pressure, thickness, radius, mat, hoop, ys, fos],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Pressure vessel structural integrity simulation — current parameters:
ROLE: "You are an expert in structural safety. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Material: ${mat}
2. Yield strength: ${ys} MPa
3. Internal pressure: ${pressure} MPa
4. Wall thickness: ${thickness} mm
5. Inner radius: ${radius} mm
6. Hoop stress (σ_h): ${hoop.toFixed(0)} MPa
7. Axial stress: ${axial.toFixed(0)} MPa
8. Factor of Safety: ${fos.toFixed(2)}
9. Burst pressure: ${burst} MPa
10. Status: ${!safe && !warn ? "YIELDED" : warn ? "CAUTION" : "SAFE"}

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash) where applicable. What are India's current capabilities and gaps in this domain?`,
    [mat, ys, pressure, thickness, radius, hoop, axial, fos, burst, safe, warn],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />
      <PillRow>
        <Pill active={mat === "steel"} onClick={() => setMat("steel")}>
          Steel 700MPa
        </Pill>
        <Pill active={mat === "aluminium"} onClick={() => setMat("aluminium")} color={T.gold}>
          Al 280MPa
        </Pill>
        <Pill active={mat === "composite"} onClick={() => setMat("composite")} color={T.green}>
          CFRP 450MPa
        </Pill>
      </PillRow>
      <Slider
        label="Internal Pressure"
        value={pressure}
        onChange={setPressure}
        min={1}
        max={25}
        step={0.5}
        unit=" MPa"
        color={T.accent}
      />
      <Slider
        label="Wall Thickness"
        value={thickness}
        onChange={setThickness}
        min={2}
        max={30}
        step={0.5}
        unit=" mm"
        color={T.orange}
      />
      <Slider
        label="Inner Radius"
        value={radius}
        onChange={setRadius}
        min={50}
        max={500}
        step={10}
        unit=" mm"
        color={T.gold}
      />
      <DataRow>
        <DataBox label="Hoop σ" value={hoop.toFixed(0)} unit="MPa" color={hoop > ys ? T.red : T.orange} />
        <DataBox label="Axial σ" value={axial.toFixed(0)} unit="MPa" color={T.accent} />
        <DataBox label="FoS" value={fos.toFixed(1)} unit="×" color={safe ? T.green : warn ? T.gold : T.red} />
        <DataBox label="Burst" value={burst} unit="MPa" color={T.red} />
      </DataRow>
      <InfoBox>
        <strong style={{ color: T.accent }}>σ_hoop = P×r/t.</strong> Orange arrows = circumferential stress. ASME
        requires FoS ≥ 1.5. Wall color: <span style={{ color: T.green }}>safe</span> /{" "}
        <span style={{ color: T.gold }}>caution</span> / <span style={{ color: T.red }}>yield exceeded</span>.
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.accent} />
      <ExportBtn
        simId="pressure_vessel"
        getData={() => ({
          mat,
          pressure,
          thickness,
          radius,
          hoop: hoop.toFixed(0),
          axial: axial.toFixed(0),
          fos: fos.toFixed(2),
        })}
        color={T.accent}
      />
    </div>
  );
}
