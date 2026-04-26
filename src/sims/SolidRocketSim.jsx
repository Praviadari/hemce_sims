import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, StripChart, ActionBtn, ResetBtn, SimCanvas, AIInsight } from "../components";
import { T, FONT, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";

export default function SolidRocketSim() {
  const [burning, setBurning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [burnRate, setBurnRate] = useState(5);
  const [chamberP, setChamberP] = useState(7);
  const [grain, setGrain] = useState("star");
  const [thrustHistory, setThrustHistory] = useState([]);
  const animRef = useRef(null);
  const startRef = useRef(null);
  const dur = 8;

  const thrust = useMemo(() => {
    const m = grain === "star" ? 1.4 : grain === "tubular" ? 1.0 : 0.6;
    const Cf = 1.3 + 0.05 * (chamberP / 7);
    const At = 0.005;
    return (Cf * At * chamberP * 1e6 * m / 1000).toFixed(0);
  }, [chamberP, grain]);

  const cStar = useMemo(() => {
    return Math.round(chamberP * 100 / burnRate);
  }, [chamberP, burnRate]);

  const isp = useMemo(() => {
    const Cf = 1.3 + 0.05 * (chamberP / 7);
    const rawIsp = Cf * cStar / 9.81;
    return Math.min(310, Math.max(180, Math.round(rawIsp)));
  }, [chamberP, cStar]);

  const progress = Math.min(elapsed / dur, 1);

  const canvasRef = useCanvas(
    (ctx, W, H) => {
      const p = burning ? progress : 0;

      const canvasTheme = getCanvasTheme();
      const bgGlow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2);
      bgGlow.addColorStop(0, `${T.accent}05`);
      bgGlow.addColorStop(1, "transparent");
      ctx.fillStyle = canvasTheme.panelFill;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#1E3A5F";
      ctx.strokeStyle = `${T.accent}40`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(40, 30, W - 100, H - 60, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0a192f";
      ctx.beginPath();
      ctx.roundRect(48, 38, W - 116, H - 76, 8);
      ctx.fill();

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

        if (burning) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = T.orange;
          ctx.strokeStyle = "rgba(255, 100, 0, 0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

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

      if (burning && p < 1) {
        const intensity = Math.max(
          0,
          Math.min(1, elapsed / 0.5) * (1 - Math.max(0, (p - 0.9) / 0.1))
        );
        const flameRadiusX = Math.max(0, 60 * intensity);
        const flameRadiusY = Math.max(0, 10 * intensity);

        if (flameRadiusX > 0 && flameRadiusY > 0) {
          const coreGrad = ctx.createLinearGradient(W - 15, 0, W + 100, 0);
          coreGrad.addColorStop(0, "rgba(255,255,255,0.9)");
          coreGrad.addColorStop(0.2, T.accent);
          coreGrad.addColorStop(1, "transparent");

          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.ellipse(W - 10, H / 2, flameRadiusX, flameRadiusY, 0, 0, Math.PI * 2);
          ctx.fill();

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
      }

      ctx.font = `900 10px ${TECH_FONT}`;
      ctx.fillStyle = T.accent;
      ctx.fillText("UNIT-A: COMMAND CASING", 45, 25);
      ctx.fillStyle = T.orange;
      ctx.fillText("MAT: SOLID PROPELLANT", 80, H / 2 - 35);
      ctx.fillStyle = T.gray;
      ctx.font = `600 9px ${TECH_FONT}`;
      ctx.fillText("CD-NOZZLE v2.0", W - 85, 16);

      ctx.shadowBlur = 10;
      ctx.shadowColor = T.red;
      ctx.fillStyle = T.red;
      ctx.beginPath();
      ctx.arc(48, H / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.font = `800 8px ${MONO_FONT}`;
      ctx.fillText("IGNITER", 20, H / 2 + 18);

      const burnAreaCurve = Array.from({ length: 40 }, (_, i) => {
        const t = i / 39;
        if (grain === "star") return 1.0 - 0.7 * t;
        if (grain === "tubular") return 0.4 + 0.6 * t;
        return 0.7;
      });
      const stripY = H - 35, stripH = 30;
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(5, stripY, W - 10, stripH);
      ctx.strokeStyle = `${T.orange}40`;
      ctx.strokeRect(5, stripY, W - 10, stripH);

      ctx.font = `600 7px ${TECH_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.textAlign = "left";
      ctx.fillText("Ab", 8, stripY + 9);
      ctx.textAlign = "right";
      ctx.fillText("t→", W - 8, stripY + stripH - 3);

      ctx.strokeStyle = T.orange;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      burnAreaCurve.forEach((ab, i) => {
        const x = 10 + (i / 39) * (W - 25);
        const y = stripY + stripH - 4 - ab * (stripH - 10);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      if (burning) {
        const px = 10 + progress * (W - 25);
        ctx.strokeStyle = T.green;
        ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(px, stripY); ctx.lineTo(px, stripY + stripH); ctx.stroke();
        ctx.setLineDash([]);
      }
    },
    [burning, elapsed, grain, progress]
  );

  useEffect(() => {
    if (!burning) return;
    startRef.current = performance.now();
    const tick = (now) => {
      const dt = (now - startRef.current) / 1000;
      setElapsed(dt);
      if (burning) setThrustHistory((prev) => [...prev.slice(-49), Number(thrust)]);
      if (dt < dur) animRef.current = requestAnimationFrame(tick);
      else { setBurning(false); setElapsed(dur); }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [burning, thrust]);

  const reset = () => {
    cancelAnimationFrame(animRef.current);
    setBurning(false);
    setElapsed(0);
    setThrustHistory([]);
  };

  const buildPrompt = useCallback(() =>
    `Solid rocket motor simulation — current parameters:
ROLE: "You are an expert in solid propulsion. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Grain geometry: ${grain} (star/tubular/end-burn)
2. Burn rate: ${burnRate} mm/s
3. Chamber pressure: ${chamberP} MPa
4. Calculated thrust: ${thrust} kN
5. Characteristic velocity (c*): ${cStar} m/s
6. Specific impulse (Isp): ${isp} s
7. Burn progress: ${(progress * 100).toFixed(0)}%

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash) where applicable. What are India's current capabilities and gaps in this domain?`,
  [grain, burnRate, chamberP, thrust, isp, cStar, progress]);

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={220} maxWidth={460} />
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
        <DataBox label="c*" value={cStar} unit="m/s" color={T.purple} />
        <DataBox label="Burn" value={`${(progress * 100).toFixed(0)}%`} color={burning ? T.green : T.gray} />
      </DataRow>
      <StripChart data={thrustHistory} color={T.orange} label="Thrust (kN)" maxVal={Number(thrust) * 1.5 || 100} />
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
      <AIInsight buildPrompt={buildPrompt} color={T.orange} />
      <ExportBtn simId="rocket" getData={() => ({ grain, burnRate, chamberP, thrust, isp })} color={T.orange} />
    </div>
  );
}
