import { useState, useEffect, useRef, useCallback } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ActionBtn, ResetBtn, SimCanvas, AIInsight } from "../components";
import { T, FONT, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";

export default function AdditiveManufacturingSim() {
  const [process, setProcess] = useState("fdm");
  const [printing, setPrinting] = useState(false);
  const [layer, setLayer] = useState(0);
  const [totalLayers, setTotalLayers] = useState(40);
  const [infill, setInfill] = useState(80);
  const [part, setPart] = useState("nozzle");
  const ivRef = useRef(null);

  const pd = { fdm: { n: "FDM", sp: 40, res: 0.2 }, sls: { n: "SLS", sp: 25, res: 0.1 }, dmls: { n: "DMLS", sp: 10, res: 0.04 }, dw: { n: "Direct Write", sp: 5, res: 0.5 } }[process];
  const buildTime = Math.round((totalLayers * pd.res / pd.sp) * 60);
  const partDensity = (infill * 0.01 * (process === "dmls" ? 4.43 : 1.24)).toFixed(2);

  const canvasRef = useCanvas((ctx, W, H) => {
    const theme = getCanvasTheme();

    // Technical background
    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2);
    bg.addColorStop(0, theme.canvasBackground);
    bg.addColorStop(1, theme.canvasSurface);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const bx = W / 2 - 50, by = 30, bw = 100, bh = H - 60;
    
    // Build Plate / Platform
    ctx.fillStyle = "#2D3748";
    ctx.fillRect(bx - 15, by + bh, bw + 30, 6);
    ctx.strokeStyle = T.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 15, by + bh, bw + 30, 6);

    // Build Volume Guide
    ctx.strokeStyle = `${T.accent}15`;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(bx, by, bw, bh);
    ctx.setLineDash([]);

    // Layers (Material deposition)
    const lh = bh / totalLayers;
    for (let i = 0; i < layer; i++) {
      const ly = by + bh - (i + 1) * lh;
      
      // Thermal cooling Effect: newer layers are "hotter"
      const age = (layer - i);
      const heat = Math.max(0, 1 - age / 10);
      
      let baseCol;
      if (process === "dmls") baseCol = 200; // Blueish metal
      else if (process === "dw") baseCol = 30; // Orange energetic
      else baseCol = 50; // Neutral
      
      ctx.fillStyle = `hsl(${baseCol}, ${30 + heat * 50}%, ${30 + heat * 40}%)`;
      if (heat > 0.1) {
        ctx.shadowBlur = 10 * heat;
        ctx.shadowColor = T.gold;
      }
      
      const fw = bw * infill / 100, off = (bw - fw) / 2;
      ctx.fillRect(bx + off, ly, fw, Math.max(lh - 0.2, 0.5));
      ctx.shadowBlur = 0;
    }

    // Print Head / Nozzle
    if (printing && layer < totalLayers) {
      const hy = by + bh - (layer + 1) * lh;
      const moveX = Math.sin(performance.now() / 100) * (bw / 2 - 5);
      
      // Nozzle structure
      ctx.fillStyle = "#4A5568";
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2 + moveX - 6, hy - 15);
      ctx.lineTo(bx + bw / 2 + moveX + 6, hy - 15);
      ctx.lineTo(bx + bw / 2 + moveX, hy - 3);
      ctx.closePath();
      ctx.fill();

      // Fusion point (The hot spot)
      const fGrad = ctx.createRadialGradient(bx+bw/2+moveX, hy, 0, bx+bw/2+moveX, hy, 8);
      fGrad.addColorStop(0, T.white);
      fGrad.addColorStop(0.5, T.gold);
      fGrad.addColorStop(1, "transparent");
      
      ctx.fillStyle = fGrad;
      ctx.beginPath(); ctx.arc(bx+bw/2+moveX, hy, 8, 0, Math.PI * 2); ctx.fill();
      
      // Sparks for DMLS / Paste extrusion for DW
      if (process === "dmls" || process === "sls") {
        for(let i=0; i<3; i++) {
          ctx.fillStyle = T.gold;
          ctx.fillRect(bx+bw/2+moveX + Math.random()*10 - 5, hy - Math.random()*10, 1, 1);
        }
      }
    }

    // HUD Text
    ctx.font = `900 10px ${TECH_FONT}`;
    ctx.textAlign = "center";
    ctx.fillStyle = T.accent;
    ctx.fillText(pd.n.toUpperCase() + " MANUFACTURING", W / 2, 18);
    
    ctx.font = `800 8px ${MONO_FONT}`;
    ctx.fillStyle = T.gray;
    ctx.fillText(`LAYER: ${layer}/${totalLayers}`, W / 2, H - 15);
    ctx.fillStyle = T.accent;
    ctx.fillText(`${part.toUpperCase()}: ${printing ? "ACTIVE" : "COMPLETE"}`, W / 2, H - 5);
    ctx.textAlign = "left";

  }, [printing, layer, totalLayers, infill, process, part],
    { animate: true }
  );

  useEffect(() => {
    if (!printing) return;
    ivRef.current = setInterval(() => setLayer((l) => {
      if (l >= totalLayers) { setPrinting(false); return l; }
      return l + 1;
    }), 80);
    return () => clearInterval(ivRef.current);
  }, [printing, totalLayers]);

  const reset = () => { clearInterval(ivRef.current); setPrinting(false); setLayer(0); };

  const buildPrompt = useCallback(() =>
    `Additive manufacturing for defense applications simulation — current parameters:
ROLE: "You are an expert in defense additive manufacturing. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Process: ${pd.n} (${process === "dmls" ? "Direct Metal Laser Sintering" : process === "sls" ? "Selective Laser Sintering" : process === "dw" ? "Direct Write (energetic paste)" : "Fused Deposition Modelling"})
2. Part: ${part} (${part === "nozzle" ? "rocket nozzle insert" : part === "grain" ? "solid fuel grain" : "motor casing"})
3. Layer resolution: ${pd.res} mm
4. Infill density: ${infill}%
5. Total layers: ${totalLayers}
6. Estimated build time: ${buildTime} min
7. Part density: ${partDensity} g/cc

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash) where applicable. What are India's current capabilities and gaps in this domain?`,
  [pd, process, part, infill, totalLayers, buildTime, partDensity]);

  return (<div>
    <SimCanvas canvasRef={canvasRef} width={240} height={200} maxWidth={240} />
    <PillRow>
      <Pill active={process === "fdm"} onClick={() => { reset(); setProcess("fdm"); }} color={T.orange}>FDM</Pill>
      <Pill active={process === "sls"} onClick={() => { reset(); setProcess("sls"); }} color={T.gold}>SLS</Pill>
      <Pill active={process === "dmls"} onClick={() => { reset(); setProcess("dmls"); }} color={T.accent}>DMLS</Pill>
      <Pill active={process === "dw"} onClick={() => { reset(); setProcess("dw"); }} color={T.red}>Direct Write</Pill>
    </PillRow>
    <PillRow>
      <Pill active={part === "nozzle"} onClick={() => { reset(); setPart("nozzle"); }} color={T.gray}>Nozzle</Pill>
      <Pill active={part === "grain"} onClick={() => { reset(); setPart("grain"); }} color={T.orange}>Fuel Grain</Pill>
      <Pill active={part === "case"} onClick={() => { reset(); setPart("case"); }} color={T.accent}>Motor Case</Pill>
    </PillRow>
    <Slider label="Infill" value={infill} onChange={(v) => { reset(); setInfill(v); }} min={20} max={100} unit="%" color={T.green} />
    <Slider label="Layers" value={totalLayers} onChange={(v) => { reset(); setTotalLayers(v); }} min={10} max={80} step={5} color={T.gold} />
    <DataRow>
      <DataBox label="Resolution" value={pd.res} unit="mm" color={T.accent} />
      <DataBox label="Build Time" value={buildTime} unit="min" color={T.gold} />
      <DataBox label="Density" value={partDensity} unit="g/cc" color={T.green} />
    </DataRow>
    <div style={{ display: "flex", gap: 8 }}>
      <ActionBtn onClick={() => { if (!printing) { setLayer(0); setPrinting(true); } }} disabled={printing} color={T.green}>
        {printing ? `PRINTING ${Math.round(layer / totalLayers * 100)}%` : "🖨 START PRINT"}
      </ActionBtn>
      <ResetBtn onClick={reset} />
    </div>
    <InfoBox><strong style={{ color: T.accent }}>AM for HEM:</strong> {process === "dmls" ? "DMLS: Ti-6Al-4V nozzles with complex cooling channels." : process === "dw" ? "Direct-Write: Energetic paste extrusion for custom grains." : process === "sls" ? "SLS: Sintered nylon/metal for rapid prototyping." : "FDM: ABS/PEEK fuel grains with tailored ports."} DRDO actively adopting AM.</InfoBox>
    <AIInsight buildPrompt={buildPrompt} color={T.lime} />
  </div>);
}
