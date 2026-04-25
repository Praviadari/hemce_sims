import { useState, useRef, useEffect, useCallback } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ActionBtn, ResetBtn, SimCanvas, AIInsight } from "../components";
import { T, FONT, TECH_FONT, MONO_FONT, useCanvas } from "../utils";

export default function GunPropellantSim() {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [grainShape, setGrainShape] = useState("7perf");
  const [webThick, setWebThick] = useState(1.2);
  const [caliberMm, setCaliberMm] = useState(155);
  const animRef = useRef(null);
  const sd = { single: { prog: "degressive", peak: 280 }, "7perf": { prog: "neutral", peak: 350 }, "19perf": { prog: "progressive", peak: 420 } }[grainShape];
  const peakP = Math.round(sd.peak * (1.5 / webThick) * (caliberMm / 155));
  const muzzleV = Math.round(700 + peakP * 0.8 + caliberMm * 0.3);
  const progress = Math.min(time / 1.5, 1);

  const canvasRef = useCanvas((ctx, W, H) => {
    const cy = H / 2, p = progress;
    
    // Background Radial Gradient for the firing range
    const bg = ctx.createRadialGradient(W/2, cy, 0, W/2, cy, W);
    bg.addColorStop(0, "#0a192f");
    bg.addColorStop(1, "#050b14");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Barrel / Weapon Structure
    ctx.fillStyle = "#2D3748";
    ctx.strokeStyle = `${T.accent}40`;
    ctx.lineWidth = 2;
    
    // Gun Housing / Chamber
    ctx.beginPath();
    ctx.roundRect(10, cy - 25, 100, 50, 8);
    ctx.fill(); ctx.stroke();
    
    // Barrel
    ctx.fillRect(110, cy - 10, W - 140, 20);
    ctx.strokeRect(110, cy - 10, W - 140, 20);

    // Chamber Pressure Pulse
    if (running && p > 0.05 && p < 1) {
      const heat = Math.sin(p * Math.PI) * 0.8;
      ctx.shadowBlur = 20 * heat;
      ctx.shadowColor = T.red;
      ctx.fillStyle = `rgba(255, 69, 58, ${heat * 0.3})`;
      ctx.fillRect(15, cy - 20, 90, 40);
      ctx.shadowBlur = 0;
    }

    // Propellant Grains (Cross-section view)
    if (p < 0.2) {
      const gColor = T.gold;
      for (let i = 0; i < 9; i++) {
        const gx = 25 + (i % 3) * 15;
        const gy = cy - 15 + Math.floor(i / 3) * 15;
        ctx.fillStyle = gColor;
        ctx.beginPath(); ctx.arc(gx, gy, 4 * (1 - p * 3), 0, Math.PI * 2); ctx.fill();
        // Perf holes
        ctx.fillStyle = "#0a192f";
        const perf = grainShape === "single" ? 1 : grainShape === "7perf" ? 7 : 19;
        ctx.beginPath(); ctx.arc(gx, gy, 1, 0, Math.PI * 2); ctx.fill();
        if (perf > 1) {
          for(let a=0; a<6; a++) {
            const r = 2.5 * (1 - p * 3);
            if (r > 0) ctx.beginPath(); ctx.arc(gx + Math.cos(a)*r, gy + Math.sin(a)*r, 0.5, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }

    // Projectile Movement
    const projX = 110 + p * (W - 140);
    if (p < 1) {
      ctx.fillStyle = "#A0A0A0";
      ctx.beginPath();
      ctx.moveTo(projX, cy - 8);
      ctx.lineTo(projX + 15, cy - 8);
      ctx.lineTo(projX + 22, cy);
      ctx.lineTo(projX + 15, cy + 8);
      ctx.lineTo(projX, cy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = T.white;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // High-Pressure Gas expansion
    if (running && p > 0.1 && p < 0.95) {
      const gGrad = ctx.createLinearGradient(110, 0, projX, 0);
      gGrad.addColorStop(0, "rgba(255, 140, 0, 0.4)");
      gGrad.addColorStop(1, "rgba(255, 140, 0, 0)");
      ctx.fillStyle = gGrad;
      ctx.fillRect(110, cy - 8, projX - 110, 16);
    }

    // Muzzle Flash
    if (running && p > 0.85 && p < 1) {
      const flashP = (p - 0.85) / 0.15;
      const fGrad = ctx.createRadialGradient(W - 20, cy, 0, W - 20, cy, 60 * flashP);
      fGrad.addColorStop(0, T.white);
      fGrad.addColorStop(0.2, T.gold);
      fGrad.addColorStop(1, "transparent");
      
      ctx.globalAlpha = 1 - flashP;
      ctx.fillStyle = fGrad;
      ctx.beginPath(); ctx.arc(W - 20, cy, 60 * flashP, 0, Math.PI * 2); ctx.fill();
      
      // Expansion diamonds / particles
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = T.white;
        ctx.beginPath(); 
        ctx.arc(W - 20 + Math.random() * 40 * flashP, cy + (Math.random()-0.5)*20, 1, 0, Math.PI * 2); 
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Labels
    ctx.font = `900 10px ${TECH_FONT}`;
    ctx.fillStyle = T.accent;
    ctx.fillText("CHAMBER", 20, cy + 40);
    ctx.fillText("ORDNANCE BORE", W / 2, cy + 25);
    
    // Status HUD
    ctx.font = `800 9px ${MONO_FONT}`;
    ctx.fillStyle = T.dimText;
    ctx.fillText(`STATUS: ${running ? "FIRING" : "IDLE"}`, 20, 15);
    ctx.fillText(`X-PROFILE: ${grainShape.toUpperCase()}`, W - 100, 15);

  }, [running, time, grainShape, caliberMm, progress]);

  useEffect(() => {
    if (!running) return;
    const s = performance.now();
    const tick = (now) => {
      setTime((now - s) / 1000);
      if ((now - s) / 1000 < 1.5) animRef.current = requestAnimationFrame(tick);
      else { setRunning(false); setTime(1.5); }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running]);

  const reset = () => { cancelAnimationFrame(animRef.current); setRunning(false); setTime(0); };

  const buildPrompt = useCallback(() =>
    `Gun propellant interior ballistics simulation — current parameters:
- Grain geometry: ${grainShape} (burn profile: ${sd.prog})
- Web thickness: ${webThick} mm
- Caliber: ${caliberMm} mm
- Peak chamber pressure: ${peakP} MPa
- Muzzle velocity: ${muzzleV} m/s

Provide 2-3 sentences: how do grain geometry and web thickness affect the pressure-time curve, and what are the tactical implications of these ballistic parameters for this artillery/gun system?`,
  [grainShape, sd, webThick, caliberMm, peakP, muzzleV]);

  return (<div>
    <SimCanvas canvasRef={canvasRef} width={420} height={110} maxWidth={420} />
    <PillRow>
      <Pill active={grainShape === "single"} onClick={() => { reset(); setGrainShape("single"); }} color={T.orange}>Single-Perf</Pill>
      <Pill active={grainShape === "7perf"} onClick={() => { reset(); setGrainShape("7perf"); }} color={T.gold}>7-Perf</Pill>
      <Pill active={grainShape === "19perf"} onClick={() => { reset(); setGrainShape("19perf"); }} color={T.green}>19-Perf</Pill>
    </PillRow>
    <Slider label="Web Thickness" value={webThick} onChange={(v) => { reset(); setWebThick(v); }} min={0.5} max={3} step={0.1} unit=" mm" color={T.orange} />
    <Slider label="Caliber" value={caliberMm} onChange={(v) => { reset(); setCaliberMm(v); }} min={30} max={155} step={5} unit=" mm" color={T.accent} />
    <DataRow>
      <DataBox label="Peak P" value={peakP} unit="MPa" color={peakP > 400 ? T.red : T.orange} />
      <DataBox label="Muzzle V" value={muzzleV} unit="m/s" color={T.green} />
      <DataBox label="Profile" value={sd.prog} color={T.gold} />
    </DataRow>
    <div style={{ display: "flex", gap: 8 }}>
      <ActionBtn onClick={() => { if (!running) { setTime(0); setRunning(true); } }} disabled={running} color={T.orange}>{running ? "FIRING..." : "⚡ FIRE"}</ActionBtn>
      <ResetBtn onClick={reset} />
    </div>
    <InfoBox><strong style={{ color: T.gold }}>Interior ballistics:</strong> Grain perforation count controls burn progressivity. 7-perf = neutral, 19-perf = progressive. Thinner web = faster burn. HEMRL + ARDE develop Pinaka/ATAGS propellants.</InfoBox>
    <AIInsight buildPrompt={buildPrompt} color={T.gold} />
  </div>);
}
