import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";


export default function PropellantChemistrySim() {
  const [oxidizer, setOxidizer] = useState("ap");
  const [binder, setBinder] = useState("htpb");
  const [alPercent, setAlPercent] = useState(18);
  const [nano, setNano] = useState(false);

  const oxData = {
    ap: { isp: 260, green: false },
    an: { isp: 220, green: true },
    adn: { isp: 275, green: true },
    hmx: { isp: 285, green: false },
  };
  const bindData = { htpb: { isp: 0 }, gap: { isp: 15 }, pban: { isp: -5 } };
  const oxcol = { ap: "#4A90D9", an: T.green, adn: T.purple, hmx: T.red };
  const ox = oxData[oxidizer],
    bn = bindData[binder];
  const totalIsp = (ox.isp + bn.isp + alPercent * 1.2 + (nano ? 12 : 0)).toFixed(0);
  const density = (ox.isp > 260 ? 1.91 : 1.8) * 0.7 + (2.7 * alPercent) / 100 + 0.92 * 0.3;
  const sensitivity = oxidizer === "hmx" ? "HIGH" : oxidizer === "ap" ? "MED" : "LOW";
  const greenScore = (ox.green ? 70 : 20) + (binder === "gap" ? 15 : 0);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();

      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
      bg.addColorStop(0, theme.canvasBackground);
      bg.addColorStop(1, theme.canvasSurface);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const oxPct = Math.min(70, Math.max(60, 65 - alPercent * 0.12 + (ox.green ? 2 : 0)));
      const binderPct = 12;
      const alPct = alPercent;
      let addPct = Math.max(2, 100 - oxPct - binderPct - alPct);
      if (nano) addPct = Math.max(addPct, 6);

      const chartX = 20;
      const chartY = 24;
      const chartW = W * 0.38;
      const chartH = H * 0.55;
      const centerX = chartX + chartW / 2;
      const centerY = chartY + chartH / 2;
      const radius = Math.min(chartW, chartH) * 0.35;
      const donutWidth = radius * 0.4;
      const segments = [
        { label: "Oxidizer", pct: oxPct, color: oxcol[oxidizer] },
        { label: "Binder", pct: binderPct, color: "#9CA3AF" },
        { label: "Al", pct: alPct, color: "#D1D5DB" },
        { label: nano ? "Nano" : "Additives", pct: addPct, color: nano ? T.green : "#68D391" },
      ];

      let startAngle = -Math.PI / 2;
      ctx.lineWidth = donutWidth;
      segments.forEach((segment, idx) => {
        const slice = (segment.pct / 100) * Math.PI * 2;
        ctx.beginPath();
        ctx.strokeStyle = segment.color;
        ctx.arc(centerX, centerY, radius - donutWidth / 2, startAngle, startAngle + slice);
        ctx.stroke();

        const mid = startAngle + slice / 2;
        const labelX = centerX + Math.cos(mid) * (radius + 18);
        const labelY = centerY + Math.sin(mid) * (radius + 18);
        ctx.fillStyle = T.white;
        ctx.font = `700 10px ${TECH_FONT}`;
        ctx.textAlign = labelX < centerX ? "right" : "left";
        ctx.fillText(`${segment.label} ${segment.pct}%`, labelX, labelY);
        startAngle += slice;
      });

      ctx.fillStyle = theme.canvasSurface;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - donutWidth - 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = T.white;
      ctx.font = `800 12px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(`${density.toFixed(2)} g/cc`, centerX, centerY - 6);
      ctx.font = `600 10px ${TECH_FONT}`;
      ctx.fillText("Density", centerX, centerY + 10);

      // Particle field background
      const fieldX = chartX + chartW + 20;
      const fieldW = W - fieldX - 20;
      const fieldH = H * 0.55;
      ctx.fillStyle = nano ? "rgba(46, 64, 74, 0.9)" : "rgba(55, 65, 81, 0.9)";
      ctx.fillRect(fieldX, chartY, fieldW, fieldH);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.strokeRect(fieldX, chartY, fieldW, fieldH);

      const fieldCenterX = fieldX + fieldW * 0.5;
      const fieldCenterY = chartY + fieldH * 0.55;
      const crystals = [oxcol[oxidizer], oxcol[oxidizer], oxcol[oxidizer], oxcol[oxidizer]];
      for (let i = 0; i < 8; i += 1) {
        const baseAngle = (i / 8) * Math.PI * 2;
        const radiusOffset = fieldW * 0.22 + (i % 2) * 8;
        const px = fieldCenterX + Math.cos(baseAngle) * radiusOffset + prng(frame, i) * 4;
        const py = fieldCenterY + Math.sin(baseAngle) * radiusOffset * 0.85 + prng(frame, i + 1) * 3;
        const size = 8 + (i % 3) * 2;
        ctx.fillStyle = crystals[i % crystals.length];
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.arc(px, py, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Al particles
      for (let i = 0; i < 40; i += 1) {
        const rx = fieldX + 12 + prng(frame, i) * (fieldW - 24);
        const ry = chartY + 14 + prng(frame, i + 1) * (fieldH - 28);
        const size = 3 + prng(frame, i + 2) * 2;
        ctx.fillStyle = "rgba(226, 232, 240, 0.95)";
        ctx.beginPath();
        ctx.arc(rx + Math.sin(frame * 0.03 + i) * 0.8, ry + Math.cos(frame * 0.04 + i) * 0.7, size, 0, Math.PI * 2);
        ctx.fill();
      }
      if (nano) {
        for (let i = 0; i < 80; i += 1) {
          const rx = fieldX + 10 + prng(frame, i + 5) * (fieldW - 20);
          const ry = chartY + 10 + prng(frame, i + 6) * (fieldH - 20);
          const size = 1 + prng(frame, i + 7);
          ctx.fillStyle = "rgba(134, 239, 172, 0.8)";
          ctx.beginPath();
          ctx.arc(rx, ry, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Scale bar
      ctx.strokeStyle = T.white;
      ctx.lineWidth = 2;
      const scaleW = 60;
      ctx.beginPath();
      ctx.moveTo(fieldX + fieldW - scaleW - 14, chartY + fieldH - 18);
      ctx.lineTo(fieldX + fieldW - 14, chartY + fieldH - 18);
      ctx.stroke();
      ctx.fillStyle = T.white;
      ctx.font = `700 10px ${TECH_FONT}`;
      ctx.textAlign = "right";
      ctx.fillText("50 μm", fieldX + fieldW - 14, chartY + fieldH - 24);

      // Performance bar
      const perfY = H - 34;
      const perfH = 20;
      const baseX = 20;
      const totalWidth = W - 40;
      const oxWidth = (oxPct / 100) * totalWidth;
      const binderWidth = (binderPct / 100) * totalWidth;
      const alWidth = (alPct / 100) * totalWidth;
      const nanoWidth = (nano ? addPct : 0) / 100 * totalWidth;
      ctx.fillStyle = oxcol[oxidizer];
      ctx.fillRect(baseX, perfY, oxWidth, perfH);
      ctx.fillStyle = "#9CA3AF";
      ctx.fillRect(baseX + oxWidth, perfY, binderWidth, perfH);
      ctx.fillStyle = "#D1D5DB";
      ctx.fillRect(baseX + oxWidth + binderWidth, perfY, alWidth, perfH);
      if (nano) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(34,197,94,0.6)";
        ctx.fillStyle = T.green;
        ctx.fillRect(baseX + oxWidth + binderWidth + alWidth, perfY, nanoWidth, perfH);
        ctx.shadowBlur = 0;
      }
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.strokeRect(baseX, perfY, totalWidth, perfH);
      ctx.fillStyle = T.white;
      ctx.font = `700 11px ${TECH_FONT}`;
      ctx.textAlign = "right";
      ctx.fillText(`Isp ${totalIsp} s`, W - 24, perfY + perfH - 4);

      // Sensitivity gauge
      const gaugeX = chartX + chartW * 0.55;
      const gaugeY = perfY + perfH + 8;
      const gaugeR = 26;
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, gaugeR, Math.PI, 0);
      ctx.stroke();
      const sensVal = sensitivity === "LOW" ? 0.15 : sensitivity === "MED" ? 0.5 : 0.85;
      const needleAngle = Math.PI + sensVal * Math.PI;
      const nx = gaugeX + Math.cos(needleAngle) * (gaugeR - 6);
      const ny = gaugeY + Math.sin(needleAngle) * (gaugeR - 6);
      ctx.strokeStyle = sensitivity === "LOW" ? T.green : sensitivity === "MED" ? T.orange : T.red;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(gaugeX, gaugeY);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.fillStyle = T.white;
      ctx.font = `700 9px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("Sensitivity", gaugeX, gaugeY + gaugeR + 14);
      ctx.fillStyle = sensitivity === "LOW" ? T.green : sensitivity === "MED" ? T.orange : T.red;
      ctx.fillText(sensitivity, gaugeX, gaugeY + gaugeR + 26);

      // Microstructure labels
      ctx.textAlign = "left";
      ctx.fillStyle = T.white;
      ctx.font = `600 10px ${TECH_FONT}`;
      ctx.fillText("Microscopic particle field", fieldX, chartY - 8);
      ctx.fillText("Binder matrix", fieldX + 4, chartY + fieldH + 18);
    },
    [oxidizer, binder, alPercent, nano, totalIsp, sensitivity],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Solid propellant chemistry formulation simulation — current parameters:
ROLE: "You are an expert in energetic materials chemistry. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Oxidizer: ${oxidizer.toUpperCase()}
2. Oxidizer Isp contribution: ${ox.isp} s
3. Oxidizer green chemistry: ${ox.green ? "YES" : "NO"}
4. Binder: ${binder.toUpperCase()}
5. Binder Isp contribution: ${bn.isp} s
6. Aluminium fuel: ${alPercent}%
7. Nano-aluminium: ${nano ? "YES (3-5× burn rate enhancement)" : "NO"}
8. Total formulated Isp: ${totalIsp} s
9. Sensitivity level: ${sensitivity}
10. Green score: ${greenScore}%

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash) where applicable. What are India's current capabilities and gaps in this domain?`,
    [oxidizer, ox, binder, bn, alPercent, nano, totalIsp, sensitivity, greenScore],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={320} height={150} maxWidth={320} />
      <PillRow>
        <Pill active={oxidizer === "ap"} onClick={() => setOxidizer("ap")} color={T.accent}>
          AP
        </Pill>
        <Pill active={oxidizer === "an"} onClick={() => setOxidizer("an")} color={T.green}>
          AN ♻
        </Pill>
        <Pill active={oxidizer === "adn"} onClick={() => setOxidizer("adn")} color={T.purple}>
          ADN ♻
        </Pill>
        <Pill active={oxidizer === "hmx"} onClick={() => setOxidizer("hmx")} color={T.red}>
          HMX
        </Pill>
      </PillRow>
      <PillRow>
        <Pill active={binder === "htpb"} onClick={() => setBinder("htpb")} color={T.gold}>
          HTPB
        </Pill>
        <Pill active={binder === "gap"} onClick={() => setBinder("gap")} color={T.orange}>
          GAP
        </Pill>
        <Pill active={binder === "pban"} onClick={() => setBinder("pban")} color={T.gray}>
          PBAN
        </Pill>
        <Pill active={nano} onClick={() => setNano(!nano)} color={T.gold}>
          {nano ? "Nano ●" : "Nano ○"}
        </Pill>
      </PillRow>
      <Slider label="Aluminium %" value={alPercent} onChange={setAlPercent} min={0} max={30} unit="%" color={T.gray} />
      <DataRow>
        <DataBox label="Isp" value={totalIsp} unit="s" color={T.accent} />
        <DataBox label="Density" value={density.toFixed(2)} unit="g/cc" color={T.gold} />
        <DataBox
          label="Sensitivity"
          value={sensitivity}
          color={sensitivity === "HIGH" ? T.red : sensitivity === "MED" ? T.gold : T.green}
        />
        <DataBox label="Green" value={`${greenScore}%`} color={greenScore > 50 ? T.green : T.orange} />
      </DataRow>
      <InfoBox>
        <strong style={{ color: T.purple }}>Formulation:</strong> Oxidizer ({oxidizer.toUpperCase()}) + Binder (
        {binder.toUpperCase()}) + Al fuel. {ox.green ? "♻ Green oxidizer — reduced HCl emissions." : ""}{" "}
        {nano ? "Nano-Al increases burn rate 3-5× via surface area." : ""} HEMRL leads India&apos;s energetic materials
        synthesis.
      </InfoBox>
      <InfoBox color={T.orange}>
        <strong>HEM Safety Classification:</strong><br/>
        <span style={{ fontSize: 10 }}>
          AP (oxidizer): UN Class 5.1 Oxidizer — hygroscopic, store in sealed containers.<br/>
          Al powder: UN Class 4.1 Flammable Solid — static-sensitive, ground all equipment.<br/>
          HTPB binder: non-hazardous alone, crosslinks with IPDI (isocyanate — respiratory hazard).<br/>
          Mixed propellant: UN Class 1.3C — mass fire hazard. HEMRL safety protocols apply.
        </span>
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.purple} />
      <ExportBtn
        simId="propellant_chemistry"
        getData={() => ({ oxidizer, binder, alPercent, nano, totalIsp, density })}
        color={T.purple}
      />
    </div>
  );
}
