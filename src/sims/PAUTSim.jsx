import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";

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
      const theme = getCanvasTheme();
      const pw = Math.min(elems * 3, W - 60),
        px = (W - pw) / 2,
        py = 25,
        ph = 14,
        ew = pw / elems;

      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#2D3748";
      ctx.beginPath();
      ctx.roundRect(px - 6, py - 4, pw + 12, ph + 8, 4);
      ctx.fill();
      ctx.strokeStyle = `${T.accent}40`;
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i < elems; i++) {
        const isActive = mode === "sector" || Math.abs(px + i * ew + ew / 2 - (W / 2 + angle * 2)) < 24;
        const phase = Math.sin((i / elems) * Math.PI + performance.now() / 100) * 0.5 + 0.5;

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

      const my = py + ph + 8,
        mh = H - my - 12;
      const bscanX = 20,
        bscanY = py + ph + 10;
      const bscanW = W - 40,
        bscanH = H - bscanY - 10;
      const imgData = ctx.createImageData(bscanW, bscanH);
      const data = imgData.data;
      const wallDepth = 0.85;
      for (let y = 0; y < bscanH; y++) {
        for (let x = 0; x < bscanW; x++) {
          const idx = (y * bscanW + x) * 4;
          const normY = y / bscanH;
          const noise = Math.sin(x * 7.13 + y * 3.37) * 10 + 5;
          const surfaceEcho = normY < 0.05 ? 200 * (1 - normY / 0.05) : 0;
          const distToWall = Math.abs(normY - wallDepth);
          const wallEcho = distToWall < 0.02 ? 180 * (1 - distToWall / 0.02) : 0;
          let defectEcho = 0;
          if (defect) {
            const defectNormX = 0.65;
            const defectNormY = 0.45;
            const dx = x / bscanW - defectNormX;
            const dy = normY - defectNormY;
            const distToDefect = Math.sqrt(dx * dx * 4 + dy * dy * 16);
            if (distToDefect < 0.08) {
              defectEcho = 255 * (1 - distToDefect / 0.08);
            }
          }
          const beamCenter = mode === "sector" ? 0.5 + Math.sin((angle * Math.PI) / 180) * 0.3 : 0.5 + angle * 0.01;
          const beamDist = Math.abs(x / bscanW - beamCenter);
          const beamIntensity = beamDist < 0.15 ? 1.2 : 0.8;
          const intensity = Math.min(255, (noise + surfaceEcho + wallEcho + defectEcho) * beamIntensity);
          data[idx] = intensity * 0.8;
          data[idx + 1] = intensity * 0.85;
          data[idx + 2] = intensity;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, bscanX, bscanY);
      ctx.strokeStyle = `${T.accent}30`;
      ctx.lineWidth = 1;
      ctx.strokeRect(bscanX, bscanY, bscanW, bscanH);
      ctx.font = `600 7px ${TECH_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.textAlign = "right";
      ctx.fillText("0mm", bscanX - 2, bscanY + 8);
      ctx.fillText(`${focal}mm`, bscanX - 2, bscanY + bscanH);
      ctx.fillStyle = T.accent;
      ctx.textAlign = "left";
      ctx.fillText("B-SCAN", bscanX + 4, bscanY + 10);

      const bcx = W / 2,
        rad = (angle * Math.PI) / 180;
      ctx.lineCap = "round";

      if (mode === "sector") {
        for (let a = -35; a <= 35; a += 5) {
          const r = (a * Math.PI) / 180;
          const isCenter = Math.abs(a - angle) < 2.5;
          ctx.strokeStyle = isCenter ? `${T.accent}CC` : `${T.accent}08`;
          ctx.lineWidth = isCenter ? 3 : 0.5;
          ctx.beginPath();
          ctx.moveTo(bcx, my);
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

      const defectX = bcx + 30;
      const defectY = my + mh * 0.45;

      if (defect) {
        const bx = bcx + Math.sin(rad) * ((defectY - my) / Math.cos(rad || 0.001));
        const dist = Math.sqrt((bx - defectX) ** 2);
        if (dist < 40) {
          const strength = 1 - dist / 40;
          ctx.fillStyle = `rgba(255, 77, 109, ${strength * 0.4})`;
          ctx.beginPath();
          ctx.arc(defectX, defectY, 20 * strength, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = `900 10px ${TECH_FONT}`;
          ctx.fillStyle = T.red;
          ctx.textAlign = "center";
          ctx.fillText("SIGNAL ECHO", defectX, defectY - 18);
          ctx.textAlign = "left";
        }
      }

      ctx.font = `800 10px ${TECH_FONT}`;
      ctx.fillStyle = T.accent;
      ctx.fillText("PHASED ARRAY PROBE v4.2", px - 4, py - 10);
      ctx.font = `600 9px ${MONO_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.fillText("SUBSTRATE: TI-6AL-4V (ALLOY)", 25, my + 15);
      if (defect) {
        ctx.fillStyle = T.red;
        ctx.font = `800 9px ${TECH_FONT}`;
        ctx.fillText("VOLUMETRIC FLAW DETECTED", defectX - 60, defectY + 20);
      }
    },
    [angle, focal, elems, freq, defect, mode],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Phased Array Ultrasonic Testing (PAUT) simulation — current parameters:
ROLE: "You are an expert in NDT ultrasonics. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Scan mode: ${mode === "sector" ? "Sector scan (angular sweep)" : "Linear scan (lateral shift)"}
2. Beam angle: ${angle}°
3. Focal depth: ${focal} mm
4. Array elements: ${elems}
5. Frequency: ${freq} MHz
6. Calculated axial resolution: ${res} mm
7. Defect present: ${defect ? "YES — volumetric flaw in Ti-6Al-4V substrate" : "NO — clean specimen"}

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash) where applicable. What are India's current capabilities and gaps in this domain?`,
    [mode, angle, focal, elems, freq, res, defect],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={380} height={240} maxWidth={380} />
      <PillRow>
        <Pill active={mode === "sector"} onClick={() => setMode("sector")}>
          Sector
        </Pill>
        <Pill active={mode === "linear"} onClick={() => setMode("linear")} color={T.gold}>
          Linear
        </Pill>
        <Pill active={defect} onClick={() => setDefect(!defect)} color={T.red}>
          {defect ? "Defect ON" : "Defect OFF"}
        </Pill>
      </PillRow>
      <Slider label="Beam Angle" value={angle} onChange={setAngle} min={-30} max={30} unit="°" color={T.accent} />
      <Slider label="Focal Depth" value={focal} onChange={setFocal} min={10} max={80} unit=" mm" color={T.orange} />
      <Slider label="Elements" value={elems} onChange={setElems} min={8} max={64} step={4} color={T.gold} />
      <Slider
        label="Frequency"
        value={freq}
        onChange={setFreq}
        min={1}
        max={15}
        step={0.5}
        unit=" MHz"
        color={T.green}
      />
      <DataRow>
        <DataBox label="Elements" value={elems} color={T.gold} />
        <DataBox label="Freq" value={freq} unit="MHz" color={T.green} />
        <DataBox label="Resolution" value={res} unit="mm" color={T.accent} />
      </DataRow>
      <InfoBox>
        <strong style={{ color: T.accent }}>PAUT:</strong> Electronic phasing steers beam without moving probe.{" "}
        {mode === "sector" ? "Sector scan sweeps angles." : "Linear scan shifts laterally."}{" "}
        {defect ? "Red echo = defect reflection!" : ""} Higher freq = finer resolution, less penetration.
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.green} />
      <ExportBtn simId="paut" getData={() => ({ mode, angle, focal, elems, freq, defect, res })} color={T.green} />
    </div>
  );
}
