import { useState, useRef, useEffect, useCallback } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ActionBtn, SimCanvas, AIInsight } from "../components";
import { T, FONT, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";

export default function ExplosiveDetectionSim() {
  const [method, setMethod] = useState("colorimetric");
  const [sample, setSample] = useState("rdx");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanProg, setScanProg] = useState(0);
  const animRef = useRef(null);

  const methods = {
    colorimetric: { time: 2, sensitivity: "ppm", fp: 5 },
    spectroscopic: { time: 4, sensitivity: "ppb", fp: 1 },
    canine: { time: 1, sensitivity: "ppt", fp: 8 },
    ion_mobility: { time: 3, sensitivity: "ppb", fp: 2 },
  };
  const samples = {
    rdx: { color: T.red, name: "RDX", det: true },
    tnt: { color: T.gold, name: "TNT", det: true },
    petn: { color: T.orange, name: "PETN", det: true },
    clean: { color: T.green, name: "Clean", det: false },
    fertilizer: { color: "#8B7355", name: "AN Fert", det: method !== "canine" },
  };
  const m = methods[method], s = samples[sample];

  const startScan = () => {
    if (scanning) return;
    setScanning(true); setResult(null); setScanProg(0);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / (m.time * 1000), 1);
      setScanProg(p);
      if (p < 1) animRef.current = requestAnimationFrame(tick);
      else { setScanning(false); setResult(s.det ? "DETECTED" : "CLEAR"); }
    };
    animRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const buildPrompt = useCallback(() =>
    `Explosive detection simulation — current parameters:
- Detection method: ${method} (${method === "colorimetric" ? "HEMRL field kit" : method === "spectroscopic" ? "Raman spectroscopy" : method === "ion_mobility" ? "Ion Mobility Spectrometry" : "Canine olfaction"})
- Sample type: ${s.name}
- Detection achieved: ${result ?? "not yet scanned"}
- Method sensitivity: ${m.sensitivity}
- False positive rate: ${m.fp}%
- Scan time: ${m.time} s

Provide 2-3 sentences: how effective is ${method} for detecting ${s.name} in real-world conditions, and what are the key operational considerations for deploying this detection technology in a field security scenario?`,
  [method, s, result, m]);

  const canvasRef = useCanvas((ctx, W, H) => {
    const theme = getCanvasTheme();

    // Technical background
    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2);
    bg.addColorStop(0, theme.canvasBackground);
    bg.addColorStop(1, theme.canvasSurface);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    
    // Sample Container (Suitcase/Package)
    ctx.fillStyle = "#1A202C";
    ctx.strokeStyle = `${T.accent}30`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(W/2 - 60, cy - 40, 120, 80, 8); ctx.fill(); ctx.stroke();
    
    // Sample Interior (The chemical signature area)
    ctx.fillStyle = `${s.color}15`;
    ctx.fillRect(W/2 - 50, cy - 30, 100, 60);

    // Scanner Beam
    if (scanning) {
      const beamY = cy - 40 + scanProg * 80;
      const beamGrad = ctx.createLinearGradient(W/2 - 60, beamY, W/2 + 60, beamY);
      beamGrad.addColorStop(0, "transparent");
      beamGrad.addColorStop(0.5, method === "spectroscopic" ? T.purple : T.cyan);
      beamGrad.addColorStop(1, "transparent");
      
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W/2 - 65, beamY); ctx.lineTo(W/2 + 65, beamY); ctx.stroke();
      
      // Beam Glow
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = method === "spectroscopic" ? T.purple : T.cyan;
      ctx.fillRect(W/2 - 60, beamY - 5, 120, 10);
      ctx.globalAlpha = 1;

      // Sampling Particles (for IMS/Canine)
      if (method === "ion_mobility" || method === "canine") {
        for(let i=0; i<5; i++) {
          const px = W/2 - 60 + Math.random() * 120;
          const py = beamY + (Math.random() - 0.5) * 10;
          ctx.fillStyle = s.color;
          ctx.beginPath(); ctx.arc(px, py, 1, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // Spectrum Analyzer (Bottom)
    const gx = 20, gy = H - 35, gw = W - 40, gh = 25;
    ctx.strokeStyle = `${T.accent}20`;
    ctx.strokeRect(gx, gy, gw, gh);
    
    if (scanning || result) {
      ctx.strokeStyle = scanning ? T.accent : result === "DETECTED" ? T.red : T.green;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, gy + gh);
      for(let x=0; x<gw; x+=2) {
        let iy = Math.sin(x * 0.2 + performance.now() / 100) * 2;
        // Peak for detected explosive
        if (s.det && Math.abs(x - gw/2) < 20) {
          iy -= (scanning ? scanProg : 1) * 15 * Math.sin((x - (gw/2 - 20)) / 40 * Math.PI);
        }
        ctx.lineTo(gx + x, gy + gh * 0.8 + iy);
      }
      ctx.stroke();
    }

    // Detection HUD Overlay
    if (result === "DETECTED") {
      ctx.strokeStyle = T.red;
      ctx.lineWidth = 2;
      ctx.strokeRect(W/2 - 65, cy - 45, 130, 90);
      
      // Target Reticle corners
      const rSize = 10;
      ctx.beginPath();
      ctx.moveTo(W/2 - 65, cy - 35); ctx.lineTo(W/2 - 65, cy - 45); ctx.lineTo(W/2 - 55, cy - 45);
      ctx.moveTo(W/2 + 65, cy - 35); ctx.lineTo(W/2 + 65, cy - 45); ctx.lineTo(W/2 + 55, cy - 45);
      ctx.moveTo(W/2 - 65, cy + 35); ctx.lineTo(W/2 - 65, cy + 45); ctx.lineTo(W/2 - 55, cy + 45);
      ctx.moveTo(W/2 + 65, cy + 35); ctx.lineTo(W/2 + 65, cy + 45); ctx.lineTo(W/2 + 55, cy + 45);
      ctx.stroke();

      ctx.font = `900 10px ${TECH_FONT}`;
      ctx.fillStyle = T.red;
      ctx.textAlign = "center";
      ctx.fillText("! THREAT IDENTIFIED: " + s.name.toUpperCase(), W/2, cy - 50);
      ctx.textAlign = "left";
    } else if (result === "CLEAR") {
      ctx.font = `900 10px ${TECH_FONT}`;
      ctx.fillStyle = T.green;
      ctx.textAlign = "center";
      ctx.fillText("✓ SAMPLE VERIFIED: STABLE", W/2, cy - 50);
      ctx.textAlign = "left";
    }

    // Status / Mode Labels
    ctx.font = `800 8px ${TECH_FONT}`;
    ctx.fillStyle = T.dimText;
    ctx.fillText(`METHOD: ${method.toUpperCase()}`, 20, 15);
    ctx.fillText(`SENSITIVITY: ${m.sensitivity.toUpperCase()}`, W - 100, 15);

  }, [scanning, scanProg, result, method, sample, s, m],
    { animate: true }
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={380} height={180} maxWidth={380} />
      <PillRow>
        <Pill active={method === "colorimetric"} onClick={() => { setResult(null); setMethod("colorimetric"); }} color={T.orange}>Colorimetric</Pill>
        <Pill active={method === "spectroscopic"} onClick={() => { setResult(null); setMethod("spectroscopic"); }} color={T.purple}>Raman</Pill>
        <Pill active={method === "ion_mobility"} onClick={() => { setResult(null); setMethod("ion_mobility"); }} color={T.accent}>IMS</Pill>
        <Pill active={method === "canine"} onClick={() => { setResult(null); setMethod("canine"); }} color={T.gold}>Canine 🐕</Pill>
      </PillRow>
      <PillRow>
        {Object.entries(samples).map(([k, v]) => (
          <Pill key={k} active={sample === k} onClick={() => { setResult(null); setSample(k); }} color={v.color}>{v.name}</Pill>
        ))}
      </PillRow>
      <DataRow>
        <DataBox label="Scan Time" value={m.time} unit="s" color={T.accent} />
        <DataBox label="Sensitivity" value={m.sensitivity} color={T.green} />
        <DataBox label="False +" value={`${m.fp}%`} color={m.fp > 5 ? T.gold : T.green} />
      </DataRow>
      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn onClick={startScan} disabled={scanning} color={T.accent}>
          {scanning ? `SCANNING... ${(scanProg * 100).toFixed(0)}%` : "🔬 SCAN SAMPLE"}
        </ActionBtn>
      </div>
      <InfoBox><strong style={{ color: T.purple }}>Detection:</strong> {method === "colorimetric" ? "HEMRL field kit — color reagents, used by police/BSF." : method === "spectroscopic" ? "Raman — laser molecular fingerprinting, ppb sensitivity." : method === "ion_mobility" ? "IMS — airport-grade screening, low false-positive." : "Canine — ppt sensitivity, gold standard for field sweeps."}</InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.pink} />
    </div>
  );
}
