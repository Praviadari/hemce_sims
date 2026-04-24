import { useState, useRef, useEffect, useCallback } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ActionBtn, ResetBtn, SimCanvas, AIInsight } from "../components";
import { T, FONT, TECH_FONT, MONO_FONT, useCanvas } from "../utils";

export default function DetonationSim() {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [charge, setCharge] = useState(5);
  const [distance, setDistance] = useState(20);
  const [heMat, setHeMat] = useState("tnt");
  const animRef = useRef(null);
  const vod = { tnt: 6900, rdx: 8750, cl20: 9380, hmx: 9100 }[heMat];
  const reF = { tnt: 1.0, rdx: 1.6, cl20: 2.0, hmx: 1.7 }[heMat];
  const tntEq = (charge * reF).toFixed(1);
  const scaledDist = (distance / Math.pow(Number(tntEq), 1 / 3)).toFixed(1);
  const peakOP = (0.84 / scaledDist + 2.7 / (scaledDist ** 2) + 6.2 / (scaledDist ** 3)).toFixed(1);
  const progress = Math.min(time / 2, 1);

  const canvasRef = useCanvas((ctx, W, H) => {
    const cy = H / 2, cx = 60;

    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W);
    bgGrad.addColorStop(0, "#0D1B2A");
    bgGrad.addColorStop(1, "#050B14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - 20); ctx.lineTo(W, H - 20); ctx.stroke();

    const chargeColor = { tnt: T.orange, rdx: T.gold, cl20: T.red, hmx: T.accent }[heMat];
    ctx.shadowBlur = running ? 0 : 10;
    ctx.shadowColor = chargeColor;
    ctx.fillStyle = chargeColor;
    ctx.beginPath();
    ctx.roundRect(cx - 10, cy - 10, 20, 20, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = `900 8px ${TECH_FONT}`;
    ctx.fillStyle = T.bg;
    ctx.textAlign = "center";
    ctx.fillText("HE", cx, cy + 3);

    if (running) {
      const r = progress * (W - 40);
      const alpha = Math.max(0, 1 - progress);

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
      ctx.lineWidth = 2 + (1 - progress) * 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();

      if (progress < 0.4) {
        const fireR = r * 0.6;
        const fireGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, fireR);
        fireGrad.addColorStop(0, T.white);
        fireGrad.addColorStop(0.3, T.orange);
        fireGrad.addColorStop(1, "transparent");
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, fireR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = `rgba(76, 201, 240, ${alpha * 0.2})`;
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 10, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();
    }

    const tgt = Math.min(cx + distance * 3, W - 30);
    ctx.strokeStyle = T.green;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tgt, 20); ctx.lineTo(tgt, H - 20); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `800 10px ${MONO_FONT}`;
    ctx.fillStyle = T.green;
    ctx.fillText(`${distance}m STANDOFF`, tgt - 10, 15);

    if (running && progress * (W-40) >= (tgt - cx)) {
      ctx.fillStyle = T.red;
      ctx.beginPath();
      ctx.arc(tgt, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `900 10px ${TECH_FONT}`;
      ctx.fillText("IMPACT", tgt - 20, cy - 15);
    }
  }, [running, time, charge, distance, heMat, progress]);

  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const tick = (now) => {
      const dt = (now - start) / 1000;
      setTime(dt);
      if (dt < 2) animRef.current = requestAnimationFrame(tick);
      else { setRunning(false); setTime(2); }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running]);

  const reset = () => { cancelAnimationFrame(animRef.current); setRunning(false); setTime(0); };

  const buildPrompt = useCallback(() =>
    `Detonation blast effects simulation — current parameters:
- Explosive material: ${heMat.toUpperCase()}
- Charge mass: ${charge} kg
- TNT equivalent: ${tntEq} kg
- Stand-off distance: ${distance} m
- Velocity of detonation: ${(vod / 1000).toFixed(2)} km/s
- Hopkinson-Cranz scaled distance Z: ${scaledDist} m/kg^(1/3)
- Peak overpressure at standoff: ${peakOP} bar

Provide 2-3 sentences: what do these blast parameters mean for personnel safety, structural vulnerability, and how does ${heMat.toUpperCase()} compare to TNT for this scenario?`,
  [heMat, charge, tntEq, distance, vod, scaledDist, peakOP]);

  return (<div>
    <SimCanvas canvasRef={canvasRef} width={420} height={140} maxWidth={420} />
    <PillRow>
      <Pill active={heMat === "tnt"} onClick={() => { reset(); setHeMat("tnt"); }} color={T.orange}>TNT</Pill>
      <Pill active={heMat === "rdx"} onClick={() => { reset(); setHeMat("rdx"); }} color={T.gold}>RDX</Pill>
      <Pill active={heMat === "hmx"} onClick={() => { reset(); setHeMat("hmx"); }} color={T.accent}>HMX</Pill>
      <Pill active={heMat === "cl20"} onClick={() => { reset(); setHeMat("cl20"); }} color={T.red}>CL-20</Pill>
    </PillRow>
    <Slider label="Charge Mass" value={charge} onChange={(v) => { reset(); setCharge(v); }} min={1} max={50} unit=" kg" color={T.orange} />
    <Slider label="Standoff Distance" value={distance} onChange={(v) => { reset(); setDistance(v); }} min={5} max={100} unit=" m" color={T.green} />
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
    <AIInsight buildPrompt={buildPrompt} color={T.red} />
  </div>);
}
