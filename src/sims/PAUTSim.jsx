import { useState, useCallback } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, SimCanvas, AIInsight } from "../components";
import { T, FONT, TECH_FONT, MONO_FONT, useCanvas } from "../utils";

export default function PAUTSim() {
  const [angle, setAngle] = useState(0);
  const [focal, setFocal] = useState(40);
  const [elems, setElems] = useState(32);
  const [freq, setFreq] = useState(5);
  const [defect, setDefect] = useState(true);
  const [mode, setMode] = useState("sector");
  const res = (1540 / (2 * freq * 1000)).toFixed(2);

  const canvasRef = useCanvas(
    (ctx, W, H) => {
      const pw = Math.min(elems * 3, W - 60), px = (W - pw) / 2, py = 25, ph = 14, ew = pw / elems;

      ctx.fillStyle = "#2D3748";
      ctx.beginPath();
      ctx.roundRect(px - 6, py - 4, pw + 12, ph + 8, 4);
      ctx.fill();
      ctx.strokeStyle = `${T.accent}40`;
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i < elems; i++) {
        const isActive = mode === "sector" || Math.abs((px + i * ew + ew/2) - (W/2 + angle * 2)) < 24;
        const phase = Math.sin((i / elems) * Math.PI + (performance.now() / 100)) * 0.5 + 0.5;

        if (isActive) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = T.accent;
          ctx.fillStyle = `rgba(76, 201, 240, ${0.6 + phase * 0.4})`;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#1a2744";
        }
        ctx.fillRect(px + i * ew + 1, py, ew - 2, ph);
        ctx.shadowBlur = 0;
      }

      const my = py + ph + 8, mh = H - my - 12;
      const specGrad = ctx.createLinearGradient(0, my, 0, my + mh);
      specGrad.addColorStop(0, "#0a192f");
      specGrad.addColorStop(1, "#050b14");
      ctx.fillStyle = specGrad;
      ctx.roundRect(20, my, W - 40, mh, 8);
      ctx.fill();
      ctx.strokeStyle = `${T.accent}20`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.strokeStyle = `${T.accent}08`;
      ctx.lineWidth = 0.5;
      for (let x = 20; x < W - 40; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, my); ctx.lineTo(x, my + mh); ctx.stroke();
      }

      const dx = W / 2 + 50, dy = my + mh * 0.6;
      if (defect) {
        const pulse = Math.sin(performance.now() / 200) * 0.2 + 0.8;
        ctx.shadowBlur = 15 * pulse;
        ctx.shadowColor = T.red;
        ctx.fillStyle = `rgba(255, 77, 109, ${0.4 * pulse})`;
        ctx.beginPath();
        ctx.ellipse(dx, dy, 14, 4, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = T.red;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      const bcx = W / 2, rad = (angle * Math.PI) / 180;
      ctx.lineCap = "round";

      if (mode === "sector") {
        for (let a = -35; a <= 35; a += 5) {
          const r = (a * Math.PI) / 180;
          const isCenter = Math.abs(a - angle) < 2.5;
          ctx.strokeStyle = isCenter ? `${T.accent}CC` : `${T.accent}08`;
          ctx.lineWidth = isCenter ? 3 : 0.5;
          ctx.beginPath(); ctx.moveTo(bcx, my);
          const scale = Math.min(1, mh / (Math.cos(r) * 200));
          ctx.lineTo(bcx + Math.sin(r) * 200 * scale, my + Math.cos(r) * 200 * scale);
          ctx.stroke();
          if (isCenter) {
            ctx.strokeStyle = `${T.accent}30`;
            ctx.lineWidth = 10;
            ctx.stroke();
          }
        }
      } else {
        const sh = angle * 2.5;
        for (let i = -4; i <= 4; i++) {
          const isCenter = Math.abs(i) < 1;
          ctx.strokeStyle = isCenter ? `${T.accent}AA` : `${T.accent}10`;
          ctx.lineWidth = isCenter ? 4 : 1;
          ctx.beginPath();
          ctx.moveTo(bcx + sh + i * 14, my);
          ctx.lineTo(bcx + sh + i * 14, my + mh);
          ctx.stroke();
        }
      }

      if (defect) {
        const bx = bcx + Math.sin(rad) * ((dy - my) / Math.cos(rad || 0.001));
        const dist = Math.sqrt((bx - dx)**2);
        if (dist < 40) {
          const strength = 1 - (dist / 40);
          ctx.fillStyle = `rgba(255, 77, 109, ${strength * 0.4})`;
          ctx.beginPath(); ctx.arc(dx, dy, 20 * strength, 0, Math.PI * 2); ctx.fill();
          ctx.font = `900 10px ${TECH_FONT}`;
          ctx.fillStyle = T.red;
          ctx.textAlign = "center";
          ctx.fillText("SIGNAL ECHO", dx, dy - 18);
          ctx.textAlign = "left";
        }
      }

      ctx.font = `800 10px ${TECH_FONT}`; ctx.fillStyle = T.accent; ctx.fillText("PHASED ARRAY PROBE v4.2", px - 4, py - 10);
      ctx.font = `600 9px ${MONO_FONT}`; ctx.fillStyle = T.dimText; ctx.fillText("SUBSTRATE: TI-6AL-4V (ALLOY)", 25, my + 15);
      if (defect) {
        ctx.fillStyle = T.red;
        ctx.font = `800 9px ${TECH_FONT}`;
        ctx.fillText("VOLUMETRIC FLAW DETECTED", dx - 60, dy + 20);
      }
    },
    [angle, focal, elems, freq, defect, mode]
  );

  const buildPrompt = useCallback(() =>
    `Phased Array Ultrasonic Testing (PAUT) simulation — current parameters:
- Scan mode: ${mode === "sector" ? "Sector scan (angular sweep)" : "Linear scan (lateral shift)"}
- Beam angle: ${angle}°
- Focal depth: ${focal} mm
- Array elements: ${elems}
- Frequency: ${freq} MHz
- Calculated axial resolution: ${res} mm
- Defect present: ${defect ? "YES — volumetric flaw in Ti-6Al-4V substrate" : "NO — clean specimen"}

Provide 2-3 sentences: what do these NDT parameters reveal about inspection quality, and what are the implications for qualifying this aerospace/defense component?`,
  [mode, angle, focal, elems, freq, res, defect]);

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={380} height={240} maxWidth={380} />
      <PillRow>
        <Pill active={mode === "sector"} onClick={() => setMode("sector")}>Sector</Pill>
        <Pill active={mode === "linear"} onClick={() => setMode("linear")} color={T.gold}>Linear</Pill>
        <Pill active={defect} onClick={() => setDefect(!defect)} color={T.red}>{defect ? "Defect ON" : "Defect OFF"}</Pill>
      </PillRow>
      <Slider label="Beam Angle" value={angle} onChange={setAngle} min={-30} max={30} unit="°" color={T.accent} />
      <Slider label="Focal Depth" value={focal} onChange={setFocal} min={10} max={80} unit=" mm" color={T.orange} />
      <Slider label="Elements" value={elems} onChange={setElems} min={8} max={64} step={4} color={T.gold} />
      <Slider label="Frequency" value={freq} onChange={setFreq} min={1} max={15} step={0.5} unit=" MHz" color={T.green} />
      <DataRow>
        <DataBox label="Elements" value={elems} color={T.gold} />
        <DataBox label="Freq" value={freq} unit="MHz" color={T.green} />
        <DataBox label="Resolution" value={res} unit="mm" color={T.accent} />
      </DataRow>
      <InfoBox>
        <strong style={{ color: T.accent }}>PAUT:</strong> Electronic phasing steers beam without moving probe. {mode === "sector" ? "Sector scan sweeps angles." : "Linear scan shifts laterally."} {defect ? "Red echo = defect reflection!" : ""} Higher freq = finer resolution, less penetration.
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.green} />
    </div>
  );
}
