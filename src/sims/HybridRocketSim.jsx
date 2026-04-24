import { useState, useEffect, useRef, useCallback } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, SimCanvas, AIInsight } from "../components";
import { T, FONT, useCanvas } from "../utils";

export default function HybridRocketSim() {
  const [throttle, setThrottle] = useState(50);
  const [fuel, setFuel] = useState("paraffin");
  const [oxidizer, setOxidizer] = useState("n2o");
  const [running, setRunning] = useState(false);
  const ivRef = useRef(null);

  const fd = { paraffin: { rate: 3.2, isp: 250 }, htpb: { rate: 1.0, isp: 240 }, abs: { rate: 1.5, isp: 230 } }[fuel];
  const od = { n2o: { name: "N₂O", mult: 1.0 }, lox: { name: "LOX", mult: 1.3 }, h2o2: { name: "H₂O₂", mult: 1.1 } }[oxidizer];
  const thrust = Math.round(fd.isp * throttle / 100 * od.mult * 0.4);
  const regRate = (fd.rate * (throttle / 100) * od.mult).toFixed(1);

  const canvasRef = useCanvas((ctx, W, H) => {
    const cy = H / 2;
    
    // Background Radial Gradient for test stand atmosphere
    const bg = ctx.createRadialGradient(W/2, cy, 0, W/2, cy, W);
    bg.addColorStop(0, "#0d1b2a");
    bg.addColorStop(1, "#050b14");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Oxidizer Tank (Cryogenic Look)
    ctx.fillStyle = "#1A3A5A";
    ctx.strokeStyle = T.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(10, cy - 30, 60, 60, 8); ctx.fill(); ctx.stroke();
    
    // Tank frost effect
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.strokeRect(12, cy - 28, 56, 56);

    // Feed System / Valve
    ctx.strokeStyle = running ? T.cyan : `${T.cyan}30`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(70, cy); ctx.lineTo(100, cy); ctx.stroke();
    
    // Injector Plate
    ctx.fillStyle = "#2D3748"; ctx.fillRect(95, cy - 15, 8, 30);

    // Motor Casing (Combustor)
    ctx.fillStyle = "#1A202C";
    ctx.strokeStyle = `${T.accent}30`;
    ctx.beginPath(); ctx.roundRect(103, cy - 35, 170, 70, 4); ctx.fill(); ctx.stroke();

    // Solid Fuel Grain Regression Visualization
    const fc = fuel === "paraffin" ? "#F5DEB3" : fuel === "abs" ? "#8B8682" : "#A0522D";
    const regOffset = -2 + (throttle / 100) * 12 * Math.sin(performance.now() / 1000); // Visual flair for regression
    const portH = 15 + (throttle / 100) * 10;
    
    ctx.fillStyle = fc;
    // Top Grain
    ctx.beginPath(); ctx.roundRect(107, cy - 30, 162, 30 - portH/2, 2); ctx.fill();
    // Bottom Grain
    ctx.beginPath(); ctx.roundRect(107, cy + portH/2, 162, 30 - portH/2, 2); ctx.fill();

    // Flow & Combustion Core
    if (running) {
      // Ox Flow Pulse
      const flowPulse = Math.sin(performance.now() / 50) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(0, 180, 216, ${0.4 * flowPulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(70, cy); ctx.lineTo(100, cy); ctx.stroke();

      // Flame Core (Purplish hybrid flame)
      const fGrad = ctx.createLinearGradient(120, 0, 260, 0);
      fGrad.addColorStop(0, T.white);
      fGrad.addColorStop(0.3, T.purple);
      fGrad.addColorStop(1, "transparent");
      
      ctx.fillStyle = fGrad;
      ctx.globalAlpha = 0.5 + (throttle / 200);
      ctx.beginPath(); 
      ctx.roundRect(110, cy - portH/2 + 2, 150 + throttle * 0.5, portH - 4, 10);
      ctx.fill();
      ctx.globalAlpha = 1;
      
      // Combustion Particles
      for (let i = 0; i < 15; i++) {
        const px = 110 + Math.random() * 150;
        const py = cy + (Math.random() - 0.5) * portH;
        ctx.fillStyle = `rgba(138, 43, 226, ${Math.random()})`;
        ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Nozzle Expansion
    ctx.fillStyle = "#2D3748";
    ctx.beginPath();
    ctx.moveTo(273, cy - 15); ctx.lineTo(300, cy - 35); ctx.lineTo(300, cy + 35); ctx.lineTo(273, cy + 15);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `${T.accent}40`; ctx.stroke();

    // Exhaust Plume
    if (running) {
      const eGrad = ctx.createLinearGradient(300, 0, 360, 0);
      eGrad.addColorStop(0, `${T.purple}66`);
      eGrad.addColorStop(1, "transparent");
      ctx.fillStyle = eGrad;
      ctx.beginPath();
      ctx.moveTo(300, cy - 30); ctx.lineTo(360, cy - 50); ctx.lineTo(360, cy + 50); ctx.lineTo(300, cy + 30);
      ctx.fill();
    }

    // HUD Text
    ctx.font = `900 9px ${TECH_FONT}`;
    ctx.textAlign = "center";
    ctx.fillStyle = T.accent;
    ctx.fillText(od.name.toUpperCase(), 40, cy - 35);
    ctx.fillStyle = T.orange;
    ctx.fillText("COMBUSTOR: " + fuel.toUpperCase(), 188, cy - 40);
    
    ctx.font = `800 8px ${MONO_FONT}`;
    ctx.fillStyle = T.dimText;
    ctx.fillText(`THRUST VECTOR: ${running ? "STABLE" : "NULL"}`, 188, cy + 45);
    ctx.textAlign = "left";

  }, [running, throttle, fuel, oxidizer]);

  useEffect(() => {
    if (running) { ivRef.current = setInterval(() => {}, 80); return () => clearInterval(ivRef.current); }
  }, [running]);

  const buildPrompt = useCallback(() =>
    `Hybrid rocket motor simulation — current parameters:
- Solid fuel: ${fuel} (regression rate base: ${fd.rate} mm/s, Isp: ${fd.isp} s)
- Liquid oxidizer: ${od.name}
- Throttle setting: ${throttle}%
- Fuel regression rate at current throttle: ${regRate} mm/s
- Net thrust: ${thrust} kN
- Engine running: ${running ? "YES" : "NO"}

Provide 2-3 sentences: how does this fuel/oxidizer combination affect throttleability, safety margins, and what are the practical advantages of this hybrid configuration for a defense or space application?`,
  [fuel, fd, od, throttle, regRate, thrust, running]);

  return (<div>
    <SimCanvas canvasRef={canvasRef} width={370} height={120} maxWidth={370} />
    <PillRow>
      <Pill active={fuel === "paraffin"} onClick={() => setFuel("paraffin")} color={T.gold}>Paraffin</Pill>
      <Pill active={fuel === "htpb"} onClick={() => setFuel("htpb")} color={T.orange}>HTPB</Pill>
      <Pill active={fuel === "abs"} onClick={() => setFuel("abs")} color={T.gray}>ABS (3D)</Pill>
    </PillRow>
    <PillRow>
      <Pill active={oxidizer === "n2o"} onClick={() => setOxidizer("n2o")} color={T.cyan}>N₂O</Pill>
      <Pill active={oxidizer === "lox"} onClick={() => setOxidizer("lox")} color={T.accent}>LOX</Pill>
      <Pill active={oxidizer === "h2o2"} onClick={() => setOxidizer("h2o2")} color={T.green}>H₂O₂</Pill>
      <Pill active={running} onClick={() => setRunning(!running)} color={running ? T.red : T.green}>{running ? "⏹ Stop" : "▶ Run"}</Pill>
    </PillRow>
    <Slider label="Throttle" value={throttle} onChange={setThrottle} min={0} max={100} unit="%" color={T.green} />
    <DataRow>
      <DataBox label="Thrust" value={thrust} unit="kN" color={T.orange} />
      <DataBox label="Isp" value={fd.isp} unit="s" color={T.accent} />
      <DataBox label="Reg Rate" value={regRate} unit="mm/s" color={T.gold} />
    </DataRow>
    <InfoBox><strong style={{ color: T.green }}>Hybrid advantage:</strong> Throttleable, restartable, inherently safer. {fuel === "paraffin" ? "Paraffin: 3× regression rate." : fuel === "abs" ? "ABS: 3D-printable grains." : "HTPB: standard baseline."} ISRO/HEMRL co-developing hybrid motors.</InfoBox>
    <AIInsight buildPrompt={buildPrompt} color={T.lime} />
  </div>);
}
