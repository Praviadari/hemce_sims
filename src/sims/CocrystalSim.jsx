import { useState, useMemo, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";

export default function CocrystalSim() {
  const [coformer, setCoformer] = useState("hmx"); // "hmx" | "fox7" | "tnt" | "dnb" | "none"
  const [molarRatio, setMolarRatio] = useState(1);
  const [particleSize, setParticleSize] = useState(50);

  const coformerData = {
    hmx:  { densityMod: -0.06, vodMod: -200, h50Mod: +41, fricMod: -40, name: "CL-20/HMX", color: T.cyan },
    fox7: { densityMod: -0.11, vodMod: -250, h50Mod: +31, fricMod: -68, name: "CL-20/FOX-7", color: T.green },
    tnt:  { densityMod: -0.26, vodMod: -800, h50Mod: +50, fricMod: -75, name: "CL-20/TNT", color: T.gold },
    dnb:  { densityMod: -0.20, vodMod: -600, h50Mod: +45, fricMod: -60, name: "CL-20/DNB", color: T.purple },
    none: { densityMod: 0, vodMod: 0, h50Mod: 0, fricMod: 0, name: "Pure CL-20", color: T.red },
  };

  const cd = coformerData[coformer];
  const ratioFactor = coformer === "none" ? 0 : 1 / molarRatio;

  const density = (2.04 + cd.densityMod * ratioFactor).toFixed(3);
  const rawVod = 9400 + cd.vodMod * ratioFactor;
  const vod = Math.round(rawVod);
  const impactH50 = 14 + cd.h50Mod * ratioFactor;
  const h50Adjusted = Math.round(impactH50 - (100 - particleSize) * 0.05);
  // P_CJ = density * VoD² / 4e6
  const pCj = ((parseFloat(density) * vod * vod) / 4e6).toFixed(1);

  const h50Color = h50Adjusted > 40 ? T.green : h50Adjusted > 25 ? T.orange : T.red;

  const canvasRef = useCanvas(
    (ctx, w, h, frameCount) => {
      const t = getCanvasTheme();
      const hw = w * 0.4; // 40% left, 60% right

      // Clear
      ctx.fillStyle = t.bg;
      ctx.fillRect(0, 0, w, h);
      
      // Separator
      ctx.strokeStyle = t.grid;
      ctx.beginPath();
      ctx.moveTo(hw, 0);
      ctx.lineTo(hw, h);
      ctx.stroke();

      // LEFT SIDE: Crystal Structure Schematic
      ctx.save();
      const gridSize = 6;
      const cellW = (hw - 20) / gridSize;
      const cellH = (h - 20) / gridSize;
      ctx.translate(10 + cellW / 2, 10 + cellH / 2);

      const ratio = Math.round(molarRatio);

      // Pass 1: Draw Hydrogen bond indicators (dashed lines)
      ctx.strokeStyle = t.dimText;
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1;
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const idx = i * gridSize + j;
          const isCoformer = coformer !== "none" && idx % (ratio + 1) === ratio;
          if (isCoformer) {
            // Draw lines to adjacent cells
            const px = j * cellW;
            const py = i * cellH;
            if (j > 0) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo((j - 1) * cellW, py); ctx.stroke(); }
            if (i > 0) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(j * cellW, (i - 1) * cellH); ctx.stroke(); }
          }
        }
      }
      ctx.setLineDash([]);

      // Pass 2: Draw Molecules
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const idx = i * gridSize + j;
          const isCoformer = coformer !== "none" && idx % (ratio + 1) === ratio;
          
          const px = j * cellW;
          const py = i * cellH;
          const pulse = isCoformer ? Math.sin(frameCount * 0.05 + idx) * 1.5 : 0;
          
          ctx.beginPath();
          ctx.arc(px, py, 6 + pulse, 0, Math.PI * 2);
          ctx.fillStyle = isCoformer ? cd.color : T.red;
          ctx.fill();
        }
      }
      // Label
      ctx.font = `bold 9px ${TECH_FONT}`;
      ctx.fillStyle = T.white;
      ctx.textAlign = "center";
      ctx.fillText(cd.name, (hw - 20) / 2, h - 25);
      ctx.restore();

      // RIGHT SIDE: Scatter Plot (Energy vs Safety)
      ctx.save();
      const rhw = w * 0.6;
      ctx.translate(hw, 0);
      
      const plotX = 30;
      const plotY = 20;
      const plotW = rhw - 40;
      const plotH = h - 40;

      // Axes
      ctx.strokeStyle = t.grid;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(plotX, plotY + plotH); ctx.lineTo(plotX + plotW, plotY + plotH); ctx.stroke(); // X
      ctx.beginPath(); ctx.moveTo(plotX, plotY + plotH); ctx.lineTo(plotX, plotY); ctx.stroke(); // Y
      
      // Labels
      ctx.font = `10px ${TECH_FONT}`;
      ctx.fillStyle = t.dimText;
      ctx.textAlign = "center";
      ctx.fillText("IMPACT H50 (cm) → (SAFER)", plotX + plotW / 2, plotY + plotH + 15);
      ctx.save();
      ctx.translate(12, plotY + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("VoD (m/s)  (ENERGY)", 0, 0);
      ctx.restore();

      // "Ideal Zone" Box in upper right (H50 > 30, VoD > 8500)
      const mapX = (h50) => plotX + ((Math.min(maxH50, Math.max(minH50, h50)) - minH50) / (maxH50 - minH50)) * plotW;
      const mapY = (v) => plotY + plotH - ((Math.min(maxVod, Math.max(minVod, v)) - minVod) / (maxVod - minVod)) * plotH;
      
      const minH50 = 10; const maxH50 = 80;
      const minVod = 6500; const maxVod = 9800;

      const idealX = mapX(30);
      const idealW = mapX(maxH50) - idealX;
      const idealY = mapY(maxVod);
      const idealH = mapY(8500) - idealY;

      ctx.fillStyle = `${T.green}10`;
      ctx.fillRect(idealX, idealY, idealW, idealH);
      ctx.strokeStyle = `${T.green}40`;
      ctx.strokeRect(idealX, idealY, idealW, idealH);

      // Reference Points
      const refs = [
        { name: "CL-20", h50: 14, vod: 9400, color: t.dimText },
        { name: "HMX", h50: 25, vod: 9100, color: t.dimText },
        { name: "RDX", h50: 28, vod: 8750, color: t.dimText },
        { name: "TNT", h50: 74, vod: 6900, color: t.dimText },
      ];

      refs.forEach((ref) => {
        const x = mapX(ref.h50);
        const y = mapY(ref.vod);
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = ref.color; ctx.fill();
        ctx.font = `8px ${TECH_FONT}`;
        ctx.fillText(ref.name, x, y - 6);
      });

      // Current Cocrystal Point
      const cx = mapX(h50Adjusted);
      const cy = mapY(vod);
      ctx.beginPath();
      ctx.arc(cx, cy, 5 + Math.sin(frameCount * 0.1) * 2, 0, Math.PI * 2);
      ctx.fillStyle = h50Color;
      ctx.fill();
      ctx.strokeStyle = t.bg;
      ctx.stroke();

      ctx.font = `bold 10px ${TECH_FONT}`;
      ctx.fillStyle = T.white;
      // offset label to avoid overlapping with dot
      ctx.fillText("CURRENT", cx, cy + 12);

      ctx.restore();

    },
    [coformer, molarRatio, particleSize, cd, vod, h50Adjusted, h50Color],
    { animate: true }, // animate for crystal pulses
  );

  const buildPrompt = useCallback(
    () =>
      `Energetic cocrystal engineering simulation — current parameters:
ROLE: "You are an expert in energetic materials, cocrystal engineering, and insensitive munitions (IM) design. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Base explosive: CL-20
2. Coformer: ${coformer === "none" ? "None" : coformer.toUpperCase()}
3. Molar ratio (CL-20 : Coformer): ${molarRatio}:1
4. Particle size: ${particleSize} μm
5. Computed Density: ${density} g/cm³
6. Detonation Velocity (VoD): ${vod} m/s
7. Impact Sensitivity (H50): ${h50Adjusted} cm
8. Detonation Pressure (P_CJ): ${pCj} GPa

ANALYSIS REQUEST:
Part 1 — MATERIAL PROPERTIES: Analyze this cocrystal formulation. What trade-offs between energy and safety are observed compared to pure CL-20?
Part 2 — SENSITIVITY: How does the coformer affect the intermolecular hydrogen bonding and packing density to alter the sensitivity?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this development relate to insensitive munitions (IM) programs at HEMRL Pune? What role could this play in future advanced warheads (like for BrahMos or Agni)?`,
    [coformer, molarRatio, particleSize, density, vod, h50Adjusted, pCj],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={180} maxWidth={460} />
      <PillRow>
        <Pill active={coformer === "hmx"} onClick={() => setCoformer("hmx")} color={T.cyan}>HMX</Pill>
        <Pill active={coformer === "fox7"} onClick={() => setCoformer("fox7")} color={T.green}>FOX-7</Pill>
        <Pill active={coformer === "tnt"} onClick={() => setCoformer("tnt")} color={T.gold}>TNT</Pill>
        <Pill active={coformer === "dnb"} onClick={() => setCoformer("dnb")} color={T.purple}>DNB</Pill>
        <Pill active={coformer === "none"} onClick={() => setCoformer("none")} color={T.red}>None</Pill>
      </PillRow>
      <Slider disabled={coformer === "none"} label="Molar Ratio (CL-20 : Coformer)" value={molarRatio} onChange={setMolarRatio} min={1} max={8} step={1} unit=":1" color={T.accent} />
      <Slider label="Particle Size" value={particleSize} onChange={setParticleSize} min={1} max={100} step={1} unit=" μm" color={T.cyan} />
      <DataRow>
        <DataBox label="VoD" value={vod} unit="m/s" color={T.red} />
        <DataBox label="Density" value={density} unit="g/cm³" color={T.purple} />
        <DataBox label="H50" value={h50Adjusted} unit="cm" color={h50Color} />
        <DataBox label="P_CJ" value={pCj} unit="GPa" color={T.orange} />
      </DataRow>
      <InfoBox color={T.purple}>
        <strong style={{ color: T.purple }}>Energetic cocrystals</strong> are the frontier of HEM research. CL-20/HMX cocrystals (Bolton 2012) retain 95% of CL-20's energy while doubling impact safety. HEMRL Pune leads India's CL-20 synthesis program. FOX-7 cocrystals achieve 64% reduction in impact sensitivity — promising for insensitive munitions (IM) compliance.
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.purple} />
      <ExportBtn simId="cocrystal" getData={() => ({ coformer, molarRatio, particleSize, density, vod, h50: h50Adjusted, pCj })} color={T.purple} />
    </div>
  );
}
