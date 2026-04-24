import { useState } from "react";
import { T, font } from "../utils/theme";
import { useCanvas } from "../utils/useCanvas";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow } from "../components/Primitives";

export default function PressureVesselSim() {
  const [pressure, setPressure] = useState(5);
  const [thickness, setThickness] = useState(8);
  const [radius, setRadius] = useState(200);
  const [mat, setMat] = useState("steel");

  const ys = { steel: 700, aluminium: 280, composite: 450 }[mat];
  const hoop = (pressure * radius) / thickness;
  const axial = hoop / 2;
  const fos = ys / hoop;
  const burst = (ys * thickness / radius).toFixed(1);
  const safe = fos >= 1.5, warn = fos >= 1 && fos < 1.5;
  const wallColor = hoop > ys ? T.red : hoop > ys * .67 ? T.gold : T.green;

  const canvasRef = useCanvas((ctx, W, H) => {
    const cx = W / 2, cy = H / 2, dr = 60, ww = Math.max(3, thickness * .6);
    ctx.strokeStyle = wallColor; ctx.lineWidth = ww;
    ctx.beginPath(); ctx.arc(cx, cy, dr, 0, Math.PI * 2); ctx.stroke();
    const pn = Math.min(pressure / 20, 1);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2, al = 10 + pn * 18;
      const x1 = cx + Math.cos(a) * (dr - ww / 2 - 5), y1 = cy + Math.sin(a) * (dr - ww / 2 - 5);
      const x2 = cx + Math.cos(a) * (dr - ww / 2 - 5 - al), y2 = cy + Math.sin(a) * (dr - ww / 2 - 5 - al);
      ctx.strokeStyle = `rgba(0,180,216,${.2 + pn * .4})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach(a => {
      const sr = Math.min(hoop / ys, 2), sl = 10 + sr * 14;
      const mx = cx + Math.cos(a) * (dr + ww / 2 + 8), my = cy + Math.sin(a) * (dr + ww / 2 + 8);
      const tx = -Math.sin(a), ty = Math.cos(a);
      ctx.strokeStyle = T.orange; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(mx - tx * sl, my - ty * sl); ctx.lineTo(mx + tx * sl, my + ty * sl); ctx.stroke();
    });
    ctx.font = `bold 10px ${font}`; ctx.fillStyle = T.accent; ctx.textAlign = "center"; ctx.fillText("P", cx, cy + 4);
    ctx.fillStyle = T.orange; ctx.fillText("σ_h", cx + dr + 28, cy - 8);
    ctx.fillStyle = wallColor; ctx.fillText(safe ? `✓ FoS ${fos.toFixed(1)}` : warn ? `⚠ FoS ${fos.toFixed(1)}` : "✗ YIELD", cx, H - 10);
    ctx.textAlign = "left";
  }, [pressure, thickness, radius, mat, hoop, ys, fos]);

  return (
    <div>
      <canvas ref={canvasRef} width={280} height={200}
        style={{ width: "100%", maxWidth: 280, height: "auto", background: "#0D1B2A", borderRadius: 8, border: `1px solid ${T.accent}33`, display: "block", margin: "0 auto" }} />
      <PillRow>
        <Pill active={mat === "steel"} onClick={() => setMat("steel")}>Steel 700MPa</Pill>
        <Pill active={mat === "aluminium"} onClick={() => setMat("aluminium")} color={T.gold}>Al 280MPa</Pill>
        <Pill active={mat === "composite"} onClick={() => setMat("composite")} color={T.green}>CFRP 450MPa</Pill>
      </PillRow>
      <Slider label="Internal Pressure" value={pressure} onChange={setPressure} min={1} max={25} step={.5} unit=" MPa" color={T.accent} />
      <Slider label="Wall Thickness" value={thickness} onChange={setThickness} min={2} max={30} step={.5} unit=" mm" color={T.orange} />
      <Slider label="Inner Radius" value={radius} onChange={setRadius} min={50} max={500} step={10} unit=" mm" color={T.gold} />
      <DataRow>
        <DataBox label="Hoop σ" value={hoop.toFixed(0)} unit="MPa" color={hoop > ys ? T.red : T.orange} />
        <DataBox label="Axial σ" value={axial.toFixed(0)} unit="MPa" color={T.accent} />
        <DataBox label="FoS" value={fos.toFixed(1)} unit="×" color={safe ? T.green : warn ? T.gold : T.red} />
        <DataBox label="Burst" value={burst} unit="MPa" color={T.red} />
      </DataRow>
      <InfoBox><strong style={{ color: T.accent }}>σ_hoop = P×r/t.</strong> Orange arrows = circumferential stress. ASME requires FoS ≥ 1.5. Wall color: <span style={{ color: T.green }}>safe</span> / <span style={{ color: T.gold }}>caution</span> / <span style={{ color: T.red }}>yield exceeded</span>.</InfoBox>
    </div>
  );
}
