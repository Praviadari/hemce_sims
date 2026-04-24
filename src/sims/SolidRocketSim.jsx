import { useState, useRef, useEffect, useMemo } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ActionBtn, ResetBtn, SimCanvas } from "../components";
import { T, FONT, TECH_FONT, MONO_FONT, useCanvas, useAnimation } from "../utils";

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

  const canvasRef = useCanvas(
    (ctx, W, H) => {
      const p = burning ? progress : 0;
      
      // Background Glow
      const bgGlow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2);
      bgGlow.addColorStop(0, `${T.accent}05`);
      bgGlow.addColorStop(1, "transparent");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, W, H);

      // Casing
      ctx.fillStyle = "#1E3A5F";
      ctx.strokeStyle = `${T.accent}40`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(40, 30, W - 100, H - 60, 12);
      ctx.fill();
      ctx.stroke();

      // Inner structure
      ctx.fillStyle = "#0a192f";
      ctx.beginPath();
      ctx.roundRect(48, 38, W - 116, H - 76, 8);
      ctx.fill();

      // Propellant
      const gi = 56 + p * 60,
        gw = Math.max(0, W - 132 - p * 120),
        gh = Math.max(0, H - 92 - p * 40);
        
      if (gw > 0 && gh > 0) {
        const gr = ctx.createLinearGradient(gi, 0, gi + gw, 0);
        gr.addColorStop(0, "#5a3a1a");
        gr.addColorStop(0.3, "#8B4513");
        gr.addColorStop(0.5, "#A0522D");
        gr.addColorStop(0.7, "#8B4513");
        gr.addColorStop(1, "#5a3a1a");
        
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.roundRect(gi, 46 + p * 20, gw, gh, 6);
        ctx.fill();
        
        // Inner bore (Burning area) reflection
        if (burning) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = T.orange;
          ctx.strokeStyle = "rgba(255, 100, 0, 0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Grain core cutouts
        ctx.fillStyle = "#0a192f";
        const cx = gi + gw / 2,
          cy = 46 + p * 20 + gh / 2;
          
        if (grain === "star") {
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const a = ((i * 72 - 90) * Math.PI) / 180,
              r = Math.min(gw, gh) * 0.35;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            const a2 = ((i * 72 - 54) * Math.PI) / 180,
              r2 = r * 0.4;
            ctx.lineTo(cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2);
          }
          ctx.closePath();
          ctx.fill();
        } else if (grain === "tubular") {
          ctx.beginPath();
          ctx.arc(cx, cy, Math.min(Math.min(gw, gh) * 0.2 + p * 15, gh * 0.45), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(gi + gw * (1 - p * 0.55), 46 + p * 20, gw * p * 0.55 + 5, gh);
        }
      }

      // Nozzle (Convergent-Divergent)
      ctx.fillStyle = "#2D3748";
      ctx.beginPath();
      ctx.moveTo(W - 60, 40);
      ctx.lineTo(W - 35, H / 2 - 12);
      ctx.lineTo(W - 15, 20);
      ctx.lineTo(W - 15, H - 20);
      ctx.lineTo(W - 35, H / 2 + 12);
      ctx.lineTo(W - 60, H - 40);
      ctx.closePath();
      ctx.fill();
      
      const nozzleGrad = ctx.createLinearGradient(W - 60, 0, W - 15, 0);
      nozzleGrad.addColorStop(0, "rgba(0,0,0,0.3)");
      nozzleGrad.addColorStop(1, "rgba(255,255,255,0.1)");
      ctx.fillStyle = nozzleGrad;
      ctx.fill();

      // Exhaust Plume
      if (burning && p < 1) {
        const intensity = Math.min(1, elapsed / 0.5) * (1 - Math.max(0, (p - 0.9) / 0.1));
        
        // Mach Disks / Core
        const coreGrad = ctx.createLinearGradient(W - 15, 0, W + 100, 0);
        coreGrad.addColorStop(0, "rgba(255,255,255,0.9)");
        coreGrad.addColorStop(0.2, T.accent);
        coreGrad.addColorStop(1, "transparent");
        
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.ellipse(W - 10, H/2, 60 * intensity, 10 * intensity, 0, 0, Math.PI * 2);
        ctx.fill();

        // Particles
        for (let i = 0; i < 20; i++) {
          const fl = (50 + Math.random() * 80) * intensity,
            sp = (Math.random() - 0.5) * 40 * intensity;
          ctx.strokeStyle = i < 8 ? T.white : i < 15 ? T.accent : T.pink;
          ctx.globalAlpha = 0.4 + Math.random() * 0.4;
          ctx.lineWidth = 1 + Math.random() * 3;
          ctx.beginPath();
          ctx.moveTo(W - 15, H / 2 + (Math.random() - 0.5) * 10);
          ctx.lineTo(W - 15 + fl, H / 2 + sp);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // HUD / Labels
      ctx.font = `900 10px ${TECH_FONT}`;
      ctx.fillStyle = T.accent;
      ctx.fillText("UNIT-A: COMMAND CASING", 45, 25);
      
      ctx.fillStyle = T.orange;
      ctx.fillText("MAT: SOLID PROPELLANT", 80, H / 2 - 35);
      
      ctx.fillStyle = T.gray;
      ctx.font = `600 9px ${TECH_FONT}`;
      ctx.fillText("CD-NOZZLE v2.0", W - 85, 16);
      
      // Ignition Point
      ctx.shadowBlur = 10;
      ctx.shadowColor = T.red;
      ctx.fillStyle = T.red;
      ctx.beginPath();
      ctx.arc(48, H / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.font = `800 8px ${MONO_FONT}`;
      ctx.fillText("IGNITER", 20, H / 2 + 18);
    },
    [burning, elapsed, grain, progress]
  );

  useEffect(() => {
    if (!burning) return;
    startRef.current = performance.now();
    const tick = (now) => {
      const dt = (now - startRef.current) / 1000;
      setElapsed(dt);
      if (dt < dur) animRef.current = requestAnimationFrame(tick);
      else {
        setBurning(false);
        setElapsed(dur);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [burning]);

  const reset = () => {
    cancelAnimationFrame(animRef.current);
    setBurning(false);
    setElapsed(0);
  };

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={180} maxWidth={460} />
      <PillRow>
        <Pill active={grain === "star"} onClick={() => { reset(); setGrain("star"); }}>★ Star</Pill>
        <Pill active={grain === "tubular"} onClick={() => { reset(); setGrain("tubular"); }}>◯ Tubular</Pill>
        <Pill active={grain === "endburn"} onClick={() => { reset(); setGrain("endburn"); }}>▮ End-Burn</Pill>
      </PillRow>
      <Slider label="Burn Rate" value={burnRate} onChange={(v) => { reset(); setBurnRate(v); }} min={2} max={12} step={0.5} unit=" mm/s" color={T.orange} />
      <Slider label="Chamber Pressure" value={chamberP} onChange={(v) => { reset(); setChamberP(v); }} min={3} max={20} step={0.5} unit=" MPa" color={T.accent} />
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
