import { useState, useMemo, useCallback } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, SimCanvas, AIInsight } from "../components";
import { T, FONT, useCanvas } from "../utils";

export default function ScramjetSim() {
  const [mach, setMach] = useState(6);
  const [fuelType, setFuelType] = useState("endothermic");
  const [altitude, setAltitude] = useState(25);
  const [cooling, setCooling] = useState(true);

  const temp = useMemo(() => Math.round(288 * (1 + 0.2 * mach * mach)), [mach]);
  const thrustN = useMemo(() => {
    const m = fuelType === "endothermic" ? 1.2 : fuelType === "hydrogen" ? 1.35 : 1.0;
    return Math.round(mach * 15 * m * (1 - altitude * 0.015));
  }, [mach, fuelType, altitude]);
  const wallT = useMemo(() => {
    const base = temp * 0.6;
    return Math.round(cooling ? base * 0.35 : base);
  }, [temp, cooling]);

  const canvasRef = useCanvas((ctx, W, H) => {
    const cy = H / 2;
    
    // Background Radial Gradient for hypersonic atmosphere
    const bgGrad = ctx.createRadialGradient(W/2, cy, 0, W/2, cy, W);
    bgGrad.addColorStop(0, "#0a192f");
    bgGrad.addColorStop(1, "#050b14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Inlet / Cowl Structure
    ctx.fillStyle = "#2D3748";
    ctx.strokeStyle = `${T.accent}40`;
    ctx.lineWidth = 1.5;
    
    ctx.beginPath(); 
    ctx.moveTo(20, cy - 40); ctx.lineTo(100, cy - 20); ctx.lineTo(100, cy + 20); ctx.lineTo(20, cy + 40); 
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // Isolator & Combustor Housing
    ctx.fillStyle = "#1A202C";
    ctx.fillRect(100, cy - 20, 160, 40);
    ctx.strokeRect(100, cy - 20, 160, 40);

    // Aero-heating Glow (Leading Edge)
    if (mach > 5) {
      const heatAlpha = Math.min(1, (mach - 5) / 7);
      ctx.shadowBlur = 15;
      ctx.shadowColor = T.red;
      ctx.strokeStyle = `rgba(255, 69, 58, ${heatAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(20, cy - 40); ctx.lineTo(25, cy - 41); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(20, cy + 40); ctx.lineTo(25, cy + 41); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Oblique Shock Waves (Inlet)
    ctx.strokeStyle = `${T.cyan}${Math.floor(20 + mach * 10).toString(16)}`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(20, cy - 40);
      ctx.lineTo(60 + i * 15, cy - 10 + i * 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(20, cy + 40);
      ctx.lineTo(60 + i * 15, cy + 10 - i * 5);
      ctx.stroke();
    }

    // Supersonic Combustion Flame
    const flameGrad = ctx.createLinearGradient(130, 0, 260, 0);
    flameGrad.addColorStop(0, T.white);
    flameGrad.addColorStop(0.2, T.orange);
    flameGrad.addColorStop(1, "transparent");
    
    ctx.fillStyle = flameGrad;
    ctx.globalAlpha = 0.6 + Math.random() * 0.2;
    ctx.beginPath();
    ctx.roundRect(130, cy - 15, 130 + mach * 5, 30, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Sparks / High-velocity particles
    for (let i = 0; i < 12; i++) {
      const px = 140 + Math.random() * 150;
      const py = cy + (Math.random() - 0.5) * 25;
      ctx.fillStyle = `rgba(255, 200, 100, ${Math.random() * 0.8})`;
      ctx.fillRect(px, py, 4 + Math.random() * 10, 1);
    }

    // Cooling Jacket Visualization
    if (cooling) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = T.cyan;
      ctx.strokeStyle = `${T.cyan}88`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(100, cy - 25, 160, 50);
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      
      ctx.font = `900 8px ${TECH_FONT}`;
      ctx.fillStyle = T.cyan;
      ctx.fillText("COOLANT FLOW ACTIVE", 110, cy - 28);
    }

    // Divergent Nozzle / Expansion
    ctx.fillStyle = "#2D3748";
    ctx.beginPath();
    ctx.moveTo(260, cy - 20); ctx.lineTo(340, cy - 45); ctx.lineTo(340, cy + 45); ctx.lineTo(260, cy + 20);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `${T.accent}40`;
    ctx.stroke();

    // Expansion Fan / Exhaust
    const exhaustGrad = ctx.createLinearGradient(340, 0, 410, 0);
    exhaustGrad.addColorStop(0, `${T.accent}44`);
    exhaustGrad.addColorStop(1, "transparent");
    ctx.fillStyle = exhaustGrad;
    ctx.beginPath();
    ctx.moveTo(340, cy - 40); ctx.lineTo(410, cy - 60); ctx.lineTo(410, cy + 60); ctx.lineTo(340, cy + 40);
    ctx.fill();

    // Labels
    ctx.font = `900 10px ${TECH_FONT}`;
    ctx.textAlign = "center";
    ctx.fillStyle = T.cyan; ctx.fillText("SUPERSONIC INLET", 60, cy + 55);
    ctx.fillStyle = T.gray; ctx.fillText("ISOLATOR", 115, cy + 55);
    ctx.fillStyle = T.orange; ctx.fillText("SCRAM-COMBUSTOR", 200, cy + 55);
    ctx.fillStyle = T.accent; ctx.fillText("EXPANSION NOZZLE", 310, cy + 55);
    ctx.textAlign = "left";
    
    // Mach Vector Overlay
    ctx.strokeStyle = T.white;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(10, cy); ctx.lineTo(40, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, cy); ctx.lineTo(35, cy-3); ctx.moveTo(40, cy); ctx.lineTo(35, cy+3); ctx.stroke();
    ctx.font = `bold 9px ${MONO_FONT}`;
    ctx.fillStyle = T.white;
    ctx.fillText(`M${mach}`, 10, cy - 8);

  }, [mach, fuelType, cooling],
    { animate: true }
  );

  const buildPrompt = useCallback(() =>
    `Scramjet (supersonic combustion ramjet) simulation — current parameters:
- Flight Mach number: ${mach}
- Fuel type: ${fuelType}
- Altitude: ${altitude} km
- Active regenerative cooling: ${cooling ? "YES" : "NO"}
- Stagnation temperature: ${temp} K
- Net thrust: ${thrustN} kN
- Combustor wall temperature: ${wallT} K

Provide 2-3 sentences: how do these conditions affect scramjet operability, material selection, and flight envelope in a hypersonic defense vehicle?`,
  [mach, fuelType, altitude, cooling, temp, thrustN, wallT]);

  return (<div>
    <SimCanvas canvasRef={canvasRef} width={420} height={130} maxWidth={420} />
    <PillRow>
      <Pill active={fuelType === "endothermic"} onClick={() => setFuelType("endothermic")} color={T.cyan}>Endothermic</Pill>
      <Pill active={fuelType === "hydrocarbon"} onClick={() => setFuelType("hydrocarbon")} color={T.orange}>Hydrocarbon</Pill>
      <Pill active={fuelType === "hydrogen"} onClick={() => setFuelType("hydrogen")} color={T.green}>Hydrogen</Pill>
      <Pill active={cooling} onClick={() => setCooling(!cooling)} color={T.cyan}>{cooling ? "Cooling ON" : "Cooling OFF"}</Pill>
    </PillRow>
    <Slider label="Mach Number" value={mach} onChange={setMach} min={4} max={12} step={0.5} unit="" color={T.orange} />
    <Slider label="Altitude" value={altitude} onChange={setAltitude} min={15} max={40} unit=" km" color={T.accent} />
    <DataRow>
      <DataBox label="Stagnation T" value={temp} unit="K" color={temp > 2500 ? T.red : T.orange} />
      <DataBox label="Thrust" value={thrustN} unit="kN" color={T.green} />
      <DataBox label="Wall T" value={wallT} unit="K" color={wallT > 800 ? T.red : T.cyan} />
    </DataRow>
    <InfoBox><strong style={{ color: T.cyan }}>Scramjet:</strong> Air-breathing, supersonic combustion at Mach 5+. Uses atmospheric O₂. {cooling ? "Active cooling circulates endothermic fuel through walls before combustion." : "⚠ Without cooling, walls exceed material limits above Mach 7."} DRDL tested 12-min full-scale run in Jan 2026.</InfoBox>
    <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
  </div>);
}
