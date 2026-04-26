import { useState, useMemo, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";

export default function CombustionDiagnosticsSim() {
  const [method, setMethod] = useState("pyrometry"); // pyrometry, emission_spec, laser_absorption, schlieren
  const [propellant, setPropellant] = useState("htpb_ap_al"); // htpb_ap_al, htpb_ap, smokeless
  const [chamberP, setChamberP] = useState(5);
  const [sampleRate, setSampleRate] = useState(10);

  const methodData = {
    pyrometry: { wavelengths: "700nm / 900nm", resolution: "spatial", tempRange: "1500-3500 K", snr: 25 + chamberP * 3 },
    emission_spec: { wavelengths: "484nm (AlO B-X)", resolution: "temporal 0.01ms", tempRange: "2000-4000 K", snr: propellant === "htpb_ap_al" ? 40 + chamberP * 2 : 5 },
    laser_absorption: { wavelengths: "2.3μm (CO) / 1.4μm (H₂O)", resolution: "sub-ns", tempRange: "500-3000 K", snr: 50 + sampleRate * 0.2 },
    schlieren: { wavelengths: "broadband visible", resolution: "spatial mm", tempRange: "N/A (density)", snr: 30 },
  };
  const md = methodData[method];

  const Tcomb = { htpb_ap_al: 3200 + chamberP * 20, htpb_ap: 2800 + chamberP * 15, smokeless: 2400 + chamberP * 12 }[propellant];

  const alBurnTime = propellant === "htpb_ap_al" ? (120 / (chamberP + 1)).toFixed(1) : "N/A";

  const snr = md.snr;
  const snrColor = snr > 30 ? T.green : snr > 15 ? T.orange : T.red;

  const canvasRef = useCanvas(
    (ctx, w, h, frameCount) => {
      const cy = h / 2;
      const t = getCanvasTheme();
      const hw = w * 0.4; // 40% left, 60% right

      // Clear
      ctx.fillStyle = t.bg;
      ctx.fillRect(0, 0, w, h);
      
      // Separator
      ctx.strokeStyle = t.grid;
      ctx.beginPath();
      ctx.moveTo(hw, 0);
      ctx.lineTo(hw, h);
      ctx.stroke();

      // LEFT SIDE: Schematic
      ctx.save();
      ctx.translate(hw / 2, cy);
      if (method === "pyrometry") {
        // Flame
        ctx.fillStyle = propellant === "htpb_ap_al" ? T.orange : T.cyan;
        ctx.beginPath(); ctx.arc(0, 0, 15 + Math.sin(frameCount * 0.1) * 2, 0, Math.PI * 2); ctx.fill();
        // Detectors
        ctx.fillStyle = T.red; ctx.fillRect(-40, -10, 10, 8); // 700nm
        ctx.fillStyle = T.purple; ctx.fillRect(-40, 5, 10, 8); // 900nm
        ctx.strokeStyle = t.dimText; ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(-30, -6); ctx.lineTo(-10, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-30, 9); ctx.lineTo(-10, 0); ctx.stroke();
      } else if (method === "emission_spec") {
        ctx.fillStyle = propellant === "htpb_ap_al" ? T.orange : T.cyan;
        ctx.beginPath(); ctx.arc(0, 0, 15 + Math.sin(frameCount * 0.1) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = T.accent; ctx.fillRect(-40, -10, 15, 20); // Spectrometer
        ctx.strokeStyle = T.cyan; ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(-10, 0); ctx.stroke();
      } else if (method === "laser_absorption") {
        ctx.fillStyle = propellant === "htpb_ap_al" ? T.orange : T.cyan;
        ctx.beginPath(); ctx.arc(0, 0, 15 + Math.sin(frameCount * 0.1) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ff0044"; ctx.fillRect(-40, -5, 10, 10); // Laser
        ctx.fillStyle = T.gold; ctx.fillRect(30, -5, 10, 10); // Detector
        ctx.strokeStyle = "#ff0044"; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.stroke();
      } else if (method === "schlieren") {
        ctx.fillStyle = T.dimText; ctx.fillRect(-45, -5, 10, 10); // Light source
        ctx.fillStyle = T.green; ctx.fillRect(35, -5, 10, 10); // Camera
        // Density gradients
        ctx.strokeStyle = t.text;
        ctx.lineWidth = 1;
        for (let i = -15; i <= 15; i += 5) {
          ctx.beginPath(); ctx.moveTo(i, -20);
          ctx.quadraticCurveTo(i + 10 * Math.sin(frameCount * 0.05 + i), 0, i, 20);
          ctx.stroke();
        }
      }
      ctx.restore();

      // RIGHT SIDE: Signal
      ctx.save();
      const rhw = w * 0.6;
      ctx.translate(hw, 0);
      
      ctx.strokeStyle = t.text;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(10, h - 20); ctx.lineTo(rhw - 10, h - 20); ctx.stroke(); // X axis
      ctx.beginPath(); ctx.moveTo(10, h - 20); ctx.lineTo(10, 20); ctx.stroke(); // Y axis

      ctx.beginPath();
      // deterministic noise function based on frameCount
      const noise = (x) => Math.sin(x * 0.5 + frameCount * 0.1) * (40 / Math.max(1, snr));

      if (method === "pyrometry") {
        // Curve 1
        ctx.strokeStyle = T.red; ctx.beginPath();
        for (let x = 10; x < rhw - 10; x++) {
          const y = h - 20 - (40 + 20 * Math.sin(x * 0.05)) + noise(x);
          if (x === 10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        // Curve 2
        ctx.strokeStyle = T.purple; ctx.beginPath();
        for (let x = 10; x < rhw - 10; x++) {
          const y = h - 20 - (30 + 15 * Math.sin(x * 0.04)) + noise(x * 10);
          if (x === 10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (method === "emission_spec") {
        ctx.strokeStyle = T.cyan; ctx.beginPath();
        for (let x = 10; x < rhw - 10; x++) {
          let signal = 0;
          if (propellant === "htpb_ap_al") {
            const peak1 = x > 60 && x < 80 ? 40 * Math.exp(-Math.pow(x - 70, 2) / 20) : 0; // AlO 484nm
            const peak2 = x > 120 && x < 140 ? 20 * Math.exp(-Math.pow(x - 130, 2) / 40) : 0; // Na 589nm
            signal = peak1 + peak2;
          }
          const y = h - 20 - signal + noise(x);
          if (x === 10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (method === "laser_absorption") {
        ctx.strokeStyle = "#ff0044"; ctx.beginPath();
        for (let x = 10; x < rhw - 10; x++) {
          const dip = x > 80 && x < 120 ? -30 * Math.exp(-Math.pow(x - 100, 2) / 50) : 0;
          const y = 40 - dip + noise(x);
          if (x === 10) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (method === "schlieren") {
        // Draw wavy shock diamonds directly on graph area as a field
        ctx.fillStyle = t.bg;
        ctx.fillRect(11, 21, rhw - 22, h - 42); // Clear axis area
        for (let x = 20; x < rhw - 20; x += 10) {
          ctx.strokeStyle = `rgba(200, 200, 200, ${0.2 + 0.3 * Math.sin(x * 0.1 + frameCount * 0.05)})`;
          ctx.beginPath(); ctx.moveTo(x, 21); ctx.lineTo(x + 5, h - 21); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + 5, 21); ctx.lineTo(x, h - 21); ctx.stroke();
        }
      }
      ctx.restore();

    },
    [method, propellant, chamberP, sampleRate, snr],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Combustion diagnostics simulation — current parameters:
ROLE: "You are an expert in non-intrusive combustion diagnostics and propellant flame characterization. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Diagnostic method: ${method}
2. Propellant type: ${propellant}
3. Chamber pressure: ${chamberP} MPa
4. Sample rate: ${sampleRate} kHz
5. Estimated combustion temperature: ${Tcomb} K
6. Aluminum burn time: ${alBurnTime} ms
7. Signal-to-Noise Ratio (SNR): ${snr} dB

ANALYSIS REQUEST:
Part 1 — METHODOLOGY: Analyze the selected diagnostic method for this propellant. Is it appropriate? What does this technique measure?
Part 2 — SENSOR PHYSICS: Explain how the ${md.wavelengths} wavelengths interact with the combustion species. What are the resolution (${md.resolution}) limitations?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs like Agni and BrahMos? What are India's capabilities in laser diagnostics and pyrometry?`,
    [method, propellant, chamberP, sampleRate, Tcomb, alBurnTime, snr, md],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={420} height={160} maxWidth={420} />
      <PillRow>
        <Pill active={method === "pyrometry"} onClick={() => setMethod("pyrometry")} color={T.red}>
          Pyrometry
        </Pill>
        <Pill active={method === "emission_spec"} onClick={() => setMethod("emission_spec")} color={T.cyan}>
          Emission Spec
        </Pill>
        <Pill active={method === "laser_absorption"} onClick={() => setMethod("laser_absorption")} color={"#ff0044"}>
          Laser Abs.
        </Pill>
        <Pill active={method === "schlieren"} onClick={() => setMethod("schlieren")} color={T.green}>
          Schlieren
        </Pill>
      </PillRow>
      <PillRow>
        <Pill active={propellant === "htpb_ap_al"} onClick={() => setPropellant("htpb_ap_al")} color={T.orange}>
          HTPB/AP/Al
        </Pill>
        <Pill active={propellant === "htpb_ap"} onClick={() => setPropellant("htpb_ap")} color={T.purple}>
          HTPB/AP
        </Pill>
        <Pill active={propellant === "smokeless"} onClick={() => setPropellant("smokeless")} color={T.dimText}>
          Smokeless
        </Pill>
      </PillRow>
      <Slider label="Chamber Pressure" value={chamberP} onChange={setChamberP} min={1} max={15} step={0.5} unit=" MPa" color={T.accent} />
      <Slider label="Sample Rate" value={sampleRate} onChange={setSampleRate} min={1} max={100} step={1} unit=" kHz" color={T.cyan} />
      <DataRow>
        <DataBox label="Tcomb" value={Tcomb} unit="K" color={Tcomb > 3000 ? T.red : T.orange} />
        <DataBox label="SNR" value={snr} unit="dB" color={snrColor} />
        <DataBox label="Al Burn" value={alBurnTime} unit={alBurnTime === "N/A" ? "" : "ms"} color={T.gold} />
        <DataBox label="Rate" value={sampleRate} unit="kHz" color={T.cyan} />
      </DataRow>
      <InfoBox color={T.cyan}>
        <strong style={{ color: T.cyan }}>Combustion diagnostics</strong> enable non-intrusive measurement of temperature, species, and flow in rocket motors. HEMRL Pune and DRDL Hyderabad use two-color pyrometry and emission spectroscopy to characterize Al particle combustion in HTPB/AP/Al propellants (Agni, BrahMos boosters). TDLAS provides calibration-free gas measurements at pressures up to 40 bar.
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="diagnostics" getData={() => ({ method, propellant, chamberP, sampleRate, Tcomb, snr })} color={T.cyan} />
    </div>
  );
}
