import { useState, useMemo, useCallback } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ExportBtn, SimCanvas, AIInsight } from "../components";
import { T, FONT, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";

export default function ScramjetSim() {
  const [mach, setMach] = useState(6);
  const [fuelType, setFuelType] = useState("hydrogen");
  const [altitude, setAltitude] = useState(25);
  const [cooling, setCooling] = useState(true);

  const temp = useMemo(() => Math.round(288 * (1 + 0.2 * mach * mach)), [mach]);
  const { thrustN, eta, Pt2, Ve, Tcomb, T_atm } = useMemo(() => {
    const fuelHeat = fuelType === "hydrogen" ? 2200 : fuelType === "jp7" ? 1400 : 1600;
    const V0 = mach * 340;
    const P_atm = 101325 * Math.exp(-altitude / 8.5);
    const T_atm = 288 - 6.5 * Math.min(altitude, 11);
    const Pt2 = P_atm * Math.pow(1 + 0.2 * mach * mach, 3.5);
    const Tcomb = temp + fuelHeat;
    const Ve = Math.sqrt(2 * 1005 * Tcomb * (1 - Math.pow(P_atm / Pt2, 0.286)));
    const F_sp = Ve - V0;
    const mdot = 0.5 + mach * 0.3;
    const thrustN = Math.max(0, Math.round(F_sp * mdot / 1000));
    const eta = Math.round((1 - T_atm / Tcomb) * 100);
    return { thrustN, eta, Pt2, Ve, Tcomb, T_atm };
  }, [mach, fuelType, altitude, temp]);
  const wallT = useMemo(() => {
    const base = temp * 0.6;
    return Math.round(cooling ? base * 0.35 : base);
  }, [temp, cooling]);

  const canvasRef = useCanvas((ctx, W, H) => {
    const cy = H / 2;
    
    // Background Radial Gradient for hypersonic atmosphere
    const theme = getCanvasTheme();
    const bgGrad = ctx.createRadialGradient(W/2, cy, 0, W/2, cy, W);
    bgGrad.addColorStop(0, theme.canvasBackground);
    bgGrad.addColorStop(1, theme.canvasSurface);
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
ROLE: "You are an expert in hypersonic propulsion. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Flight Mach number: ${mach}
2. Fuel type: ${fuelType}
3. Altitude: ${altitude} km
4. Active regenerative cooling: ${cooling ? "YES" : "NO"}
5. Stagnation temperature: ${temp} K
6. Thermal efficiency: ${eta} %
7. Inlet total pressure: ${(Pt2 / 1e6).toFixed(2)} MPa
8. Exit velocity (Ve): ${Math.round(Ve)} m/s
9. Combustor total temperature: ${Tcomb} K
10. Net thrust: ${thrustN} kN
11. Combustor wall temperature: ${wallT} K

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash) where applicable. What are India's current capabilities and gaps in this domain?`,
  [mach, fuelType, altitude, cooling, temp, eta, Pt2, Ve, Tcomb, thrustN, wallT]);

  return (<div>
    <SimCanvas canvasRef={canvasRef} width={420} height={130} maxWidth={420} />
    <PillRow>
      <Pill active={fuelType === "hydrogen"} onClick={() => setFuelType("hydrogen")} color={T.green}>Hydrogen</Pill>
      <Pill active={fuelType === "jp7"} onClick={() => setFuelType("jp7")} color={T.orange}>JP-7</Pill>
      <Pill active={fuelType === "ethylene"} onClick={() => setFuelType("ethylene")} color={T.cyan}>Ethylene</Pill>
      <Pill active={cooling} onClick={() => setCooling(!cooling)} color={T.cyan}>{cooling ? "Cooling ON" : "Cooling OFF"}</Pill>
    </PillRow>
    <Slider label="Mach Number" value={mach} onChange={setMach} min={4} max={12} step={0.5} unit="" color={T.orange} />
    <Slider label="Altitude" value={altitude} onChange={setAltitude} min={0} max={30} unit=" km" color={T.accent} />
    <DataRow>
      <DataBox label="Stagnation T" value={temp} unit="K" color={temp > 2500 ? T.red : T.orange} />
      <DataBox label="η_thermal" value={eta} unit="%" color={T.green} />
      <DataBox label="Inlet Pt" value={(Pt2 / 1e6).toFixed(1)} unit="MPa" color={T.purple} />
      <DataBox label="Ve" value={Math.round(Ve)} unit="m/s" color={T.cyan} />
      <DataBox label="Thrust" value={thrustN} unit="kN" color={T.green} />
      <DataBox label="Wall T" value={wallT} unit="K" color={wallT > 800 ? T.red : T.cyan} />
    </DataRow>
    <InfoBox><strong style={{ color: T.cyan }}>Scramjet:</strong> Air-breathing, supersonic combustion at Mach 5+. Uses atmospheric O₂. {cooling ? "Active cooling circulates fuel through the combustor walls to protect materials." : "⚠ Without cooling, walls exceed material limits above Mach 7."} DRDL tested 12-min full-scale run in Jan 2026.</InfoBox>
    <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
  </div>);
}
