import { useState, useCallback, useMemo } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function LiquidBiPropellantSim() {
  const [propellant, setPropellant] = useState("lox_kero");
  const [chamberP, setChamberP] = useState(10);
  const [ofRatio, setOfRatio] = useState(2.5);

  const pd = {
    lox_kero:  { opt: 2.56, tComb: 3600, ispMax: 310, color1: T.cyan, color2: T.orange, label: "LOX/Kerosene", env: "cryo" },
    lox_lh2:   { opt: 6.00, tComb: 3400, ispMax: 450, color1: T.cyan, color2: T.white, label: "LOX/LH₂", env: "cryo" },
    n2o4_mmh:  { opt: 2.16, tComb: 3200, ispMax: 320, color1: T.red, color2: T.purple, label: "N₂O₄/MMH", env: "storable" },
    udmh_n2o4: { opt: 2.60, tComb: 3300, ispMax: 310, color1: T.pink, color2: T.red, label: "N₂O₄/UDMH", env: "storable" },
  };

  const current = pd[propellant];

  const {
    ratioDelta,
    offDesignPenalty,
    isp,
    tActual,
    At,
    gamma,
    Rgas,
    mdot,
    Cf,
    thrustKN,
    cStar,
    etaMix,
  } = useMemo(() => {
    const ratioDelta = Math.abs(current.opt - ofRatio) / current.opt;
    const offDesignPenalty = Math.max(0.6, 1 - ratioDelta * 0.8);

    const pPenalty = Math.log10(Math.max(chamberP, 1));
    const isp = Math.round(
      current.ispMax *
        offDesignPenalty *
        (0.8 + 0.2 * Math.min(1, pPenalty))
    );
    const tActual = Math.round(current.tComb * offDesignPenalty);

    const At = 0.003;
    const gamma = 1.22;
    const Rgas = 360;
    const mdot =
      (chamberP * At) /
      Math.sqrt(Rgas * tActual) *
      Math.sqrt(
        gamma *
          Math.pow(2 / (gamma + 1), (gamma + 1) / (gamma - 1))
      );

    const Cf = 1.3 + 0.1 * Math.log10(Math.max(chamberP, 0.1));
    const thrustKN = Number(
      (Cf * chamberP * 1e6 * At / 1000).toFixed(1)
    );

    const cStar = Math.round(chamberP * 1e6 * At / (mdot || 0.01));
    const etaMix = Math.round(offDesignPenalty * 100);

    return {
      ratioDelta,
      offDesignPenalty,
      isp,
      tActual,
      At,
      gamma,
      Rgas,
      mdot,
      Cf,
      thrustKN,
      cStar,
      etaMix,
    };
  }, [current, chamberP, ofRatio]);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = W * 0.5;
      const leftWall = cx - 34;
      const rightWall = cx + 34;
      const topY = 24;
      const throatY = 150;
      const chamberBottom = 210;
      const flameDepth = 40 + Math.min(86, Math.max(0, (tActual - 240) * 0.14));
      const pulse = (frame * 0.04) % 20;

      // Temperature gradient bar along the chamber wall
      const tempBar = ctx.createLinearGradient(10, topY, 10, chamberBottom);
      tempBar.addColorStop(0, "rgba(255, 90, 90, 0.95)");
      tempBar.addColorStop(0.3, "rgba(255, 160, 60, 0.9)");
      tempBar.addColorStop(0.7, "rgba(255, 220, 120, 0.5)");
      tempBar.addColorStop(1, "rgba(255, 255, 255, 0.15)");
      ctx.fillStyle = tempBar;
      ctx.fillRect(8, topY, 8, chamberBottom - topY);

      // Engine contour and nozzle
      ctx.strokeStyle = theme.canvasSurface;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(leftWall, topY);
      ctx.lineTo(leftWall, throatY - 16);
      ctx.quadraticCurveTo(leftWall, throatY + 6, leftWall + 14, throatY + 24);
      ctx.lineTo(leftWall + 22, chamberBottom);
      ctx.lineTo(rightWall - 22, chamberBottom);
      ctx.quadraticCurveTo(rightWall - 14, throatY + 24, rightWall, throatY + 10);
      ctx.lineTo(rightWall, topY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightWall, throatY + 10);
      ctx.lineTo(rightWall + 12, throatY + 14);
      ctx.quadraticCurveTo(rightWall + 38, throatY + 36, rightWall + 72, chamberBottom + 18);
      ctx.lineTo(rightWall + 72, chamberBottom + 24);
      ctx.lineTo(rightWall + 16, chamberBottom + 24);
      ctx.stroke();

      // Injector plate and holes
      ctx.fillStyle = "#BCCCDC";
      ctx.fillRect(leftWall - 16, topY - 8, 32, 12);
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          const x = leftWall - 12 + col * 8;
          const y = topY - 4 + row * 6;
          ctx.beginPath();
          ctx.arc(x, y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Oxidizer and fuel streams into injector
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = current.color1;
      ctx.beginPath();
      ctx.moveTo(leftWall - 44, topY + 2);
      ctx.bezierCurveTo(leftWall - 30, topY + 12, leftWall - 14, topY + 4, leftWall - 2, topY);
      ctx.stroke();

      ctx.strokeStyle = current.color2;
      ctx.beginPath();
      ctx.moveTo(leftWall - 44, topY + 28);
      ctx.bezierCurveTo(leftWall - 28, topY + 30, leftWall - 14, topY + 18, leftWall - 2, topY + 10);
      ctx.stroke();

      // Spray cone of injected droplets
      ctx.globalAlpha = 0.75;
      for (let i = 0; i < 18; i += 1) {
        const coneX = leftWall + 6 + i * 2.8;
        const coneY = topY + 8 + i * 2.5 + ((pulse + i * 3) % 8);
        ctx.fillStyle = i % 2 === 0 ? current.color1 : current.color2;
        ctx.beginPath();
        ctx.arc(coneX, coneY, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Flame zone region after injector
      const flameStart = topY + 8;
      const flameEnd = Math.min(chamberBottom - 14, flameStart + flameDepth);
      const flameGrad = ctx.createLinearGradient(leftWall + 2, flameStart, leftWall + 2, flameEnd);
      flameGrad.addColorStop(0, "rgba(255, 255, 150, 0.98)");
      flameGrad.addColorStop(0.2, "rgba(255, 200, 80, 0.92)");
      flameGrad.addColorStop(0.55, "rgba(255, 120, 30, 0.75)");
      flameGrad.addColorStop(1, "rgba(255, 90, 20, 0.2)");
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(leftWall + 2, flameStart);
      ctx.lineTo(rightWall - 10, flameStart + 14);
      ctx.lineTo(rightWall - 14, flameEnd);
      ctx.lineTo(leftWall + 2, flameEnd);
      ctx.closePath();
      ctx.fill();

      // Inner chamber reflection
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftWall + 2, topY + 6);
      ctx.lineTo(leftWall + 2, chamberBottom - 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightWall - 2, topY + 6);
      ctx.lineTo(rightWall - 2, chamberBottom - 12);
      ctx.stroke();

      // Exhaust plume based on propellant type
      ctx.save();
      const plumeGradient = ctx.createLinearGradient(
        rightWall + 20,
        throatY + 16,
        rightWall + 100,
        chamberBottom + 28
      );
      if (current.env === "cryo" && propellant === "lox_lh2") {
        plumeGradient.addColorStop(0, "rgba(220, 240, 255, 0.95)");
        plumeGradient.addColorStop(1, "rgba(160, 210, 255, 0.08)");
      } else if (current.env === "cryo") {
        plumeGradient.addColorStop(0, "rgba(200, 230, 255, 0.95)");
        plumeGradient.addColorStop(1, "rgba(150, 190, 255, 0.08)");
      } else {
        plumeGradient.addColorStop(0, "rgba(255, 210, 160, 0.95)");
        plumeGradient.addColorStop(1, "rgba(210, 140, 80, 0.12)");
      }
      ctx.fillStyle = plumeGradient;
      ctx.beginPath();
      ctx.moveTo(rightWall + 12, throatY + 14);
      ctx.bezierCurveTo(
        rightWall + 36,
        throatY + 40,
        rightWall + 62,
        chamberBottom + 10,
        rightWall + 96,
        chamberBottom + 22
      );
      ctx.lineTo(rightWall + 96, chamberBottom + 36);
      ctx.lineTo(rightWall + 22, chamberBottom + 36);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Combustion zone ring and performance labels
      ctx.font = `700 10px ${TECH_FONT}`;
      ctx.fillStyle = T.white;
      ctx.fillText(`c* ${cStar} m/s`, 24, 42);
      ctx.fillText(`mdot ${Math.round(mdot)} kg/s`, 24, 56);
      ctx.fillText(`Cf ${Cf.toFixed(2)}`, 24, 70);
      ctx.fillText(`ηmix ${etaMix}%`, 24, 82);
      ctx.fillText(`P_c ${chamberP.toFixed(1)} MPa`, 24, 96);

      // injector markers
      ctx.font = `700 9px ${TECH_FONT}`;
      ctx.fillStyle = current.color1;
      ctx.fillText("OX", leftWall - 44, topY + 2);
      ctx.fillStyle = current.color2;
      ctx.fillText("FL", leftWall - 44, topY + 28);

      // A subtle legend
      ctx.fillStyle = T.gray;
      ctx.fillText("Injector plate", leftWall - 30, topY - 12);
      ctx.fillText("Throat", rightWall - 18, throatY + 6);
    },
    [propellant, chamberP, ofRatio, current, offDesignPenalty, tActual, mdot, Cf, cStar, etaMix],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Liquid rocket bipropellant analysis — current parameters:
ROLE: "You are an expert in liquid propulsion systems. You know DRDO, ISRO (LPSC), and advanced engine programs."

PARAMETERS:
1. Propellant mix: ${current.label} (${current.env === "cryo" ? "Cryogenic" : "Hypergolic Storable"})
2. Chamber Pressure: ${chamberP} MPa
3. O/F Ratio: ${ofRatio.toFixed(2)} (Optimal: ${current.opt.toFixed(2)})
4. Computed Isp: ${isp} s
5. Gas Temp: ${tActual} K
6. Characteristic velocity c*: ${cStar} m/s
7. Mass flow mdot: ${Math.round(mdot)} kg/s
8. Thrust coefficient Cf: ${Cf.toFixed(2)}
9. Thrust: ${thrustKN} kN
10. Mixture efficiency: ${etaMix}%

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze the efficiency drop-off given the O/F ratio vs optimum and how it affects c*, mdot, and thrust coefficient.
Part 2 — APPLICATION: Discuss exactly where ISRO or DRDO uses this specific propellant mix (e.g., PSLV PS4, GSLV Vikas, SCE-200, Missiles).
Part 3 — THERMAL: How challenging is cooling at ${tActual}K for this specific propellant?`,
    [propellant, chamberP, ofRatio, current, isp, tActual, cStar, mdot, Cf, thrustKN, etaMix],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={260} maxWidth={460} />
      
      <PillRow>
        <Pill active={propellant === "lox_kero"} onClick={() => setPropellant("lox_kero")} color={T.accent}>LOX/Kerosene</Pill>
        <Pill active={propellant === "lox_lh2"} onClick={() => setPropellant("lox_lh2")} color={T.cyan}>LOX/LH₂</Pill>
        <Pill active={propellant === "n2o4_mmh"} onClick={() => setPropellant("n2o4_mmh")} color={T.purple}>N₂O₄/MMH</Pill>
        <Pill active={propellant === "udmh_n2o4"} onClick={() => setPropellant("udmh_n2o4")} color={T.pink}>N₂O₄/UDMH</Pill>
      </PillRow>

      <Slider label="Chamber Pressure (Pc)" value={chamberP} onChange={setChamberP} min={1} max={25} step={0.5} unit=" MPa" color={T.accent} />
      <Slider label="O/F Ratio (Oxidizer:Fuel mass)" value={ofRatio} onChange={setOfRatio} min={1.0} max={8.0} step={0.1} unit="" color={T.orange} />
      
      <DataRow>
        <DataBox label="Isp" value={isp} unit="s" color={isp > current.ispMax * 0.9 ? T.green : T.orange} />
        <DataBox label="c*" value={cStar} unit="m/s" color={T.purple} />
        <DataBox label="T_comb" value={tActual} unit="K" color={T.red} />
      </DataRow>

      <DataRow>
        <DataBox label="Thrust" value={thrustKN} unit="kN" color={T.gold} />
        <DataBox label="O/F Opt" value={current.opt} unit="" color={T.cyan} />
        <DataBox label="Mix Eff" value={etaMix} unit="%" color={etaMix > 90 ? T.green : T.orange} />
      </DataRow>

      <InfoBox color={T.cyan}>
        <strong>{current.env === "cryo" ? "Cryogenic" : "Storable"} Liquid Propulsion:</strong> At a fixed throat area of {At.toFixed(3)} m², the characteristic mass flow is ~{Math.round(mdot)} kg/s. A higher thrust coefficient (Cf ~ {Cf.toFixed(2)}) makes the engine more momentum-efficient, while off-design mixture ratios reduce both c* and propellant efficiency.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn
        simId="liquidbiprop"
        getData={() => ({
          propellant,
          chamberP,
          ofRatio,
          isp,
          tActual,
          thrustKN,
          cStar,
          mdot: Math.round(mdot),
          Cf: Cf.toFixed(2),
          etaMix,
        })}
        color={T.cyan}
      />
    </div>
  );
}
