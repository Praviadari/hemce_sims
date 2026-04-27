import { useState, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function HallThrusterSim() {
  const [gas, setGas] = useState("xe");
  const [voltage, setVoltage] = useState(300); // Volts
  const [magField, setMagField] = useState(150); // Gauss

  const gasData = {
    xe: { mass: 131.29, ionEnergy: 12.1, symbol: "Xe", color: "#B794F4", label: "Xenon" },
    kr: { mass: 83.79,  ionEnergy: 14.0, symbol: "Kr", color: "#63B3ED", label: "Krypton" },
    ar: { mass: 39.94,  ionEnergy: 15.7, symbol: "Ar", color: "#F6AD55", label: "Argon" },
  };

  const current = gasData[gas];

  // Physics: Force = voltage drift, Isp depends on V and mass.
  // v_e = sqrt(2 * q * V / m)
  // q = 1.6e-19 C
  // amu = 1.66e-27 kg
  const q = 1.602e-19;
  const m_kg = current.mass * 1.66e-27;
  
  const vExhaust = Math.sqrt((2 * q * voltage) / m_kg); // m/s
  const isp = Math.round(vExhaust / 9.81);
  
  // Power scaling
  const powerW = voltage * 4.5; // generic assumption 4.5A current
  // Thrust = 2 * eff * Power / v_e
  const eff = 0.6;
  const thrust_mN = Math.round((2 * eff * powerW / vExhaust) * 1000); // milliNewtons

  // Larmor radius (electron containment efficiency scaling with B-field)
  // Higher B field (up to a point) traps electrons better via ExB drift
  const containment = Math.min(1.0, magField / 200);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = 80;
      const cy = H / 2;
      const t = frame * 0.05;

      // Draw Thruster Cross-section
      ctx.fillStyle = "#A0AEC0";
      // Outer Pole
      ctx.fillRect(cx - 20, cy - 60, 40, 20);
      ctx.fillRect(cx - 20, cy + 40, 40, 20);
      // Inner Pole
      ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI*2); ctx.fill();

      // Magnetic Field Lines (B-field)
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      // curving from inner to outer pole
      ctx.moveTo(cx, cy - 15); ctx.quadraticCurveTo(cx+20, cy-25, cx, cy-40);
      ctx.moveTo(cx, cy + 15); ctx.quadraticCurveTo(cx+20, cy+25, cx, cy+40);
      ctx.stroke();

      // ExB Drift Ring (Electrons trapped)
      const driftLuma = Math.round(150 + containment * 105);
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(${driftLuma}, ${driftLuma}, 255, 0.8)`;
      ctx.strokeStyle = `rgba(200, 200, 255, ${containment})`;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy - 25, 5, 12, 0, 0, Math.PI*2);
      ctx.ellipse(cx, cy + 25, 5, 12, 0, 0, Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Ion plume (Exhaust)
      // Plume velocity scales visually
      const plumeSpeed = (voltage / 100) + 2;
      ctx.globalCompositeOperation = "screen";
      
      for(let i=0; i<40; i++) {
         const py = cy + (i < 20 ? -25 : 25) + (Math.sin(i*7)*10);
         const px = cx + ((t * plumeSpeed * 10 + i * 8) % 300);
         
         const alpha = Math.max(0, 1 - (px - cx) / 250) * containment;
         
         ctx.fillStyle = current.color;
         ctx.globalAlpha = alpha * 0.8;
         ctx.beginPath();
         ctx.arc(px, py, 2 + px*0.01, 0, Math.PI*2);
         ctx.fill();
         
         // Trail
         ctx.fillRect(px - plumeSpeed*2, py - 0.5, plumeSpeed*2, 1);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;

      // External Cathode Neutralizer
      ctx.fillStyle = "#ED8936";
      ctx.fillRect(cx - 10, cy - 70, 10, 5);
      ctx.strokeStyle = "#ED8936";
      ctx.beginPath(); ctx.moveTo(cx, cy - 67); ctx.lineTo(cx + 20, cy - 25); ctx.stroke();

      // Text labels
      ctx.font = `9px ${TECH_FONT}`;
      ctx.fillStyle = T.white;
      ctx.fillText("ANODE", cx - 40, cy);
      ctx.fillText("Neutralizer", cx - 40, cy - 72);
      
      // Plume stats
      ctx.fillStyle = current.color;
      ctx.fillText(`${current.symbol}+ Ions @ ${Math.round(vExhaust/1000)} km/s`, cx + 180, cy - 40);

    },
    [gas, voltage, magField, current, containment, vExhaust],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Hall-Effect Thruster electric propulsion simulation — current parameters:
ROLE: "You are an electric propulsion systems engineer. You are familiar with ISRO's EPS (Electric Propulsion System) satellites."

PARAMETERS:
1. Propellant Gas: ${current.label} (${current.mass} AMU, Ion. Energy: ${current.ionEnergy} eV)
2. Discharge Voltage: ${voltage} V
3. Radial Magnetic Field: ${magField} Gauss
4. Electron Containment Factor: ${(containment*100).toFixed(0)}%
5. Calculated Isp: ${isp} s
6. Est. Thrust: ${thrust_mN} mN
7. Operating Power: ${powerW} W

ANALYSIS REQUEST:
Part 1 — PHYSICS: Explain the ExB drift mechanism and how the orthogonal electric/magnetic fields accelerate the heavy ${current.symbol}+ ions while trapping electrons.
Part 2 — PROPELLANT TRADEOFF: Contrast Xenon against Krypton or Argon. Why is Xenon standard, and why is the industry looking at cheaper alternatives despite lower Isp and higher ionization energy?
Part 3 — ISRO CONTEXT: Reference ISRO's GSAT-9 or GSAT-20 which utilize Russian or indigenous Station Keeping Thrusters (SPT). What is the mass saving benefit of 1500s+ Isp over chemical bipropellants?`,
    [gas, voltage, magField, current, containment, isp, thrust_mN, powerW],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={180} maxWidth={460} />
      
      <PillRow>
        <Pill active={gas === "xe"} onClick={() => setGas("xe")} color={T.purple}>Xenon</Pill>
        <Pill active={gas === "kr"} onClick={() => setGas("kr")} color={T.cyan}>Krypton</Pill>
        <Pill active={gas === "ar"} onClick={() => setGas("ar")} color={T.orange}>Argon</Pill>
      </PillRow>

      <Slider label="Discharge Voltage" value={voltage} onChange={setVoltage} min={100} max={800} step={10} unit=" V" color={T.cyan} />
      <Slider label="Radial Magnetic Field" value={magField} onChange={setMagField} min={50} max={300} step={10} unit=" Gauss" color={T.accent} />
      
      <DataRow>
        <DataBox label="Isp" value={isp} unit="s" color={T.accent} />
        <DataBox label="v_e" value={Math.round(vExhaust/1000)} unit="km/s" color={T.purple} />
        <DataBox label="Thrust" value={thrust_mN} unit="mN" color={T.gold} />
        <DataBox label="Power" value={powerW} unit="W" color={T.cyan} />
      </DataRow>

      <InfoBox color={T.cyan}>
        <strong>Hall-Effect Thrusters (HET)</strong> utilize radial magnetic fields to trap electrons in an azimuthal **ExB drift**. This creates a virtual cathode, ionizing injected noble gases (e.g., Xenon) and subsequently accelerating the heavy ions via the applied voltage field. HETs generate practically imperceptible thrust, but at Astronomical Specific Impulses (1500-3000s), saving enormous mass for satellite station-keeping (like ISRO GSATs).
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="hallthruster" getData={() => ({ gas, voltage, magField, isp, thrust_mN })} color={T.cyan} />
    </div>
  );
}
