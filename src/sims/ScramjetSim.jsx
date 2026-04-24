import { useState, useMemo } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, SimCanvas } from "../components";
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
    ctx.fillStyle = "#1E3A5F"; ctx.beginPath(); ctx.moveTo(20, cy - 35); ctx.lineTo(80, cy - 20); ctx.lineTo(80, cy + 20); ctx.lineTo(20, cy + 35); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#253D5E"; ctx.fillRect(80, cy - 20, 50, 40);
    const cg = ctx.createLinearGradient(130, 0, 250, 0); cg.addColorStop(0, "#4A1A00"); cg.addColorStop(0.5, "#8B2500"); cg.addColorStop(1, "#4A1A00");
    ctx.fillStyle = cg; ctx.fillRect(130, cy - 25, 120, 50);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = `rgba(255,${140 + Math.random() * 80},0,${0.3 + mach / 16})`; ctx.beginPath(); ctx.arc(140 + Math.random() * 100, cy + (Math.random() - 0.5) * 30, 2 + Math.random() * 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#1E3A5F"; ctx.beginPath(); ctx.moveTo(250, cy - 25); ctx.lineTo(330, cy - 40); ctx.lineTo(330, cy + 40); ctx.lineTo(250, cy + 25); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 8; i++) { ctx.strokeStyle = `rgba(255,${100 + Math.random() * 100},0,${0.2 + Math.random() * 0.3})`; ctx.lineWidth = 1 + Math.random() * 2; ctx.beginPath(); ctx.moveTo(330, cy + (Math.random() - 0.5) * 20); ctx.lineTo(330 + Math.random() * 70, cy + (Math.random() - 0.5) * 50); ctx.stroke(); }
    if (cooling) { ctx.strokeStyle = `${T.cyan}44`; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.strokeRect(132, cy - 27, 116, 54); ctx.setLineDash([]); ctx.font = `8px ${FONT}`; ctx.fillStyle = T.cyan; ctx.fillText("ACTIVE COOLING", 140, cy - 30); }
    for (let i = 0; i < 3; i++) { const sx = 340 + i * 22; ctx.strokeStyle = `rgba(255,200,100,${0.3 - i * 0.08})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, cy - 8 + i * 2); ctx.lineTo(sx + 8, cy); ctx.lineTo(sx, cy + 8 - i * 2); ctx.lineTo(sx - 8, cy); ctx.closePath(); ctx.stroke(); }
    ctx.font = `bold 9px ${FONT}`; ctx.textAlign = "center"; ctx.fillStyle = T.cyan; ctx.fillText("INLET", 50, cy + 50); ctx.fillStyle = T.gray; ctx.fillText("ISOLATOR", 105, cy + 50); ctx.fillStyle = T.orange; ctx.fillText("COMBUSTOR", 190, cy + 50); ctx.fillStyle = T.accent; ctx.fillText("NOZZLE", 290, cy + 50); ctx.textAlign = "left";
  }, [mach, fuelType, cooling]);

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
  </div>);
}
