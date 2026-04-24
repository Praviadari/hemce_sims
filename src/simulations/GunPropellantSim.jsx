import { useState, useRef, useEffect } from "react";
import { T, font } from "../utils/theme";
import { useCanvas } from "../utils/useCanvas";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ActionBtn, ResetBtn } from "../components/Primitives";

export default function GunPropellantSim() {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [grainShape, setGrainShape] = useState("7perf");
  const [webThick, setWebThick] = useState(1.2);
  const [caliberMm, setCaliberMm] = useState(155);
  const animRef = useRef(null), startRef = useRef(null);

  const sd = { "single": { prog: "degressive", peak: 280 }, "7perf": { prog: "neutral", peak: 350 }, "19perf": { prog: "progressive", peak: 420 } }[grainShape];
  const peakP = Math.round(sd.peak * (1.5 / webThick) * (caliberMm / 155));
  const muzzleV = Math.round(700 + peakP * .8 + caliberMm * .3);
  const progress = Math.min(time / 1.5, 1);

  const canvasRef = useCanvas((ctx, W, H) => {
    const cy = H / 2, p = progress;
    ctx.fillStyle = "#2A2A2A"; ctx.fillRect(30, cy - 18, W - 50, 36);
    ctx.strokeStyle = "#555"; ctx.lineWidth = 2; ctx.strokeRect(30, cy - 18, W - 50, 36);
    ctx.fillStyle = "#1A1A1A"; ctx.fillRect(30, cy - 22, 60, 44);
    if (p < .3) { for (let i = 0; i < 8; i++) { ctx.fillStyle = "#8B7355"; ctx.beginPath(); ctx.arc(40 + i * 6, cy - 8 + (i % 3) * 8, 3, 0, Math.PI * 2); ctx.fill(); } }
    if (running && p > 0 && p < .8) { const g = ctx.createLinearGradient(90, 0, 90 + p * 200, 0); g.addColorStop(0, "rgba(255,100,0,.4)"); g.addColorStop(1, "rgba(255,200,0,0)"); ctx.fillStyle = g; ctx.fillRect(90, cy - 14, p * 200, 28); }
    const px = 90 + p * (W - 140);
    ctx.fillStyle = "#888"; ctx.beginPath(); ctx.moveTo(px + 15, cy); ctx.lineTo(px, cy - 10); ctx.lineTo(px - 5, cy - 10); ctx.lineTo(px - 5, cy + 10); ctx.lineTo(px, cy + 10); ctx.closePath(); ctx.fill();
    if (running && p > .7 && p < 1) { for (let i = 0; i < 6; i++) { const a = (Math.random() - .5) * 1.2, d = 10 + Math.random() * 40; ctx.strokeStyle = `rgba(255,220,100,${.4 + Math.random() * .3})`; ctx.lineWidth = 1 + Math.random() * 2; ctx.beginPath(); ctx.moveTo(W - 20, cy); ctx.lineTo(W - 20 + Math.cos(a) * d, cy + Math.sin(a) * d); ctx.stroke(); } }
    ctx.font = `bold 9px ${font}`; ctx.fillStyle = T.dimText; ctx.textAlign = "center"; ctx.fillText("CHAMBER", 60, cy + 38); ctx.fillText("BORE", W / 2, cy + 38); ctx.textAlign = "left";
  }, [running, time, grainShape, caliberMm, progress]);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const tick = (now) => { const dt = (now - startRef.current) / 1000; setTime(dt); if (dt < 1.5) animRef.current = requestAnimationFrame(tick); else { setRunning(false); setTime(1.5); } };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running]);

  const reset = () => { cancelAnimationFrame(animRef.current); setRunning(false); setTime(0); };

  return (<div>
    <canvas ref={canvasRef} width={420} height={110} style={{ width: "100%", maxWidth: 420, height: "auto", background: "#0D1B2A", borderRadius: 8, border: `1px solid ${T.accent}33` }} />
    <PillRow>
      <Pill active={grainShape === "single"} onClick={() => { reset(); setGrainShape("single"); }} color={T.orange}>Single-Perf</Pill>
      <Pill active={grainShape === "7perf"} onClick={() => { reset(); setGrainShape("7perf"); }} color={T.gold}>7-Perf</Pill>
      <Pill active={grainShape === "19perf"} onClick={() => { reset(); setGrainShape("19perf"); }} color={T.green}>19-Perf</Pill>
    </PillRow>
    <Slider label="Web Thickness" value={webThick} onChange={v => { reset(); setWebThick(v); }} min={0.5} max={3} step={.1} unit=" mm" color={T.orange} />
    <Slider label="Caliber" value={caliberMm} onChange={v => { reset(); setCaliberMm(v); }} min={30} max={155} step={5} unit=" mm" color={T.accent} />
    <DataRow>
      <DataBox label="Peak P" value={peakP} unit="MPa" color={peakP > 400 ? T.red : T.orange} />
      <DataBox label="Muzzle V" value={muzzleV} unit="m/s" color={T.green} />
      <DataBox label="Profile" value={sd.prog} color={T.gold} />
    </DataRow>
    <div style={{ display: "flex", gap: 8 }}>
      <ActionBtn onClick={() => { if (!running) { setTime(0); setRunning(true); } }} disabled={running} color={T.orange}>{running ? "FIRING..." : "⚡ FIRE"}</ActionBtn>
      <ResetBtn onClick={reset} />
    </div>
    <InfoBox><strong style={{ color: T.gold }}>Interior ballistics:</strong> Grain perforation count controls progressivity. 7-perf = neutral, 19-perf = progressive. Thinner web = faster burn. HEMRL + ARDE develop Pinaka/ATAGS propellants.</InfoBox>
  </div>);
}
