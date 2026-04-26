import { useState, useRef, useEffect, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import {
  Pill,
  Slider,
  DataBox,
  InfoBox,
  PillRow,
  DataRow,
  ActionBtn,
  ResetBtn,
  SimCanvas,
  AIInsight,
} from "../components";

export default function ThermobaricSim() {
  const [fuel, setFuel] = useState("aluminum");
  const [heContent, setHeContent] = useState(30);
  const [fuelContent, setFuelContent] = useState(20);
  const [environment, setEnvironment] = useState("open");

  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const animRef = useRef(null);
  
  const fuelData = {
    aluminum: { energy: 31.0, ignDelay: 2.0, density: 2.7, tFlame: 3200 },
    magnesium: { energy: 24.7, ignDelay: 0.8, density: 1.74, tFlame: 2800 },
    boron: { energy: 58.5, ignDelay: 5.0, density: 2.34, tFlame: 3600 },
    silicon: { energy: 8.9, ignDelay: 1.5, density: 2.33, tFlame: 2200 },
  };
  const fd = fuelData[fuel];

  const confine = { open: 1.0, tunnel: 7.0, bunker: 3.5, urban: 2.0 }[environment];
  const baseOP = (heContent / 100) * 4.5; 
  const afterburnEnergy = fd.energy * (fuelContent / 100);
  const totalEnergy = baseOP + afterburnEnergy * 0.15;
  const tbxOP = (totalEnergy * confine).toFixed(2);
  const impulse = Math.round(totalEnergy * confine * 12);
  const fireballR = Math.round(3 + fuelContent * 0.3 + afterburnEnergy * 0.1);
  const fireballDur = Math.round(fd.ignDelay + fuelContent * 3 + heContent * 0.5);
  const thermalFlux = Math.round(fd.tFlame * fuelContent * 0.01);
  const tntEq = (totalEnergy * confine / 4.5).toFixed(1);

  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const tick = (now) => {
      const dt = (now - start) / 1000;
      setTime(dt);
      if (dt < 2) animRef.current = requestAnimationFrame(tick);
      else {
        setRunning(false);
        setTime(2);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running]);

  const reset = () => {
    cancelAnimationFrame(animRef.current);
    setRunning(false);
    setTime(0);
  };

  const progress = Math.min(time / 2, 1);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      const cx = W / 2;
      const cy = H / 2 - 20;

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W);
      bg.addColorStop(0, theme.canvasBackground);
      bg.addColorStop(1, theme.canvasSurface);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#808080";
      ctx.globalAlpha = 0.5;
      if (environment === "tunnel") {
        ctx.fillRect(0, cy - 60, W, 10);
        ctx.fillRect(0, cy + 50, W, 10);
      } else if (environment === "bunker") {
        ctx.fillRect(cx - 80, cy - 60, 160, 10);
        ctx.fillRect(cx - 80, cy + 50, 160, 10);
        ctx.fillRect(cx - 80, cy - 60, 10, 120);
      } else if (environment === "urban") {
        ctx.strokeRect(cx - 100, cy - 20, 30, 70);
        ctx.strokeRect(cx + 80, cy - 30, 25, 80);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, cy + 50);
        ctx.lineTo(W, cy + 50);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.globalAlpha = 1;

      if (!running) {
        ctx.fillStyle = T.red;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `600 8px ${TECH_FONT}`;
        ctx.fillStyle = T.white;
        ctx.textAlign = "center";
        ctx.fillText("TBX", cx, cy + 15);
      } else {
        const fc = { aluminum: "#E0E0E0", magnesium: "#FFFFFF", boron: "#4A4A4A", silicon: "#8B4513" }[fuel];
        
        if (progress < 0.3) {
          const p = progress / 0.3;
          const r = p * fireballR * 3;
          
          ctx.font = `800 12px ${TECH_FONT}`;
          ctx.fillStyle = T.gold;
          ctx.textAlign = "center";
          ctx.fillText("DISPERSAL", cx, 20);

          ctx.fillStyle = fc;
          for (let i = 0; i < 200; i++) {
            const angle = prng(frame, i) * Math.PI * 2;
            const dist = prng(frame, i + 200) * r;
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;
            ctx.globalAlpha = prng(frame, i + 400);
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else {
          const p = (progress - 0.3) / 0.7;
          ctx.font = `800 12px ${TECH_FONT}`;
          ctx.fillStyle = T.red;
          ctx.textAlign = "center";
          ctx.fillText("AEROBIC COMBUSTION", cx, 20);

          const baseR = (fireballR * 3) + p * 10;
          
          const fGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR);
          fGrad.addColorStop(0, T.white);
          fGrad.addColorStop(0.2, T.orange);
          fGrad.addColorStop(1, "transparent");
          ctx.fillStyle = fGrad;
          
          const maxP = Math.min(1, p * 3);
          const durScale = 1 - Math.pow(p, fireballDur / 300);
          ctx.globalAlpha = Math.max(0, maxP * durScale);
          ctx.beginPath();
          ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = fc;
          for (let i = 0; i < 50; i++) {
            const angle = prng(frame, i) * Math.PI * 2;
            const dist = prng(frame, i + 100) * baseR * (1 + p);
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.globalAlpha = Math.max(0, 1 - p * 2);
          ctx.strokeStyle = T.white;
          ctx.lineWidth = 2 + (1 - p) * 4;
          ctx.beginPath();
          ctx.arc(cx, cy, baseR + p * 150, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.globalAlpha = 1;
        }
      }

      const stripY = H - 30;
      ctx.fillStyle = `${theme.canvasBackground}90`;
      ctx.fillRect(0, stripY, W, 30);
      ctx.strokeStyle = `rgba(255,255,255,0.1)`;
      ctx.beginPath();
      ctx.moveTo(0, stripY);
      ctx.lineTo(W, stripY);
      ctx.stroke();

      ctx.font = `600 7px ${TECH_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.textAlign = "left";
      ctx.fillText("ΔP vs t — TBX (red) vs Conv. HE (blue)", 5, stripY + 10);
      
      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = T.red;
      for (let x=0; x<W; x+=2) {
        let t = x / W;
        let p_val = tbxOP * 3 * Math.exp(-t * (150/fireballDur));
        let sy = H - Math.min(25, Math.max(0, p_val));
        x === 0 ? ctx.moveTo(x, sy) : ctx.lineTo(x, sy);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = T.cyan;
      const hePeak = baseOP * confine * 2;
      for (let x=0; x<W; x+=2) {
        let t = x / W;
        let p_val = hePeak * 3 * Math.exp(-t * 20);
        let sy = H - Math.min(25, Math.max(0, p_val));
        x === 0 ? ctx.moveTo(x, sy) : ctx.lineTo(x, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [running, progress, fuel, environment, fireballR, fireballDur, tbxOP, baseOP, confine],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Thermobaric explosive formulation and blast effects simulation — current parameters:
ROLE: "You are an expert in detonics, blast effects, and thermobaric payload design. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Metal fuel: ${fuel.toUpperCase()}
2. HE mass fraction: ${heContent}%
3. Fuel mass fraction: ${fuelContent}%
4. Environment: ${environment.toUpperCase()}
5. Calculated Peak ΔP: ${tbxOP} bar
6. Target Impulse: ${impulse} kPa·ms
7. Fireball radius: ${fireballR} m
8. Fireball duration: ${fireballDur} ms
9. Thermal Flux: ${thermalFlux} kW/m²

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash, Arjun TBX) where applicable. What are India's current capabilities and gaps in this domain?`,
    [fuel, heContent, fuelContent, environment, tbxOP, impulse, fireballR, fireballDur, thermalFlux],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={420} height={180} maxWidth={420} />
      <PillRow>
        <Pill active={fuel === "aluminum"} onClick={() => { reset(); setFuel("aluminum"); }} color={T.accent}>Al</Pill>
        <Pill active={fuel === "magnesium"} onClick={() => { reset(); setFuel("magnesium"); }} color={T.white}>Mg</Pill>
        <Pill active={fuel === "boron"} onClick={() => { reset(); setFuel("boron"); }} color={T.green}>B</Pill>
        <Pill active={fuel === "silicon"} onClick={() => { reset(); setFuel("silicon"); }} color={T.orange}>Si</Pill>
      </PillRow>
      <PillRow>
        <Pill active={environment === "open"} onClick={() => { reset(); setEnvironment("open"); }} color={T.gray}>Open</Pill>
        <Pill active={environment === "tunnel"} onClick={() => { reset(); setEnvironment("tunnel"); }} color={T.red}>Tunnel</Pill>
        <Pill active={environment === "bunker"} onClick={() => { reset(); setEnvironment("bunker"); }} color={T.orange}>Bunker</Pill>
        <Pill active={environment === "urban"} onClick={() => { reset(); setEnvironment("urban"); }} color={T.purple}>Urban</Pill>
      </PillRow>
      <Slider label="HE Content" value={heContent} onChange={(v) => { reset(); setHeContent(v); }} min={15} max={60} unit=" %" color={T.orange} />
      <Slider label="Fuel Content" value={fuelContent} onChange={(v) => { reset(); setFuelContent(v); }} min={10} max={40} unit=" %" color={T.gold} />
      <DataRow>
        <DataBox label="Peak ΔP" value={tbxOP} unit="bar" color={Number(tbxOP) > 2 ? T.red : Number(tbxOP) > 0.35 ? T.orange : T.green} />
        <DataBox label="Impulse" value={impulse} unit="kPa·ms" color={T.orange} />
        <DataBox label="Fireball" value={fireballR} unit="m" color={T.red} />
        <DataBox label="Burn Time" value={fireballDur} unit="ms" color={T.gold} />
        <DataBox label="TNT Eq" value={tntEq} unit="×" color={T.purple} />
        <DataBox label="Thermal" value={thermalFlux} unit="kW/m²" color={T.red} />
      </DataRow>
      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn onClick={() => setRunning(true)} disabled={running} color={T.red}>
          {running ? "DETONATING..." : "💥 DETONATE"}
        </ActionBtn>
        <ResetBtn onClick={reset} />
      </div>
      <InfoBox>
        Thermobaric explosives (TBX) use atmospheric O₂ for combustion, producing 1.4-1.5× the impulse of TNT with extended blast duration. Prof. Klapotke (PL6, HEMCE 2026) presents alternative fuels including Al, Mg, and novel nanofuels. DRDO ARDE developed TBX rounds for the Arjun MBT — they produce overpressure and heat lasting hundreds of milliseconds, devastating against bunkers and fortifications.
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.red} />
    </div>
  );
}
