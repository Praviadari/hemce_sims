import { useState, useCallback } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, SimCanvas, AIInsight } from "../components";
import { T, FONT, useCanvas } from "../utils";

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
    (ctx, W, H) => {
      const cx = W / 2, cy = H / 2, dr = 60, ww = Math.max(3, thickness * 0.6);
      const sr = Math.min(hoop / ys, 2);
      ctx.strokeStyle = wallColor;
      ctx.lineWidth = ww;
      ctx.beginPath();
      ctx.arc(cx, cy, dr, 0, Math.PI * 2);
      ctx.stroke();
      const pn = Math.min(pressure / 20, 1);
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2, al = 10 + pn * 18;
        ctx.strokeStyle = `rgba(0,180,216,${0.2 + pn * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (dr - ww / 2 - 5), cy + Math.sin(a) * (dr - ww / 2 - 5));
        ctx.lineTo(cx + Math.cos(a) * (dr - ww / 2 - 5 - al), cy + Math.sin(a) * (dr - ww / 2 - 5 - al));
        ctx.stroke();
      }
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((a) => {
        const sl = 10 + sr * 14,
          mx = cx + Math.cos(a) * (dr + ww / 2 + 8),
          my = cy + Math.sin(a) * (dr + ww / 2 + 8),
          tx = -Math.sin(a),
          ty = Math.cos(a);
        ctx.strokeStyle = T.orange;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx - tx * sl, my - ty * sl);
        ctx.lineTo(mx + tx * sl, my + ty * sl);
        ctx.stroke();
      });
      ctx.font = `bold 10px ${FONT}`;
      ctx.fillStyle = T.accent;
      ctx.textAlign = "center";
      ctx.fillText("P", cx, cy + 4);
      ctx.fillStyle = T.orange;
      ctx.fillText("σ_h", cx + dr + 28, cy - 8);
      ctx.fillStyle = wallColor;
      ctx.fillText(safe ? `✓ FoS ${fos.toFixed(1)}` : warn ? `⚠ FoS ${fos.toFixed(1)}` : "✗ YIELD", cx, H - 10);
      ctx.textAlign = "left";
    },
    [pressure, thickness, radius, mat, hoop, ys, fos]
  );

  const buildPrompt = useCallback(() =>
    `Pressure vessel structural integrity simulation — current parameters:
- Material: ${mat} (yield strength: ${ys} MPa)
- Internal pressure: ${pressure} MPa
- Wall thickness: ${thickness} mm
- Inner radius: ${radius} mm
- Hoop stress (σ_h): ${hoop.toFixed(0)} MPa
- Axial stress: ${axial.toFixed(0)} MPa
- Factor of Safety: ${fos.toFixed(2)}
- Burst pressure: ${burst} MPa
- Status: ${!safe && !warn ? "YIELDED" : warn ? "CAUTION" : "SAFE"}

Provide 2-3 sentences: what does this stress state mean for the vessel's structural integrity, and what design changes would improve safety for a propulsion or ordnance application?`,
  [mat, ys, pressure, thickness, radius, hoop, axial, fos, burst, safe, warn]);

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={280} height={200} maxWidth={280} />
      <PillRow>
        <Pill active={mat === "steel"} onClick={() => setMat("steel")}>Steel 700MPa</Pill>
        <Pill active={mat === "aluminium"} onClick={() => setMat("aluminium")} color={T.gold}>Al 280MPa</Pill>
        <Pill active={mat === "composite"} onClick={() => setMat("composite")} color={T.green}>CFRP 450MPa</Pill>
      </PillRow>
      <Slider label="Internal Pressure" value={pressure} onChange={setPressure} min={1} max={25} step={0.5} unit=" MPa" color={T.accent} />
      <Slider label="Wall Thickness" value={thickness} onChange={setThickness} min={2} max={30} step={0.5} unit=" mm" color={T.orange} />
      <Slider label="Inner Radius" value={radius} onChange={setRadius} min={50} max={500} step={10} unit=" mm" color={T.gold} />
      <DataRow>
        <DataBox label="Hoop σ" value={hoop.toFixed(0)} unit="MPa" color={hoop > ys ? T.red : T.orange} />
        <DataBox label="Axial σ" value={axial.toFixed(0)} unit="MPa" color={T.accent} />
        <DataBox label="FoS" value={fos.toFixed(1)} unit="×" color={safe ? T.green : warn ? T.gold : T.red} />
        <DataBox label="Burst" value={burst} unit="MPa" color={T.red} />
      </DataRow>
      <InfoBox>
        <strong style={{ color: T.accent }}>σ_hoop = P×r/t.</strong> Orange arrows = circumferential stress. ASME requires FoS ≥ 1.5. Wall color: <span style={{ color: T.green }}>safe</span> / <span style={{ color: T.gold }}>caution</span> / <span style={{ color: T.red }}>yield exceeded</span>.
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.accent} />
    </div>
  );
}
