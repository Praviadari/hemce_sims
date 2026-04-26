import { useState, useRef, useCallback, useMemo } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { MISSILE_DB } from "../data/missileDB";

export default function HybridRocketSim() {
  const related = MISSILE_DB.filter((m) => m.relatedSimId === "hybrid");
  const [throttle, setThrottle] = useState(50);
  const [fuel, setFuel] = useState("paraffin");
  const [oxidizer, setOxidizer] = useState("n2o");
  const [running, setRunning] = useState(false);
  const ivRef = useRef(null);

  const fd = { paraffin: { rate: 3.2, isp: 250 }, htpb: { rate: 1.0, isp: 240 }, abs: { rate: 1.5, isp: 230 } }[fuel];
  const od = { n2o: { name: "N₂O", mult: 1.0 }, lox: { name: "LOX", mult: 1.3 }, h2o2: { name: "H₂O₂", mult: 1.1 } }[
    oxidizer
  ];

  const regRate = useMemo(() => (fd.rate * (throttle / 100) * od.mult).toFixed(1), [fd.rate, throttle, od.mult]);
  const optimalOF = {
    "paraffin-n2o": 7.5,
    "paraffin-lox": 2.8,
    "paraffin-h2o2": 6.0,
    "htpb-n2o": 8.0,
    "htpb-lox": 2.5,
    "htpb-h2o2": 6.5,
    "abs-n2o": 7.0,
    "abs-lox": 2.2,
    "abs-h2o2": 5.5,
  };
  const optOF = optimalOF[`${fuel}-${oxidizer}`];
  const fuelDensity = { paraffin: 900, htpb: 920, abs: 1040 }[fuel];
  const oxFlux = (throttle / 100) * od.mult * 200;
  const regRateMS = Number(regRate) * 0.001;
  const ofRatio = (oxFlux / (fuelDensity * regRateMS + 0.001)).toFixed(1);
  const ofDeviation = Math.abs(Number(ofRatio) - optOF);
  const ispPenalty = Math.min(0.3, ofDeviation * 0.05);
  const actualIsp = Math.round(fd.isp * (1 - ispPenalty));
  const thrust = Math.round(((actualIsp * throttle) / 100) * od.mult * 0.4);
  const ofColor = ofDeviation > optOF * 0.2 ? T.red : ofDeviation > optOF * 0.1 ? T.orange : T.green;

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const cy = H / 2;
      const theme = getCanvasTheme();

      // Background for test stand atmosphere
      const bg = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, W);
      bg.addColorStop(0, theme.canvasBackground);
      bg.addColorStop(1, theme.canvasSurface);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Oxidizer Tank (Cryogenic Look)
      ctx.fillStyle = "#1A3A5A";
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(10, cy - 30, 60, 60, 8);
      ctx.fill();
      ctx.stroke();

      // Tank frost effect
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.strokeRect(12, cy - 28, 56, 56);

      // Feed System / Valve
      ctx.strokeStyle = running ? T.cyan : `${T.cyan}30`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(70, cy);
      ctx.lineTo(100, cy);
      ctx.stroke();

      // Injector Plate
      ctx.fillStyle = "#2D3748";
      ctx.fillRect(95, cy - 15, 8, 30);

      // Motor Casing (Combustor)
      ctx.fillStyle = "#1A202C";
      ctx.strokeStyle = `${T.accent}30`;
      ctx.beginPath();
      ctx.roundRect(103, cy - 35, 170, 70, 4);
      ctx.fill();
      ctx.stroke();

      // Solid Fuel Grain Regression Visualization
      const fc = fuel === "paraffin" ? "#F5DEB3" : fuel === "abs" ? "#8B8682" : "#A0522D";
      const regOffset = -2 + (throttle / 100) * 12 * Math.sin(frame * 0.03); // Visual flair for regression
      const portH = 15 + (throttle / 100) * 10;

      ctx.fillStyle = fc;
      // Top Grain
      ctx.beginPath();
      ctx.roundRect(107, cy - 30, 162, 30 - portH / 2, 2);
      ctx.fill();
      // Bottom Grain
      ctx.beginPath();
      ctx.roundRect(107, cy + portH / 2, 162, 30 - portH / 2, 2);
      ctx.fill();

      // Flow & Combustion Core
      if (running) {
        // Ox Flow Pulse
        const flowPulse = Math.sin(frame * 0.2) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(0, 180, 216, ${0.4 * flowPulse})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(70, cy);
        ctx.lineTo(100, cy);
        ctx.stroke();

        // Flame Core (Purplish hybrid flame)
        const fGrad = ctx.createLinearGradient(120, 0, 260, 0);
        fGrad.addColorStop(0, T.white);
        fGrad.addColorStop(0.3, T.purple);
        fGrad.addColorStop(1, "transparent");

        ctx.fillStyle = fGrad;
        ctx.globalAlpha = 0.5 + throttle / 200;
        ctx.beginPath();
        ctx.roundRect(110, cy - portH / 2 + 2, 150 + throttle * 0.5, portH - 4, 10);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Combustion Particles
        for (let i = 0; i < 15; i++) {
          const px = 110 + prng(frame, i * 3) * 150;
          const py = cy + (prng(frame, i * 3 + 1) - 0.5) * portH;
          ctx.fillStyle = `rgba(138, 43, 226, ${prng(frame, i * 3 + 2)})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Nozzle Expansion
      ctx.fillStyle = "#2D3748";
      ctx.beginPath();
      ctx.moveTo(273, cy - 15);
      ctx.lineTo(300, cy - 35);
      ctx.lineTo(300, cy + 35);
      ctx.lineTo(273, cy + 15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `${T.accent}40`;
      ctx.stroke();

      // Exhaust Plume
      if (running) {
        const eGrad = ctx.createLinearGradient(300, 0, 360, 0);
        eGrad.addColorStop(0, `${T.purple}66`);
        eGrad.addColorStop(1, "transparent");
        ctx.fillStyle = eGrad;
        ctx.beginPath();
        ctx.moveTo(300, cy - 30);
        ctx.lineTo(360, cy - 50);
        ctx.lineTo(360, cy + 50);
        ctx.lineTo(300, cy + 30);
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
    },
    [running, throttle, fuel, oxidizer],
    { animate: true },
  );

  // Animation is driven by useCanvas with { animate: true }

  const buildPrompt = useCallback(
    () =>
      `Hybrid rocket motor simulation — current parameters:
ROLE: "You are an expert in hybrid combustion. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Solid fuel: ${fuel}
2. Fuel regression rate base: ${fd.rate} mm/s
3. Base fuel Isp: ${fd.isp} s
4. Liquid oxidizer: ${od.name}
5. Throttle setting: ${throttle}%
6. Fuel regression rate at current throttle: ${regRate} mm/s
7. Oxidizer/fuel ratio: ${ofRatio}
8. Optimal O/F: ${optOF}
9. O/F deviation: ${ofDeviation.toFixed(1)}
10. Actual Isp: ${actualIsp} s
11. Net thrust: ${thrust} kN
12. Engine running: ${running ? "YES" : "NO"}

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash) where applicable. What are India's current capabilities and gaps in this domain?
Related Indian systems: ${related.map((m) => m.name).join(", ")}`,
    [fuel, fd, od, throttle, regRate, ofRatio, optOF, ofDeviation, actualIsp, thrust, running, related],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={370} height={120} maxWidth={370} />
      <PillRow>
        <Pill active={fuel === "paraffin"} onClick={() => setFuel("paraffin")} color={T.gold}>
          Paraffin
        </Pill>
        <Pill active={fuel === "htpb"} onClick={() => setFuel("htpb")} color={T.orange}>
          HTPB
        </Pill>
        <Pill active={fuel === "abs"} onClick={() => setFuel("abs")} color={T.gray}>
          ABS (3D)
        </Pill>
      </PillRow>
      <PillRow>
        <Pill active={oxidizer === "n2o"} onClick={() => setOxidizer("n2o")} color={T.cyan}>
          N₂O
        </Pill>
        <Pill active={oxidizer === "lox"} onClick={() => setOxidizer("lox")} color={T.accent}>
          LOX
        </Pill>
        <Pill active={oxidizer === "h2o2"} onClick={() => setOxidizer("h2o2")} color={T.green}>
          H₂O₂
        </Pill>
        <Pill active={running} onClick={() => setRunning(!running)} color={running ? T.red : T.green}>
          {running ? "⏹ Stop" : "▶ Run"}
        </Pill>
      </PillRow>
      <Slider label="Throttle" value={throttle} onChange={setThrottle} min={0} max={100} unit="%" color={T.green} />
      <DataRow>
        <DataBox label="Thrust" value={thrust} unit="kN" color={T.orange} />
        <DataBox label="Isp" value={actualIsp} unit="s" color={T.accent} />
        <DataBox label="O/F" value={ofRatio} unit="" color={ofColor} />
        <DataBox label="Reg Rate" value={regRate} unit="mm/s" color={T.gold} />
      </DataRow>
      <div style={{ fontSize: 10, color: T.dimText, textAlign: "center", marginTop: 2 }}>
        Optimal O/F for {fuel}/{oxidizer}: {optOF} — Current: {ofRatio}
        {ofDeviation > optOF * 0.2 ? " ⚠ Far from optimal" : " ✓ Near optimal"}
      </div>
      <InfoBox>
        <strong style={{ color: T.green }}>Hybrid advantage:</strong> Throttleable, restartable, inherently safer.{" "}
        {fuel === "paraffin"
          ? "Paraffin: 3× regression rate."
          : fuel === "abs"
            ? "ABS: 3D-printable grains."
            : "HTPB: standard baseline."}{" "}
        ISRO/HEMRL co-developing hybrid motors.
        {related.length > 0 && (
          <div style={{ marginTop: 8, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 4 }}>
              INDIAN SYSTEMS USING THIS TECHNOLOGY:
            </div>
            {related.map((m) => (
              <div key={m.id} style={{ fontSize: 10, color: T.gray, marginBottom: 2 }}>
                {m.image_emoji} <strong style={{ color: T.white }}>{m.name}</strong>
                {" — "}{m.propulsion.stages} | {m.performance.range}
                {m.sources[0] && (
                  <a href={m.sources[0].url} target="_blank" rel="noopener noreferrer"
                     style={{ color: T.accent, marginLeft: 4, fontSize: 9 }}>
                    [source]
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.lime} />
      <ExportBtn simId="hybrid" getData={() => ({ fuel, oxidizer, throttle, thrust, regRate })} color={T.lime} />
    </div>
  );
}
