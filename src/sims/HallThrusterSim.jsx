import { useState, useCallback, useMemo } from "react";
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

  const {
    q,
    m_kg,
    vExhaust,
    isp,
    powerW,
    mdot_kg_s,
    thrustMN,
    beamPower,
    totalEff,
    specPower,
    tpRatio,
    optMag,
    magEff,
    containment,
  } = useMemo(() => {
    const q = 1.602e-19;
    const m_kg = current.mass * 1.66e-27;
    const vExhaust = Math.sqrt((2 * q * voltage) / m_kg);
    const isp = Math.round(vExhaust / 9.81);

    const powerW = voltage * 4.5;
    const mdot_kg_s = 5e-6;
    const thrustMN = Number((mdot_kg_s * vExhaust * 1000).toFixed(1));
    const beamPower = 0.5 * mdot_kg_s * vExhaust * vExhaust;
    const totalEff = Math.round((beamPower / powerW) * 100);
    const specPower = Number((powerW / (thrustMN / 1000)).toFixed(0));
    const tpRatio = Number((thrustMN / powerW * 1000).toFixed(1));

    const optMag = voltage * 0.5;
    const magEff = Number(
      (1 - 0.3 * Math.pow((magField - optMag) / optMag, 2)).toFixed(2)
    );

    const containment = Math.max(0.15, Math.min(1, 0.4 + (magEff - 0.5)));

    return {
      q,
      m_kg,
      vExhaust,
      isp,
      powerW,
      mdot_kg_s,
      thrustMN,
      beamPower,
      totalEff,
      specPower,
      tpRatio,
      optMag,
      magEff,
      containment,
    };
  }, [current, voltage, magField]);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = W * 0.35;
      const cy = H * 0.5;
      const outerR = 78;
      const innerR = 36;
      const exitX = cx + outerR + 24;
      const pulse = (frame * 0.08) % 24;
      const ionDensity = Math.min(1, mdot_kg_s / 5e-6);
      const particleSpeed = Math.max(4, Math.round(vExhaust / 20000));

      // Annular channel top view
      ctx.lineWidth = 4;
      ctx.strokeStyle = theme.canvasSurface;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.stroke();

      // Inner and outer wall shading
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.arc(cx, cy, outerR - 6, 0, Math.PI * 2);
      ctx.arc(cx, cy, innerR + 6, 0, Math.PI * 2, true);
      ctx.fill();

      // Anode at back (left edge)
      ctx.save();
      ctx.translate(cx - outerR - 12, cy);
      ctx.fillStyle = "rgba(255,140,30,0.95)";
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,180,80,0.75)";
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Cathode at exit
      ctx.fillStyle = "rgba(100, 180, 255, 0.95)";
      ctx.beginPath();
      ctx.arc(exitX + 16, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i += 1) {
        const a = (Math.PI * 2 / 6) * i;
        const sx = exitX + 16 + Math.cos(a) * 12;
        const sy = cy + Math.sin(a) * 12;
        ctx.fillStyle = "rgba(160,220,255,0.65)";
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Magnetic field lines (purple curved arrows)
      ctx.strokeStyle = "rgba(163, 100, 255, 0.85)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i += 1) {
        const start = -Math.PI * 0.8 + i * 0.3;
        const end = start + 0.4;
        const sx = cx + Math.cos(start) * (innerR + 8);
        const sy = cy + Math.sin(start) * (innerR + 8);
        const ex = cx + Math.cos(end) * (outerR - 8);
        const ey = cy + Math.sin(end) * (outerR - 8);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        const arrow = 6;
        const angle = Math.atan2(ey - cy, ex - cx);
        ctx.lineTo(ex - Math.cos(angle - 0.4) * arrow, ey - Math.sin(angle - 0.4) * arrow);
        ctx.lineTo(ex - Math.cos(angle + 0.4) * arrow, ey - Math.sin(angle + 0.4) * arrow);
        ctx.fillStyle = "rgba(163, 100, 255, 0.85)";
        ctx.fill();
      }

      // Electric field arrow horizontal
      ctx.strokeStyle = "rgba(87, 222, 137, 0.9)";
      ctx.fillStyle = "rgba(87, 222, 137, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - outerR - 8, cy + outerR + 22);
      ctx.lineTo(exitX + 40, cy + outerR + 22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(exitX + 40, cy + outerR + 22);
      ctx.lineTo(exitX + 34, cy + outerR + 18);
      ctx.lineTo(exitX + 34, cy + outerR + 26);
      ctx.closePath();
      ctx.fill();
      ctx.font = `700 10px ${TECH_FONT}`;
      ctx.fillText("E FIELD", cx - outerR + 4, cy + outerR + 18);

      // Labels inside annular channel
      ctx.font = `700 11px ${TECH_FONT}`;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText("E × B DRIFT REGION", cx - 42, cy - innerR * 0.45);
      ctx.fillText("ACCELERATION ZONE", exitX + 8, cy + 4);

      // Ion beam particles in plume cone
      const coneAngle = Math.PI / 6;
      const beamX0 = exitX - 8;
      const beamY0 = cy;
      const density = 42 + Math.round(18 * ionDensity);
      for (let i = 0; i < density; i += 1) {
        const radial = (i / density) * (outerR + 40);
        const angle = -coneAngle + Math.random() * coneAngle * 2;
        const bx = beamX0 + radial * Math.cos(angle) + (pulse * 1.3);
        const by = beamY0 + radial * Math.sin(angle) + Math.sin(i * 6 + frame * 0.12) * 4;
        const size = 1.2 + Math.random() * 1.4;
        const alpha = 0.8 - radial / (outerR + 40);
        ctx.globalAlpha = Math.max(0.18, alpha * ionDensity);
        ctx.fillStyle = current.color;
        ctx.beginPath();
        ctx.arc(bx, by, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Exit divergence cone
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(beamX0, cy);
      ctx.lineTo(beamX0 + 180, cy - 180 * Math.tan(coneAngle));
      ctx.moveTo(beamX0, cy);
      ctx.lineTo(beamX0 + 180, cy + 180 * Math.tan(coneAngle));
      ctx.stroke();
      ctx.setLineDash([]);

      // Numeric readouts
      ctx.fillStyle = T.white;
      ctx.font = `700 11px ${TECH_FONT}`;
      ctx.fillText(`Thrust ${thrustMN} mN`, 18, 28);
      ctx.fillText(`η ${totalEff}%`, 18, 46);
      ctx.fillText(`T/P ${tpRatio} mN/kW`, 18, 64);
      ctx.fillText(`Pwr ${powerW} W`, 18, 82);
      ctx.fillText(`B-field eff ${Math.round(magEff * 100)}%`, 18, 100);
      ctx.fillText(`v_e ${Math.round(vExhaust / 1000)} km/s`, 18, 118);

      // Gas legend
      ctx.fillStyle = current.color;
      ctx.fillText(`${current.label} (${current.symbol})`, 18, H - 14);
    },
    [current, voltage, magField, containment, vExhaust, thrustMN, totalEff, tpRatio, powerW, magEff],
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
4. Electron Containment Factor: ${(containment * 100).toFixed(0)}%
5. Calculated Isp: ${isp} s
6. Thrust: ${thrustMN} mN
7. Total Efficiency: ${totalEff}%
8. Specific Power: ${specPower} W/mN
9. Thrust-to-Power: ${tpRatio} mN/kW

ANALYSIS REQUEST:
Part 1 — PHYSICS: Explain the E×B drift region and how electrons are magnetically trapped while ${current.symbol}+ ions are accelerated through the exit plane.
Part 2 — EFFICIENCY: Compare the meaning of total efficiency, specific power, and thrust-to-power ratio for Hall thrusters.
Part 3 — APPLICATION: Discuss why Xenon is the preferred propellant and what tradeoffs Krypton or Argon bring for ISRO station-keeping and deep space missions.
`,
    [current, voltage, magField, containment, isp, thrustMN, totalEff, specPower, tpRatio],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={520} height={280} maxWidth={520} />
      
      <PillRow>
        <Pill active={gas === "xe"} onClick={() => setGas("xe")} color={T.purple}>Xenon</Pill>
        <Pill active={gas === "kr"} onClick={() => setGas("kr")} color={T.cyan}>Krypton</Pill>
        <Pill active={gas === "ar"} onClick={() => setGas("ar")} color={T.orange}>Argon</Pill>
      </PillRow>

      <Slider label="Discharge Voltage" value={voltage} onChange={setVoltage} min={100} max={800} step={10} unit=" V" color={T.cyan} />
      <Slider label="Radial Magnetic Field" value={magField} onChange={setMagField} min={50} max={300} step={10} unit=" Gauss" color={T.accent} />
      
      <DataRow>
        <DataBox label="Thrust" value={thrustMN} unit="mN" color={T.orange} />
        <DataBox label="η" value={totalEff} unit="%" color={totalEff > 50 ? T.green : totalEff > 30 ? T.orange : T.red} />
        <DataBox label="T/P" value={tpRatio} unit="mN/kW" color={T.cyan} />
      </DataRow>

      <DataRow>
        <DataBox label="Isp" value={isp} unit="s" color={T.purple} />
        <DataBox label="Spec P" value={specPower} unit="W/mN" color={T.gold} />
        <DataBox label="Power" value={powerW} unit="W" color={T.accent} />
      </DataRow>

      <InfoBox color={T.cyan}>
        <strong>Hall-Effect Thrusters</strong> produce millinewton-level thrust by accelerating ions across an electric field while magnetic containment traps electrons. Higher efficiency reduces required electrical power, while a better thrust-to-power ratio directly improves station-keeping lifetime for satellites.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn
        simId="hallthruster"
        getData={() => ({
          gas,
          voltage,
          magField,
          isp,
          thrustMN,
          totalEff,
          specPower,
          tpRatio,
          magEff,
        })}
        color={T.cyan}
      />
    </div>
  );
}
