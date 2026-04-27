import { useState, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function HypersonicTPSSim() {
  const [mach, setMach] = useState(10);
  const [altitude, setAltitude] = useState(30); // km
  const [material, setMaterial] = useState("c_c");

  const matData = {
    c_c: { density: 1.8,  ablHeof: 35, limitT: 2800, label: "Carbon-Carbon", color: "#4A5568" },
    si_ph: { density: 1.6,  ablHeof: 15, limitT: 1900, label: "Silica Phenolic", color: "#F6E05E" },
    sla: { density: 0.25, ablHeof: 10, limitT: 1200, label: "SLA-561V Cork", color: "#ED8936" }, 
  };

  const current = matData[material];

  // Rough standard atmospheric density model (kg/m^3)
  const T0 = 288.15, L = 0.0065, p0 = 101325, M = 0.02896, R = 8.314, g = 9.806;
  let D_rho;
  if(altitude < 11) {
    const Talt = T0 - L * (altitude*1000);
    D_rho = (p0 * Math.pow(1 - (L*(altitude*1000))/T0, (g*M)/(R*L))) / ((R/M)*Talt);
  } else {
    // simplified exponential drop for stratosphere+
    D_rho = 1.225 * Math.exp(-(altitude * 1000) / 7200); // Very rough US standard scaling
  }

  const speedSound = 340; // roughly
  const velocity = mach * speedSound;

  // Stagnation heat flux roughly scales with (Density)^0.5 * (Velocity)^3
  // Normalize to some visually reasonable range for watts/cm^2
  const heatFluxKwCm2 = Math.round((Math.sqrt(D_rho) * Math.pow(velocity, 3) * 1.83e-8) / 1000);
  const shockTemp = Math.round(velocity * velocity / 2000 + 300); // Rough T stagnation 
  
  // Ablation rate mm/sec. Function of Heat Flux / Heat of Ablation
  const ablRate = heatFluxKwCm2 > 0 ? Math.round(((heatFluxKwCm2 * 10) / current.ablHeof) * 10) / 10 : 0;
  const isSurviving = shockTemp < current.limitT || ablRate < 5.0; // Fails if reciting too fast or melting

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = 80;
      const cy = H / 2;
      const t = frame * 0.05;

      // Draw Airflow Shockwave
      const shockDistance = cx - 20 - (mach - 5)*2; 

      ctx.fillStyle = `rgba(237, 137, 54, ${Math.min(1, heatFluxKwCm2/10)})`;
      ctx.beginPath();
      ctx.moveTo(shockDistance, cx - 60);
      ctx.quadraticCurveTo(cx - 30, cy, shockDistance, cx + 60);
      ctx.lineTo(W, cx + 60);
      ctx.lineTo(W, cx - 60);
      ctx.fill();
      
      // Plasma core glow at stagnation point
      if (mach > 5) {
          const plasma = ctx.createRadialGradient(cx-15, cy, 0, cx-15, cy, Math.min(60, mach*4));
          plasma.addColorStop(0, T.white);
          plasma.addColorStop(0.2, T.cyan);
          plasma.addColorStop(1, "transparent");
          ctx.fillStyle = plasma;
          ctx.fillRect(cx-60, cy-60, 100, 120);
      }

      // Draw HGV Wedge Profile
      ctx.fillStyle = isSurviving ? current.color : T.red;
      ctx.beginPath();
      
      // Erosion visual effect (nose becomes blunter and shorter as ablRate increases)
      // Visual illusion loop
      const erosionT = (frame * 0.02 * ablRate) % 5;
      const noseX = cx - 10 + erosionT;
      
      ctx.moveTo(noseX, cy);
      ctx.lineTo(noseX + 60, cy - 30);
      ctx.lineTo(W, cy - 30);
      ctx.lineTo(W, cy + 30);
      ctx.lineTo(noseX + 60, cy + 30);
      ctx.closePath();
      ctx.fill();

      // Striations/Debris coming off nose demonstrating ablation
      if (ablRate > 0) {
         ctx.fillStyle = "rgba(255,255,255,0.4)";
         for(let i=0; i<10; i++) {
             const dbX = noseX + ((t * 80 + i*15) % 80);
             const dbY = cy + (Math.sin(dbX*0.2)*(noseX-dbX)*0.2) + (i%2 ? -1 : 1)*(i*2);
             ctx.beginPath(); ctx.arc(dbX, dbY, 1, 0, Math.PI*2); ctx.fill();
         }
      }

      // Convective flow lines
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 1;
      for (let i = -1; i <= 1; i += 2) {
          ctx.beginPath();
          ctx.moveTo(cx - 40, cy + i*10);
          ctx.quadraticCurveTo(cx - 20, cy + i*15, cx, cy + i*25);
          ctx.lineTo(W, cy + i*35);
          ctx.stroke();
      }

      // HUD Stats on Canvas
      ctx.fillStyle = "#FFF";
      ctx.font = `bold 10px ${TECH_FONT}`;
      ctx.fillText(`STAGNATION: ${shockTemp} °K`, 10, 20);
      
      if (!isSurviving) {
          ctx.fillStyle = T.red;
          ctx.fillText(`⚠ THERMAL LIMIT EXCEEDED`, 10, 35);
      }

    },
    [mach, altitude, current, isSurviving, shockTemp, heatFluxKwCm2, ablRate],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Hypersonic Glide Vehicle (HGV) Thermal Protection System (TPS) simulation — current parameters:
ROLE: "You are a hypersonics thermal engineer mapping TPS materials for DRDO's Hypersonic Technology Demonstrator Vehicle (HSTDV) or Agni payloads."

PARAMETERS:
1. Coast Velocity: Mach ${mach} (${velocity} m/s)
2. Altitude: ${altitude} km (Atmospheric Density: ${D_rho.toExponential(2)} kg/m³)
3. TPS Material: ${current.label}
4. Computed Stagnation Temp: ${shockTemp} K
5. Convective Heat Flux (q_dot): ${heatFluxKwCm2} kW/cm²
6. Recession/Ablation Rate: ${ablRate} mm/s

ANALYSIS REQUEST:
Part 1 — AEROTHERMODYNAMICS: Explain how heat flux scales cubically with velocity, making low-altitude hypersonic flight exponentially harder than high-altitude.
Part 2 — ABLATIVE SHIELDING: This TPS is ablating at ${ablRate} mm/s. How does the process of sublimation and off-gassing form a cooler boundary layer to protect the aerodynamic core?
Part 3 — CARBON-CARBON: Why are 2D/3D Carbon-Carbon composites the gold standard for Re-Entry Vehicles (RVs) thermal management, replacing older silica/phenolic systems?`,
    [mach, altitude, velocity, current, shockTemp, heatFluxKwCm2, ablRate, D_rho],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={160} maxWidth={460} />
      
      <PillRow>
        <Pill active={material === "c_c"} onClick={() => setMaterial("c_c")} color={T.gray}>Carbon-Carbon</Pill>
        <Pill active={material === "si_ph"} onClick={() => setMaterial("si_ph")} color={T.gold}>Silica Phenolic</Pill>
        <Pill active={material === "sla"} onClick={() => setMaterial("sla")} color={T.orange}>SLA-561V Cork</Pill>
      </PillRow>

      <Slider label="Velocity (Mach)" value={mach} onChange={setMach} min={4} max={25} step={1} unit=" M" color={T.red} />
      <Slider label="Altitude (Density gradient)" value={altitude} onChange={setAltitude} min={5} max={80} step={1} unit=" km" color={T.cyan} />
      
      <DataRow>
        <DataBox label="Heat Flux" value={heatFluxKwCm2} unit="kW/cm²" color={heatFluxKwCm2 > 10 ? T.red : T.orange} />
        <DataBox label="T_stag" value={shockTemp} unit="K" color={T.accent} />
        <DataBox label="Ablation" value={ablRate.toFixed(1)} unit="mm/s" color={ablRate > 2 ? T.red : T.cyan} />
        <DataBox label="V_flight" value={velocity} unit="m/s" color={T.purple} />
      </DataRow>

      <InfoBox color={T.cyan}>
        <strong style={{color: T.orange}}>Hypersonic Aerothermodynamics:</strong> Above Mach 5, the kinetic energy of air violently compressing forms plasma shockwaves. The convective heat transfer ($q_c \approx \rho^{0.5} V^3$) reaches extremes where no structural steel/titanium survives. TPS elements (like Carbon-Carbon) are designed to sublimate (Phase change to gas), carrying the intense heat away from the vehicle via the boundary layer.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="hypersonic_tps" getData={() => ({ mach, altitude, material, heatFluxKwCm2, shockTemp, ablRate })} color={T.cyan} />
    </div>
  );
}
