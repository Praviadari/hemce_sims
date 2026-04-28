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

  const surfaceTemp = shockTemp;
  const recession = surfaceTemp > current.limitT ? Number(((surfaceTemp - current.limitT) / current.ablHeof * 0.01).toFixed(2)) : 0;
  const tpsThickness = 25;
  const burnThrough = recession > 0 ? (tpsThickness / recession).toFixed(0) : "∞";
  const shockStandoff = 0.15 / (mach * 0.1);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const leftW = W * 0.5;
      const rightX = W * 0.55;
      const noseCenterY = H * 0.45;
      const noseRadius = leftW * 0.22;
      const tpsThicknessPx = 20;
      const structureDepth = 18;
      const ablateActive = surfaceTemp > current.limitT;
      const waveX = 30 + shockStandoff * 24;

      // Bow shock standoff line
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(255,220,150,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(waveX, noseCenterY, noseRadius + 18, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
      ctx.setLineDash([]);

      // Nose cone and TPS cross-section
      const noseLeft = 40;
      const noseRight = noseLeft + noseRadius * 1.8;
      const noseTop = noseCenterY - noseRadius;
      const noseBottom = noseCenterY + noseRadius;

      // Outer TPS gradient
      const tpsOuter = noseRadius + tpsThicknessPx * 0.6;
      const faceGrad = ctx.createLinearGradient(noseLeft, noseCenterY, noseRight, noseCenterY);
      faceGrad.addColorStop(0, "rgba(255,255,255,0.95)");
      faceGrad.addColorStop(0.4, "rgba(255,120,90,0.88)");
      faceGrad.addColorStop(1, "rgba(20,120,200,0.3)");
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.moveTo(noseLeft, noseCenterY);
      ctx.quadraticCurveTo(noseLeft + noseRadius, noseTop, noseRight, noseCenterY);
      ctx.quadraticCurveTo(noseLeft + noseRadius, noseBottom, noseLeft, noseCenterY);
      ctx.fill();

      // TPS layer band
      const bandGradient = ctx.createLinearGradient(noseLeft, noseCenterY - noseRadius, noseLeft, noseCenterY + noseRadius);
      bandGradient.addColorStop(0, "rgba(255,120,0,0.95)");
      bandGradient.addColorStop(0.5, "rgba(245,140,80,0.85)");
      bandGradient.addColorStop(1, "rgba(80,160,255,0.5)");
      ctx.strokeStyle = bandGradient;
      ctx.lineWidth = tpsThicknessPx;
      ctx.beginPath();
      ctx.arc(noseLeft + noseRadius, noseCenterY, noseRadius + tpsThicknessPx / 2, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();

      // Structure layer
      ctx.fillStyle = "rgba(120,128,145,0.95)";
      ctx.beginPath();
      ctx.arc(noseLeft + noseRadius, noseCenterY, noseRadius - structureDepth, Math.PI * 0.6, Math.PI * 1.4);
      ctx.lineTo(noseLeft + noseRadius, noseCenterY + (noseRadius - structureDepth));
      ctx.closePath();
      ctx.fill();

      // Stagnation point glow
      const glow = ctx.createRadialGradient(noseLeft, noseCenterY, 0, noseLeft, noseCenterY, 26);
      glow.addColorStop(0, "rgba(255,255,255,1)");
      glow.addColorStop(0.2, "rgba(255,90,20,0.9)");
      glow.addColorStop(1, "rgba(255,90,20,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(noseLeft, noseCenterY, 30, 0, Math.PI * 2);
      ctx.fill();

      // Nose tip surface
      ctx.fillStyle = ablateActive ? T.red : T.white;
      ctx.beginPath();
      ctx.arc(noseLeft, noseCenterY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Ablation layer and particles
      const ablated = ablateActive ? Math.min(12, frame * 0.08) : 0;
      if (ablateActive) {
        ctx.fillStyle = "rgba(180, 40, 30, 0.8)";
        ctx.beginPath();
        ctx.arc(noseLeft + ablated * 0.8, noseCenterY, noseRadius * 0.24, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 14; i += 1) {
          const px = noseLeft + noseRadius + 10 + prng(frame, i) * 40 + (frame * 0.9 % 40);
          const py = noseCenterY + (i - 7) * 3 + Math.sin(frame * 0.1 + i) * 2;
          ctx.fillStyle = "rgba(255, 180, 120, 0.7)";
          ctx.beginPath();
          ctx.arc(px, py, 2 + prng(frame, i + 1), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = T.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(noseLeft + noseRadius - 10, noseCenterY + noseRadius + 12);
        ctx.lineTo(noseLeft + noseRadius - 18, noseCenterY + noseRadius + 12);
        ctx.lineTo(noseLeft + noseRadius - 18, noseCenterY + noseRadius + 6);
        ctx.stroke();
      }

      // Material state label
      ctx.font = `700 12px ${TECH_FONT}`;
      ctx.fillStyle = ablateActive ? T.red : T.green;
      ctx.textAlign = "center";
      ctx.fillText(ablateActive ? "ABLATION ACTIVE" : "TPS INTACT", leftW * 0.5, H - 18);

      // Temperature profile plot
      const profileX = rightX;
      const profileY = 24;
      const profileW = W - rightX - 24;
      const profileH = H * 0.6;
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.strokeRect(profileX, profileY, profileW, profileH);

      const stagTemp = surfaceTemp;
      ctx.beginPath();
      for (let i = 0; i <= 40; i += 1) {
        const depth = i / 40;
        const temp = stagTemp * Math.exp(-depth * 2.8);
        const x = profileX + (temp / stagTemp) * profileW;
        const y = profileY + depth * profileH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = T.red;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "rgba(220,38,38,0.2)";
      ctx.beginPath();
      ctx.moveTo(profileX, profileY);
      for (let i = 0; i <= 40; i += 1) {
        const depth = i / 40;
        const temp = stagTemp * Math.exp(-depth * 2.8);
        const x = profileX + (temp / stagTemp) * profileW;
        const y = profileY + depth * profileH;
        if (i === 0) ctx.lineTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(profileX, profileY + profileH);
      ctx.closePath();
      ctx.fill();

      const limitX = profileX + (current.limitT / stagTemp) * profileW;
      const safeX = profileX + (150 + 273) / stagTemp * profileW;
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(limitX, profileY);
      ctx.lineTo(limitX, profileY + profileH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(safeX, profileY);
      ctx.lineTo(safeX, profileY + profileH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = T.white;
      ctx.font = `700 10px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText("Temperature profile", profileX, profileY - 8);
      ctx.fillText(`Limit ${current.limitT} K`, limitX + 4, profileY + 14);
      ctx.fillText("Safe 150°C", safeX + 4, profileY + 28);

      // Cross-section details
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(noseLeft - 4, noseCenterY + noseRadius + 18, noseRight - noseLeft + 4, 12);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(noseLeft - 4, noseCenterY + noseRadius + 18, (noseRight - noseLeft + 4) * 0.5, 12);
      ctx.fillStyle = T.white;
      ctx.font = `600 9px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("TPS Cross-Section", noseLeft + noseRadius, noseCenterY + noseRadius + 12);

      ctx.fillStyle = theme.canvasSurface;
      ctx.font = `700 10px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(`Bow Shock: ${shockStandoff.toFixed(2)} m`, 10, 18);
      ctx.fillText(`Recession: ${recession} mm/s`, 10, 36);
      ctx.fillText(`Burn-thru: ${burnThrough} s`, 10, 54);
    },
    [mach, altitude, current, surfaceTemp, shockTemp, heatFluxKwCm2, ablRate, recession, burnThrough, nano, sensitivity],
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
      <SimCanvas canvasRef={canvasRef} width={520} height={260} maxWidth={520} />
      
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
        <DataBox label="Recession" value={recession} unit="mm/s" color={recession > 0 ? T.red : T.green} />
        <DataBox label="Burn-thru" value={burnThrough} unit="s" color={burnThrough !== "∞" && Number(burnThrough) < 60 ? T.red : T.green} />
      </DataRow>
      <DataRow>
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
