import { useState, useCallback, useMemo } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function WaterRamjetSim() {
  const [fuel, setFuel] = useState("mg_ptfe");
  const [cruiseSpeed, setCruiseSpeed] = useState(100);
  const [waterRatio, setWaterRatio] = useState(1.5);
  const [depth, setDepth] = useState(50);
  const [running, setRunning] = useState(true);

  // Fuel properties
  const fuelData = {
    mg_ptfe:      { energy: 24.7, density: 1.85, tFlame: 2800, ignDelay: 0.8, label: "Mg/PTFE" },
    al_polyester: { energy: 31.0, density: 2.10, tFlame: 3200, ignDelay: 2.5, label: "Al/Polyester" },
    mg_al_mix:    { energy: 27.5, density: 1.95, tFlame: 3000, ignDelay: 1.2, label: "Mg-Al Mix" },
    li_hydride:   { energy: 43.0, density: 0.92, tFlame: 2600, ignDelay: 3.0, label: "LiAlH₄" },
  };
  const fd = a => fuelData[a] || fuelData.mg_ptfe;
  const currentFd = fd(fuel);

  // Stagnation (ram) pressure from cruise speed
  const rhoWater = 1025; // kg/m³ seawater
  const pStag = 0.5 * rhoWater * cruiseSpeed * cruiseSpeed; // Pa
  const pStagMPa = (pStag / 1e6).toFixed(2);

  // Hydrostatic back-pressure from depth
  const pDepth = rhoWater * 9.81 * depth; // Pa
  const pDepthMPa = (pDepth / 1e6).toFixed(2);

  // Net chamber pressure
  const pChamber = Math.max(0, pStag - pDepth);
  const pChamberMPa = (pChamber / 1e6).toFixed(2);
  const canOperate = pChamber > 100000 && running;

  // Combustion temperature
  const optimalWP = fuel === "al_polyester" ? 1.0 : fuel === "li_hydride" ? 0.8 : 1.5;
  const wpEfficiency = 1 - 0.25 * Math.pow(waterRatio - optimalWP, 2);
  const Tcomb = Math.round(currentFd.tFlame * Math.max(0.3, Math.min(1.0, wpEfficiency)));

  // Specific impulse
  const eta = canOperate ? Math.min(0.85, 0.4 + pChamberMPa * 0.08) : 0;
  const Ve = Math.sqrt(2 * 1500 * Tcomb * eta); // exhaust velocity
  const isp = canOperate ? Math.round(Ve / 9.81) : 0;

  // Thrust
  const mdotProp = 0.5; // kg/s
  const mdotTotal = mdotProp * (1 + waterRatio);
  const thrust = canOperate ? Math.max(0, Math.round((mdotTotal * Ve - mdotTotal * cruiseSpeed) / 1000 * 10) / 10) : 0; // kN

  // Density-specific impulse
  const rhoIsp = Math.round(isp * currentFd.density);

  // Speed regime label
  const regime = cruiseSpeed < 40 ? "CONVENTIONAL" :
                 cruiseSpeed < 80 ? "HIGH SPEED" :
                 cruiseSpeed < 120 ? "SUPERCAVITATING" : "HYPERCAVITATING";

  const regimeColor = cruiseSpeed < 40 ? T.green : cruiseSpeed < 80 ? T.gold : cruiseSpeed < 120 ? T.orange : T.red;

  const canvasRef = useCanvas((ctx, W, H, frame) => {
    const cy = H / 2;
    const theme = getCanvasTheme();

    // Background
    ctx.fillStyle = theme.canvasBackground;
    ctx.fillRect(0, 0, W, H);
    // Slight blue tint for underwater effect
    ctx.fillStyle = "rgba(0, 50, 100, 0.1)";
    ctx.fillRect(0, 0, W, H);

    // Torpedo Body
    const tLength = 200;
    const tHeight = 40;
    const tx = W / 2 - tLength / 2;
    const ty = cy - tHeight / 2;

    // Core body metallic gray
    ctx.fillStyle = "#A0AEC0";
    ctx.beginPath();
    ctx.roundRect(tx, ty, tLength, tHeight, 4);
    ctx.fill();

    // Nose Cone
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    if (cruiseSpeed > 80) {
      // Cavitator disc
      ctx.lineTo(tx - 10, ty + tHeight / 2);
    } else {
      ctx.lineTo(tx - 30, ty + tHeight / 2);
    }
    ctx.lineTo(tx, ty + tHeight);
    ctx.fill();

    // Water Inlets
    ctx.fillStyle = T.accent;
    ctx.fillRect(tx + 20, ty - 5, 20, 10);
    ctx.fillRect(tx + 20, ty + tHeight - 5, 20, 10);

    // Combustion Chamber Inner Wall
    const cbX = tx + 80;
    const cbW = 70;
    ctx.fillStyle = "#1A202C";
    ctx.fillRect(cbX, ty + 5, cbW, tHeight - 10);

    // Fuel Grain Liner
    const fColor = fuel === "mg_ptfe" ? "#A0AEC0" : fuel === "al_polyester" ? "#D6BCFA" : fuel === "mg_al_mix" ? "#F6E05E" : "#9AE6B4";
    ctx.fillStyle = fColor;
    ctx.fillRect(cbX, ty + 5, cbW, 5);
    ctx.fillRect(cbX, ty + tHeight - 10, cbW, 5);

    // Combustion Glow
    if (canOperate) {
        const glow = ctx.createLinearGradient(cbX, 0, cbX + cbW, 0);
        const mainColor = Tcomb > 3000 ? T.white : Tcomb > 2000 ? T.gold : T.orange;
        glow.addColorStop(0, "rgba(255,255,255,0.1)");
        glow.addColorStop(0.5, mainColor);
        glow.addColorStop(1, T.red);
        ctx.fillStyle = glow;
        ctx.fillRect(cbX + 10, ty + 10, cbW - 10, tHeight - 20);
    }

    // Nozzle
    ctx.fillStyle = "#4A5568";
    ctx.beginPath();
    ctx.moveTo(tx + tLength, ty + 5);
    ctx.lineTo(tx + tLength + 20, ty - 5);
    ctx.lineTo(tx + tLength + 20, ty + tHeight + 5);
    ctx.lineTo(tx + tLength, ty + tHeight - 5);
    ctx.fill();

    // Flow Animation
    // Water Ingestion
    ctx.fillStyle = T.cyan;
    for (let i = 0; i < cruiseSpeed / 10; i++) {
        const px = tx - 50 + ((frame * cruiseSpeed * 0.02 + i * 20) % 100);
        ctx.beginPath();
        ctx.arc(px, ty - 8 + Math.sin(px * 0.1) * 2, 1.5, 0, Math.PI*2);
        ctx.arc(px, ty + tHeight + 8 + Math.sin(px * 0.1) * 2, 1.5, 0, Math.PI*2);
        ctx.fill();
    }

    // Exhaust
    if (canOperate) {
        for (let i = 0; i < 30; i++) {
            const exX = tx + tLength + 20 + ((frame * Ve * 0.005 + i * 10) % 150);
            const spread = (exX - (tx + tLength + 20)) * 0.2;
            const exY = cy + (Math.random() - 0.5) * Math.max(1, spread * 2);
            ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.4)" : fColor + "80"; // Steam + gas mix
            ctx.beginPath();
            ctx.arc(exX, exY, 2 + Math.random() * 3, 0, Math.PI*2);
            ctx.fill();
        }
    } else {
        // Red X on inlets
        ctx.strokeStyle = T.red;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx + 20, ty - 10); ctx.lineTo(tx + 40, ty + 5);
        ctx.moveTo(tx + 40, ty - 10); ctx.lineTo(tx + 20, ty + 5);
        ctx.stroke();

        ctx.font = `800 10px ${TECH_FONT}`;
        ctx.fillStyle = T.red;
        ctx.textAlign = "center";
        ctx.fillText("INSUFFICIENT RAM PRESSURE", W / 2, cy + 40);
        ctx.textAlign = "left";
    }

    // Supercavitation Envelope
    if (cruiseSpeed > 80) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.ellipse(tx + tLength / 2, cy, tLength * 0.6, tHeight * 1.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = `800 8px ${MONO_FONT}`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.textAlign = "center";
        ctx.fillText("SUPERCAVITATION ENVELOPE", W / 2, cy - tHeight * 1.2);
        ctx.textAlign = "left";
    }

    // Depth Indicator (Right side)
    const dX = W - 20;
    const dY = 10;
    const dH = H - 45;
    const depthGrad = ctx.createLinearGradient(0, dY, 0, dY + dH);
    depthGrad.addColorStop(0, T.cyan);
    depthGrad.addColorStop(1, "#001a33");
    ctx.fillStyle = depthGrad;
    ctx.fillRect(dX, dY, 10, dH);

    // Depth marker
    const markerY = dY + (depth / 200) * dH;
    ctx.fillStyle = T.white;
    ctx.beginPath();
    ctx.moveTo(dX - 5, markerY);
    ctx.lineTo(dX, markerY - 3);
    ctx.lineTo(dX, markerY + 3);
    ctx.fill();

    // Bottom info strip
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, H - 25, W, 25);
    ctx.fillStyle = regimeColor;
    ctx.font = `800 10px ${TECH_FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(`${regime} REGIME (${cruiseSpeed} m/s)`, W / 2, H - 8);
    ctx.textAlign = "left";

  }, [cruiseSpeed, depth, fuel, waterRatio, canOperate, Tcomb, Ve, regime, regimeColor], { animate: true });

  const buildPrompt = useCallback(() =>
    `You are an expert in underwater water-breathing ramjet propulsion and hydro-reactive metal fuel combustion.

PARAMETERS:
- Fuel: ${currentFd.label} (Energy: ${currentFd.energy} MJ/kg, Density: ${currentFd.density} g/cc)
- Cruise Speed: ${cruiseSpeed} m/s (${regime})
- Water-to-Propellant Ratio (W/P): ${waterRatio.toFixed(1)} (Optimal: ${optimalWP})
- Depth: ${depth} m
- Operating Status: ${canOperate ? "ACTIVE" : "INSUFFICIENT RAM PRESSURE"}
- Net Ram Pressure: ${pChamberMPa} MPa
- Combustion Temp: ${Tcomb} K
- Specific Impulse (Isp): ${isp} s
- Density Isp: ${rhoIsp} kg.s/m³
- Net Thrust: ${thrust} kN

ANALYSIS REQUEST:
Please evaluate the vehicle performance at these conditions. Include in prompt: "Reference: FA01-P10 (HEMCE 2026), Eisen & Gany (Technion) water-breathing ramjet research, Shkval torpedo Mg-based propulsion". Discuss the feasibility of sustained operation at the current depth and speed, and how the selected fuel influences the energy density compared to conventional thermal propulsion systems.`,
  [currentFd, cruiseSpeed, regime, waterRatio, optimalWP, depth, canOperate, pChamberMPa, Tcomb, isp, rhoIsp, thrust]);

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={370} height={150} maxWidth={370} />

      <PillRow>
        <Pill active={fuel === "mg_ptfe"} onClick={() => setFuel("mg_ptfe")} color={T.gray}>Mg/PTFE</Pill>
        <Pill active={fuel === "al_polyester"} onClick={() => setFuel("al_polyester")} color={T.purple}>Al/Poly</Pill>
        <Pill active={fuel === "mg_al_mix"} onClick={() => setFuel("mg_al_mix")} color={T.gold}>Mg-Al Mix</Pill>
        <Pill active={fuel === "li_hydride"} onClick={() => setFuel("li_hydride")} color={T.green}>LiAlH₄</Pill>
        <Pill active={running} onClick={() => setRunning(!running)} color={running ? T.red : T.green}>{running ? "⏹ Stop" : "▶ Run"}</Pill>
      </PillRow>

      <Slider label="Cruise Speed" value={cruiseSpeed} onChange={setCruiseSpeed} min={20} max={150} unit="m/s" color={T.cyan} />
      <Slider label="Water/Fuel (W/P)" value={waterRatio} onChange={setWaterRatio} min={0.5} max={4.0} step={0.1} unit="" color={T.accent} />
      <Slider label="Depth" value={depth} onChange={setDepth} min={5} max={200} unit="m" color="#004488" />

      <DataRow>
        <DataBox label="Isp" value={canOperate ? isp : "—"} unit="s" color={T.accent} />
        <DataBox label="ρIsp" value={rhoIsp} unit="kg·s/m³" color={T.purple} />
        <DataBox label="Thrust" value={thrust.toFixed(1)} unit="kN" color={T.orange} />
        <DataBox label="P_ram" value={pStagMPa} unit="MPa" color={T.cyan} />
        <DataBox label="Tcomb" value={Tcomb} unit="K" color={Tcomb > 3000 ? T.white : Tcomb > 2000 ? T.gold : T.orange} />
        <DataBox label="Regime" value={regime} unit="" color={regimeColor} />
      </DataRow>

      {!canOperate ? (
        <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: T.red, fontFamily: TECH_FONT, margin: "8px 0" }}>
          ⚠ CANNOT OPERATE — Ram pressure ({pStagMPa} MPa) &lt; depth pressure ({pDepthMPa} MPa). Increase speed or decrease depth.
        </div>
      ) : (
        <div style={{ textAlign: "center", fontSize: 10, color: T.dimText, fontFamily: TECH_FONT, margin: "8px 0" }}>
          Optimal W/P for {currentFd.label}: {optimalWP} — Current: {waterRatio.toFixed(1)}
          {Math.abs(waterRatio - optimalWP) > 0.8 ? " ⚠ Far from optimal" : " ✓ Near optimal"}
        </div>
      )}

      <InfoBox>
        Water-breathing ramjets use seawater as both working fluid and oxidizer for hydro-reactive metal fuels (Mg, Al). At 100 m/s cruise, ram pressure reaches 5 MPa — enough to force seawater into the combustor without pumps. Achieved Isp of 485s (2× solid rockets). Russia's Shkval torpedo (200+ knots) uses Mg-based hydroreactive fuel. DRDO's SMART system and Varunastra torpedo programs are exploring advanced underwater propulsion. Paper FA01-P10 at HEMCE 2026 presents variable-thrust water-breathing engine research.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="waterjet" getData={() => ({ fuel, cruiseSpeed, waterRatio, depth, isp, thrust })} color={T.cyan} />
    </div>
  );
}
