import { useState, useRef, useEffect } from "react";
import { T, font } from "../utils/theme";
import { useCanvas } from "../utils/useCanvas";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ActionBtn, ResetBtn } from "../components/Primitives";

export default function DetonationSim() {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [charge, setCharge] = useState(5);
  const [distance, setDistance] = useState(20);
  const [heMat, setHeMat] = useState("tnt");
  const animRef = useRef(null), startRef = useRef(null);

  const vod = { tnt: 6900, rdx: 8750, cl20: 9380, hmx: 9100 }[heMat];
  const reF = { tnt: 1.0, rdx: 1.6, cl20: 2.0, hmx: 1.7 }[heMat];
  const tntEq = (charge * reF).toFixed(1);
  const scaledDist = distance / Math.pow(Number(tntEq), 1 / 3);
  const peakOP = (0.84 / scaledDist + 2.7 / (scaledDist ** 2) + 6.2 / (scaledDist ** 3)).toFixed(1);
  const progress = Math.min(time / 2, 1);

  const canvasRef = useCanvas((ctx, W, H) => {
    const cx = 60, cy = H / 2;
    ctx.fillStyle = "#1a2210"; ctx.fillRect(0, H - 15, W, 15);
    ctx.fillStyle = T.red; ctx.fillRect(cx - 8, cy - 8, 16, 16);
    ctx.font = `bold 8px ${font}`; ctx.fillStyle = T.white; ctx.textAlign = "center"; ctx.fillText("HE", cx, cy + 3);
    if (running) {
      const r = progress * (W - 40), alpha = Math.max(0, .6 - progress * .5);
      ctx.strokeStyle = `rgba(255,165,0,${alpha})`; ctx.lineWidth = 3 + (1 - progress) * 5;
      ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2.5, Math.PI / 2.5); ctx.stroke();
      if (r > 10) { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(255,100,0,${alpha * .3})`); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
    }
    const tgt = Math.min(cx + distance * 3, W - 30);
    ctx.strokeStyle = T.green; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(tgt, 10); ctx.lineTo(tgt, H - 20); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = T.green; ctx.fillText(distance + "m", tgt, 10); ctx.textAlign = "left";
  }, [running, time, charge, distance, heMat, progress]);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const tick = (now) => { const dt = (now - startRef.current) / 1000; setTime(dt); if (dt < 2) animRef.current = requestAnimationFrame(tick); else { setRunning(false); setTime(2); } };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running]);

  const reset = () => { cancelAnimationFrame(animRef.current); setRunning(false); setTime(0); };

  return (<div>
    <canvas ref={canvasRef} width={420} height={140} style={{ width: "100%", maxWidth: 420, height: "auto", background: "#0D1B2A", borderRadius: 8, border: `1px solid ${T.accent}33` }} />
    <PillRow>
      <Pill active={heMat === "tnt"} onClick={() => { reset(); setHeMat("tnt"); }} color={T.orange}>TNT</Pill>
      <Pill active={heMat === "rdx"} onClick={() => { reset(); setHeMat("rdx"); }} color={T.gold}>RDX</Pill>
      <Pill active={heMat === "hmx"} onClick={() => { reset(); setHeMat("hmx"); }} color={T.accent}>HMX</Pill>
      <Pill active={heMat === "cl20"} onClick={() => { reset(); setHeMat("cl20"); }} color={T.red}>CL-20</Pill>
    </PillRow>
    <Slider label="Charge Mass" value={charge} onChange={v => { reset(); setCharge(v); }} min={1} max={50} unit=" kg" color={T.orange} />
    <Slider label="Standoff Distance" value={distance} onChange={v => { reset(); setDistance(v); }} min={5} max={100} unit=" m" color={T.green} />
    <DataRow>
      <DataBox label="VoD" value={(vod / 1000).toFixed(1)} unit="km/s" color={T.orange} />
      <DataBox label="TNT Eq" value={tntEq} unit="kg" color={T.gold} />
      <DataBox label="Peak ΔP" value={peakOP} unit="bar" color={Number(peakOP) > 1 ? T.red : T.accent} />
    </DataRow>
    <div style={{ display: "flex", gap: 8 }}>
      <ActionBtn onClick={() => { if (!running) { setTime(0); setRunning(true); } }} disabled={running} color={T.red}>{running ? "DETONATING..." : "💥 DETONATE"}</ActionBtn>
      <ResetBtn onClick={reset} />
    </div>
    <InfoBox><strong style={{ color: T.orange }}>Hopkinson-Cranz scaling:</strong> Z = R/W^(1/3). CL-20 is ~2× TNT equivalent — HEMRL's indigenous development. Overpressure &gt;1 bar causes structural damage.</InfoBox>
  </div>);
}
