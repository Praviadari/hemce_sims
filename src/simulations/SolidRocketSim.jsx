import { useState, useRef, useEffect, useMemo } from "react";
import { T, font } from "../utils/theme";
import { useCanvas } from "../utils/useCanvas";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ActionBtn, ResetBtn } from "../components/Primitives";

export default function SolidRocketSim() {
  const [burning, setBurning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [burnRate, setBurnRate] = useState(5);
  const [chamberP, setChamberP] = useState(7);
  const [grain, setGrain] = useState("star");
  const animRef = useRef(null);
  const startRef = useRef(null);
  const dur = 8;

  const thrust = useMemo(() => {
    const m = grain === "star" ? 1.3 : grain === "tubular" ? 1.0 : 0.7;
    return (chamberP * burnRate * 12 * m).toFixed(0);
  }, [chamberP, burnRate, grain]);

  const isp = useMemo(() => (220 + chamberP * 8 + burnRate * 2).toFixed(0), [chamberP, burnRate]);
  const progress = Math.min(elapsed / dur, 1);

  const canvasRef = useCanvas((ctx, W, H) => {
    const p = burning ? progress : 0;
    ctx.fillStyle = "#1E3A5F"; ctx.strokeStyle = T.accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(40, 30, W - 100, H - 60, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2D1B00"; ctx.beginPath(); ctx.roundRect(48, 38, W - 116, H - 76, 4); ctx.fill();
    const gi = 56 + p * 60, gw = Math.max(0, (W - 132) - p * 120), gh = Math.max(0, (H - 92) - p * 40);
    if (gw > 0 && gh > 0) {
      const gr = ctx.createLinearGradient(gi, 0, gi + gw, 0);
      gr.addColorStop(0, "#8B4513"); gr.addColorStop(0.5, "#A0522D"); gr.addColorStop(1, "#8B4513");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(gi, 46 + p * 20, gw, gh, 3); ctx.fill();
      ctx.fillStyle = "#1E3A5F";
      const cx = gi + gw / 2, cy = 46 + p * 20 + gh / 2;
      if (grain === "star") {
        for (let i = 0; i < 5; i++) {
          const a = (i * 72 - 90) * Math.PI / 180, r = Math.min(gw, gh) * 0.3;
          ctx.beginPath(); ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a - .15) * r, cy + Math.sin(a - .15) * r);
          ctx.lineTo(cx + Math.cos(a + .15) * r, cy + Math.sin(a + .15) * r); ctx.fill();
        }
      } else if (grain === "tubular") {
        ctx.beginPath(); ctx.arc(cx, cy, Math.min(Math.min(gw, gh) * .2 + p * 15, gh * .4), 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(gi + gw * (1 - p * .5), 46 + p * 20, gw * p * .5 + 5, gh);
      }
    }
    ctx.fillStyle = "#374151"; ctx.beginPath();
    ctx.moveTo(W - 60, 40); ctx.lineTo(W - 35, H / 2 - 12); ctx.lineTo(W - 15, 20);
    ctx.lineTo(W - 15, H - 20); ctx.lineTo(W - 35, H / 2 + 12); ctx.lineTo(W - 60, H - 40);
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#6B7280"; ctx.lineWidth = 1.5; ctx.stroke();
    if (burning && p < 1) {
      const int = Math.min(1, elapsed / .5) * (1 - Math.max(0, (p - .8) / .2));
      for (let i = 0; i < 14; i++) {
        const fl = (40 + Math.random() * 60) * int, sp = (Math.random() - .5) * 30 * int;
        ctx.strokeStyle = i < 5 ? `rgba(255,255,255,${.3 + Math.random() * .4})` : i < 10 ? `rgba(255,165,0,${.3 + Math.random() * .4})` : `rgba(255,69,0,.4)`;
        ctx.lineWidth = 1.5 + Math.random() * 2; ctx.beginPath();
        ctx.moveTo(W - 15, H / 2 + sp * .3); ctx.lineTo(W - 15 + fl, H / 2 + sp); ctx.stroke();
      }
    }
    ctx.font = `bold 10px ${font}`; ctx.fillStyle = T.accent; ctx.fillText("CASING", 50, 25);
    ctx.fillStyle = T.orange; ctx.fillText("PROPELLANT", 80, H / 2 - 30);
    ctx.fillStyle = T.gray; ctx.fillText("NOZZLE", W - 65, 16);
    ctx.fillStyle = T.red; ctx.beginPath(); ctx.arc(48, H / 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = `9px ${font}`; ctx.fillText("IGN", 34, H / 2 + 16);
  }, [burning, elapsed, grain, progress]);

  useEffect(() => {
    if (!burning) return;
    startRef.current = performance.now();
    const tick = (now) => {
      const dt = (now - startRef.current) / 1000;
      setElapsed(dt);
      if (dt < dur) animRef.current = requestAnimationFrame(tick);
      else { setBurning(false); setElapsed(dur); }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [burning]);

  const reset = () => { cancelAnimationFrame(animRef.current); setBurning(false); setElapsed(0); };

  return (
    <div>
      <canvas ref={canvasRef} width={460} height={180}
        style={{ width: "100%", maxWidth: 460, height: "auto", background: "#0D1B2A", borderRadius: 8, border: `1px solid ${T.accent}33` }} />
      <PillRow>
        <Pill active={grain === "star"} onClick={() => { reset(); setGrain("star"); }}>★ Star</Pill>
        <Pill active={grain === "tubular"} onClick={() => { reset(); setGrain("tubular"); }}>◯ Tubular</Pill>
        <Pill active={grain === "endburn"} onClick={() => { reset(); setGrain("endburn"); }}>▮ End-Burn</Pill>
      </PillRow>
      <Slider label="Burn Rate" value={burnRate} onChange={v => { reset(); setBurnRate(v); }} min={2} max={12} step={.5} unit=" mm/s" color={T.orange} />
      <Slider label="Chamber Pressure" value={chamberP} onChange={v => { reset(); setChamberP(v); }} min={3} max={20} step={.5} unit=" MPa" color={T.accent} />
      <DataRow>
        <DataBox label="Thrust" value={thrust} unit="kN" color={T.orange} />
        <DataBox label="Isp" value={isp} unit="s" color={T.accent} />
        <DataBox label="Burn" value={`${(progress * 100).toFixed(0)}%`} color={burning ? T.green : T.gray} />
      </DataRow>
      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn onClick={() => { if (!burning) { setElapsed(0); setBurning(true); } }} disabled={burning} color={T.red}>
          {burning ? "BURNING..." : progress >= 1 ? "BURNOUT" : "🔥 IGNITE"}
        </ActionBtn>
        <ResetBtn onClick={reset} />
      </div>
      <InfoBox color={T.accent}>
        <strong style={{ color: T.accent }}>How it works:</strong> Solid propellant burns inward from grain bore.
        {grain === "star" ? " Star bore → high initial thrust, regressive." : grain === "tubular" ? " Tubular bore → progressive thrust increase." : " End-burn → long, constant low thrust."}
        {" "}Gas exits convergent-divergent nozzle → thrust (Newton's 3rd).
      </InfoBox>
    </div>
  );
}
