import { useState } from "react";
import { T, font } from "../utils/theme";
import { useCanvas } from "../utils/useCanvas";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow } from "../components/Primitives";

export default function PAUTSim() {
  const [angle, setAngle] = useState(0);
  const [focal, setFocal] = useState(40);
  const [elems, setElems] = useState(32);
  const [freq, setFreq] = useState(5);
  const [defect, setDefect] = useState(true);
  const [mode, setMode] = useState("sector");
  const res = (1540 / (2 * freq * 1000)).toFixed(2);

  const canvasRef = useCanvas((ctx, W, H) => {
    const pw = Math.min(elems * 3, W - 40), px = (W - pw) / 2, py = 18, ph = 11;
    ctx.fillStyle = "#374151"; ctx.beginPath(); ctx.roundRect(px - 4, py - 2, pw + 8, ph + 4, 3); ctx.fill();
    const ew = pw / elems;
    for (let i = 0; i < elems; i++) {
      const phase = Math.sin((i / elems) * Math.PI + angle * .05) * .5 + .5;
      ctx.fillStyle = `rgb(0,${100 + phase * 155},${180 + phase * 75})`;
      ctx.fillRect(px + i * ew + .5, py, ew - 1, ph);
    }
    const my = py + ph + 4, mh = H - my - 8;
    ctx.fillStyle = "#1a2744"; ctx.fillRect(18, my, W - 36, mh);
    ctx.strokeStyle = `${T.accent}33`; ctx.lineWidth = 1; ctx.strokeRect(18, my, W - 36, mh);
    const dx = W / 2 + 40, dy = my + mh * .55;
    if (defect) {
      ctx.fillStyle = T.red + "77"; ctx.beginPath(); ctx.ellipse(dx, dy, 12, 3, .2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = T.red; ctx.lineWidth = 1; ctx.stroke();
    }
    const bcx = W / 2, rad = angle * Math.PI / 180;
    if (mode === "sector") {
      for (let a = -30; a <= 30; a += 3) {
        const r = a * Math.PI / 180, act = Math.abs(a - angle) < 4;
        ctx.strokeStyle = act ? `${T.accent}BB` : `${T.accent}12`; ctx.lineWidth = act ? 2 : .5;
        ctx.beginPath(); ctx.moveTo(bcx, my);
        ctx.lineTo(bcx + Math.sin(r) * focal * 3, Math.min(my + Math.cos(r) * focal * 3, my + mh)); ctx.stroke();
      }
      ctx.strokeStyle = `${T.accent}77`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(bcx, my);
      ctx.lineTo(bcx + Math.sin(rad) * focal * 3, Math.min(my + Math.cos(rad) * focal * 3, my + mh)); ctx.stroke();
    } else {
      const sh = angle * 2;
      for (let i = -3; i <= 3; i++) {
        ctx.strokeStyle = Math.abs(i) < 2 ? `${T.accent}77` : `${T.accent}18`; ctx.lineWidth = Math.abs(i) < 2 ? 2 : .8;
        ctx.beginPath(); ctx.moveTo(bcx + sh + i * 12, my); ctx.lineTo(bcx + sh + i * 12, my + focal * 3); ctx.stroke();
      }
    }
    if (defect) {
      const bx = bcx + Math.sin(rad) * (dy - my) / Math.cos(rad || .001);
      if (Math.abs(bx - dx) < 35) {
        ctx.fillStyle = `${T.red}55`; ctx.beginPath(); ctx.arc(dx, dy, 14, 0, Math.PI * 2); ctx.fill();
        ctx.font = `bold 9px ${font}`; ctx.fillStyle = T.red; ctx.textAlign = "center"; ctx.fillText("ECHO", dx, dy - 12); ctx.textAlign = "left";
      }
    }
    ctx.font = `9px ${font}`; ctx.fillStyle = T.gray; ctx.fillText("PROBE", px - 4, py - 5);
    ctx.fillStyle = T.dimText; ctx.fillText("TEST SPECIMEN", 22, my + 13);
    if (defect) { ctx.fillStyle = T.red; ctx.fillText("DEFECT", dx + 16, dy + 3); }
  }, [angle, focal, elems, freq, defect, mode]);

  return (<div>
    <canvas ref={canvasRef} width={380} height={240} style={{ width: "100%", maxWidth: 380, height: "auto", background: "#0D1B2A", borderRadius: 8, border: `1px solid ${T.accent}33` }} />
    <PillRow>
      <Pill active={mode === "sector"} onClick={() => setMode("sector")}>Sector</Pill>
      <Pill active={mode === "linear"} onClick={() => setMode("linear")} color={T.gold}>Linear</Pill>
      <Pill active={defect} onClick={() => setDefect(!defect)} color={T.red}>{defect ? "Defect ON" : "Defect OFF"}</Pill>
    </PillRow>
    <Slider label="Beam Angle" value={angle} onChange={setAngle} min={-30} max={30} unit="°" color={T.accent} />
    <Slider label="Focal Depth" value={focal} onChange={setFocal} min={10} max={80} unit=" mm" color={T.orange} />
    <Slider label="Elements" value={elems} onChange={setElems} min={8} max={64} step={4} color={T.gold} />
    <Slider label="Frequency" value={freq} onChange={setFreq} min={1} max={15} step={.5} unit=" MHz" color={T.green} />
    <DataRow>
      <DataBox label="Elements" value={elems} color={T.gold} />
      <DataBox label="Freq" value={freq} unit="MHz" color={T.green} />
      <DataBox label="Resolution" value={res} unit="mm" color={T.accent} />
    </DataRow>
    <InfoBox><strong style={{ color: T.accent }}>PAUT:</strong> Electronic phasing steers beam without moving probe. {mode === "sector" ? "Sector scan sweeps angles." : "Linear scan shifts laterally."} {defect ? "Red echo = defect reflection!" : ""} Higher freq = finer resolution, less penetration.</InfoBox>
  </div>);
}
