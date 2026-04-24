import { useState, useRef, useEffect } from "react";
import { T, font } from "../utils/theme";
import { useCanvas } from "../utils/useCanvas";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ActionBtn, ResetBtn } from "../components/Primitives";

export default function AdditiveManufacturingSim() {
  const [process, setProcess] = useState("fdm");
  const [printing, setPrinting] = useState(false);
  const [layer, setLayer] = useState(0);
  const [totalLayers, setTotalLayers] = useState(40);
  const [infill, setInfill] = useState(80);
  const [part, setPart] = useState("nozzle");
  const ivRef = useRef(null);

  const pd = { fdm: { n: "FDM", sp: 40, res: .2 }, sls: { n: "SLS", sp: 25, res: .1 }, dmls: { n: "DMLS", sp: 10, res: .04 }, dw: { n: "Direct Write", sp: 5, res: .5 } }[process];
  const buildTime = Math.round(totalLayers * pd.res / pd.sp * 60);
  const partDens = (infill * .01 * (process === "dmls" ? 4.43 : 1.24)).toFixed(2);

  const canvasRef = useCanvas((ctx, W, H) => {
    const bx = W / 2 - 50, by = 20, bw = 100, bh = H - 40;
    ctx.fillStyle = "#333"; ctx.fillRect(bx - 10, by + bh, bw + 20, 8);
    ctx.strokeStyle = `${T.dimText}33`; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.strokeRect(bx, by, bw, bh); ctx.setLineDash([]);
    const lh = bh / totalLayers;
    for (let i = 0; i < layer; i++) {
      const ly = by + bh - (i + 1) * lh;
      ctx.fillStyle = process === "dmls" ? `hsl(200,40%,${30 + i * .5}%)` : process === "dw" ? `hsl(${15 + i / totalLayers * 30},70%,45%)` : `hsl(${25 + i / totalLayers * 30},60%,${35 + i * .3}%)`;
      const fw = bw * infill / 100, off = (bw - fw) / 2;
      ctx.fillRect(bx + off, ly, fw, Math.max(lh - .5, 1));
    }
    if (printing && layer < totalLayers) {
      const hy = by + bh - (layer + 1) * lh;
      ctx.fillStyle = T.accent; ctx.beginPath(); ctx.moveTo(bx + bw / 2 - 8, hy - 10); ctx.lineTo(bx + bw / 2 + 8, hy - 10); ctx.lineTo(bx + bw / 2, hy - 2); ctx.closePath(); ctx.fill();
    }
    ctx.font = `9px ${font}`; ctx.fillStyle = T.gray; ctx.textAlign = "center";
    ctx.fillText(`${layer}/${totalLayers} layers`, W / 2, H - 4);
    ctx.fillStyle = T.dimText; ctx.fillText(pd.n, W / 2, 14);
    ctx.fillStyle = T.accent; ctx.fillText(part === "nozzle" ? "NOZZLE" : part === "grain" ? "FUEL GRAIN" : "MOTOR CASE", W / 2, by + bh + 22); ctx.textAlign = "left";
  }, [printing, layer, totalLayers, infill, process, part]);

  useEffect(() => {
    if (!printing) return;
    ivRef.current = setInterval(() => setLayer(l => { if (l >= totalLayers) { setPrinting(false); return l; } return l + 1; }), 80);
    return () => clearInterval(ivRef.current);
  }, [printing, totalLayers]);

  const reset = () => { clearInterval(ivRef.current); setPrinting(false); setLayer(0); };

  return (<div>
    <canvas ref={canvasRef} width={240} height={200} style={{ width: "100%", maxWidth: 240, height: "auto", background: "#0D1B2A", borderRadius: 8, border: `1px solid ${T.accent}33`, display: "block", margin: "0 auto" }} />
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
    <Slider label="Infill" value={infill} onChange={v => { reset(); setInfill(v); }} min={20} max={100} unit="%" color={T.green} />
    <Slider label="Layers" value={totalLayers} onChange={v => { reset(); setTotalLayers(v); }} min={10} max={80} step={5} color={T.gold} />
    <DataRow>
      <DataBox label="Resolution" value={pd.res} unit="mm" color={T.accent} />
      <DataBox label="Build Time" value={buildTime} unit="min" color={T.gold} />
      <DataBox label="Density" value={partDens} unit="g/cc" color={T.green} />
    </DataRow>
    <div style={{ display: "flex", gap: 8 }}>
      <ActionBtn onClick={() => { if (!printing) { setLayer(0); setPrinting(true); } }} disabled={printing} color={T.green}>{printing ? `PRINTING ${Math.round(layer / totalLayers * 100)}%` : "🖨 START PRINT"}</ActionBtn>
      <ResetBtn onClick={reset} />
    </div>
    <InfoBox><strong style={{ color: T.accent }}>AM for HEM:</strong> {process === "dmls" ? "Ti-6Al-4V nozzles with complex cooling channels." : process === "dw" ? "Energetic paste extrusion for custom grain geometry." : "Rapid prototyping of structural components."} DRDO actively adopting AM.</InfoBox>
  </div>);
}
