import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { Pill, PillRow, DataBox, DataRow, InfoBox, SimCanvas, ActionBtn, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";


export default function ExplosiveDetectionSim() {
  const [method, setMethod] = useState("raman");
  const [explosive, setExplosive] = useState("rdx");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanProg, setScanProg] = useState(0);
  const animRef = useRef(null);

  const methods = {
    fluorescence: { time: 2, sensitivity: "ppm", fp: 5, label: "Fluorescence" },
    raman: { time: 4, sensitivity: "ppb", fp: 1, label: "Raman" },
    canine: { time: 1, sensitivity: "ppt", fp: 8, label: "Canine 🐕" },
    ion_mobility: { time: 3, sensitivity: "ppb", fp: 2, label: "IMS" },
  };
  
  const explosives = {
    tnt: { color: T.gold, name: "TNT", det: true },
    rdx: { color: T.red, name: "RDX", det: true },
    petn: { color: T.orange, name: "PETN", det: true },
    hmx: { color: T.purple, name: "HMX", det: true },
    tatp: { color: T.cyan, name: "TATP", det: true },
  };

  const m = methods[method];
  const s = explosives[explosive];

  // 1. ADD real detection physics based on method
  const { snr, lod, prob, falseAlarm } = useMemo(() => {
    const laserPower = 100; // mW
    const exposureTime = 20; // ms
    const distance = 0.5; // m
    const temperature = 25; // °C
    
    // Different explosives have different vapor pressures -> different detectability
    const vaporPressure = { tnt: 5.8e-6, rdx: 4.1e-9, petn: 3.8e-8, hmx: 3.3e-11, tatp: 6.1e-2 }; // Torr at 25°C
    const concentration = vaporPressure[explosive]; 

    let _snr = 0, _lod = 10, _prob = 0;
    
    if (method === "raman") {
      // Raman spectroscopy: signal-to-noise depends on laser power and exposure time
      // Real SNR formula: SNR ∝ sqrt(power * time) / distance²
      _snr = Math.round(Math.sqrt(laserPower * exposureTime) / (distance * distance + 1));
      _lod = 10; // ppb
      _prob = _snr > 15 ? 99 : 85; 
    } 
    else if (method === "ion_mobility") {
      // Ion Mobility Spectrometry (IMS): drift time depends on molecular mass
      const imsResolution = 1 / (0.5 + temperature * 0.002); // resolution degrades with temp
      _snr = Math.round(imsResolution * 20);
      _lod = 0.1; // 100 ppt -> 0.1 ppb
      _prob = 96;
    } 
    else if (method === "fluorescence") {
      // Fluorescence quenching: explosive molecules quench polymer fluorescence
      // Stern-Volmer: F0/F = 1 + Ksv * [Q]
      const quenchFactor = 1 + 25 * (concentration * 1e6); // Ksv ≈ 25
      _snr = Math.round(quenchFactor * 10);
      _lod = 1000; // 1 ppm -> 1000 ppb
      _prob = quenchFactor > 1.05 ? 92 : 45;
    } 
    else if (method === "canine") {
      // Canine detection: probability based on concentration and wind
      _prob = Math.min(99, Math.round(40 + 50 * Math.log10(concentration * 1e9 + 1)));
      _snr = _prob > 50 ? 30 : 5; // Virtual SNR for dogs
      _lod = 0.001; // 1 ppt -> 0.001 ppb
    }

    return {
      snr: _snr,
      lod: _lod,
      prob: Math.max(0, _prob),
      falseAlarm: m.fp
    };
  }, [method, explosive, m.fp]);

  const startScan = () => {
    if (scanning) return;
    setScanning(true);
    setResult(null);
    setScanProg(0);
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / (m.time * 1000), 1);
      setScanProg(p);
      if (p < 1) animRef.current = requestAnimationFrame(tick);
      else {
        setScanning(false);
        // Probability check
        const detected = Math.random() * 100 <= prob;
        setResult(detected ? "DETECTED" : "CLEAR");
      }
    };
    animRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const buildPrompt = useCallback(
    () =>
      `Explosive detection simulation — current parameters:
ROLE: "You are an expert in explosive detection. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Detection method: ${m.label}
2. Explosive target: ${s.name}
3. Detection achieved: ${result ?? "not yet scanned"}
4. SNR: ${snr} dB
5. Limit of Detection (LOD): ${lod} ppb
6. Confidence: ${prob}%
7. False positive rate: ${falseAlarm}%

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these physical parameters (SNR, LOD). Are they realistic for ${m.label}? Why is ${s.name}'s vapor pressure significant here?
Part 2 — SAFETY & RISK: What are the failure modes (false alarm rate: ${falseAlarm}%)? What would a bomb technician watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs and ECIL's Raman detectors? Reference paper FA-series at HEMCE.`,
    [m, s, result, snr, lod, prob, falseAlarm],
  );

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();

      // Technical background
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
      bg.addColorStop(0, theme.canvasBackground);
      bg.addColorStop(1, theme.canvasSurface);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2,
        cy = H / 2;

      // Sample Container (Suitcase/Package)
      ctx.fillStyle = "#1A202C";
      ctx.strokeStyle = `${T.accent}30`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 60, cy - 40, 120, 80, 8);
      ctx.fill();
      ctx.stroke();

      // Sample Interior (The chemical signature area)
      ctx.fillStyle = `${s.color}15`;
      ctx.fillRect(W / 2 - 50, cy - 30, 100, 60);

      // Scanner Beam
      if (scanning) {
        const beamY = cy - 40 + scanProg * 80;
        const beamGrad = ctx.createLinearGradient(W / 2 - 60, beamY, W / 2 + 60, beamY);
        beamGrad.addColorStop(0, "transparent");
        beamGrad.addColorStop(0.5, method === "raman" ? T.purple : T.cyan);
        beamGrad.addColorStop(1, "transparent");

        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 65, beamY);
        ctx.lineTo(W / 2 + 65, beamY);
        ctx.stroke();

        // Beam Glow
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = method === "raman" ? T.purple : T.cyan;
        ctx.fillRect(W / 2 - 60, beamY - 5, 120, 10);
        ctx.globalAlpha = 1;

        // Sampling Particles (for IMS/Canine)
        if (method === "ion_mobility" || method === "canine") {
          for (let i = 0; i < 5; i++) {
            const px = W / 2 - 60 + prng(frame, i * 2) * 120;
            const py = beamY + (prng(frame, i * 2 + 1) - 0.5) * 10;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Spectrum Analyzer (Bottom)
      const gx = 20,
        gy = H - 35,
        gw = W - 40,
        gh = 25;
      ctx.strokeStyle = `${T.accent}20`;
      ctx.strokeRect(gx, gy, gw, gh);

      if (scanning || result) {
        ctx.strokeStyle = scanning ? T.accent : result === "DETECTED" ? T.red : T.green;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx, gy + gh);
        for (let x = 0; x < gw; x += 2) {
          let iy = Math.sin(x * 0.2 + performance.now() / 100) * 2;
          // Peak for detected explosive
          if (s.det && Math.abs(x - gw / 2) < 20) {
            iy -= (scanning ? scanProg : 1) * 15 * Math.sin(((x - (gw / 2 - 20)) / 40) * Math.PI);
          }
          ctx.lineTo(gx + x, gy + gh * 0.8 + iy);
        }
        ctx.stroke();
      }

      // Detection HUD Overlay
      if (result === "DETECTED") {
        ctx.strokeStyle = T.red;
        ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - 65, cy - 45, 130, 90);

        // Target Reticle corners
        const rSize = 10;
        ctx.beginPath();
        ctx.moveTo(W / 2 - 65, cy - 35);
        ctx.lineTo(W / 2 - 65, cy - 45);
        ctx.lineTo(W / 2 - 55, cy - 45);
        ctx.moveTo(W / 2 + 65, cy - 35);
        ctx.lineTo(W / 2 + 65, cy - 45);
        ctx.lineTo(W / 2 + 55, cy - 45);
        ctx.moveTo(W / 2 - 65, cy + 35);
        ctx.lineTo(W / 2 - 65, cy + 45);
        ctx.lineTo(W / 2 - 55, cy + 45);
        ctx.moveTo(W / 2 + 65, cy + 35);
        ctx.lineTo(W / 2 + 65, cy + 45);
        ctx.lineTo(W / 2 + 55, cy + 45);
        ctx.stroke();

        ctx.font = `900 10px ${TECH_FONT}`;
        ctx.fillStyle = T.red;
        ctx.textAlign = "center";
        ctx.fillText("! THREAT IDENTIFIED: " + s.name.toUpperCase(), W / 2, cy - 50);
        ctx.textAlign = "left";
      } else if (result === "CLEAR") {
        ctx.font = `900 10px ${TECH_FONT}`;
        ctx.fillStyle = T.green;
        ctx.textAlign = "center";
        ctx.fillText("✓ SAMPLE VERIFIED: CLEAR", W / 2, cy - 50);
        ctx.textAlign = "left";
      }

      // Status / Mode Labels
      ctx.font = `800 8px ${TECH_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.fillText(`METHOD: ${m.label.toUpperCase()}`, 20, 15);
      ctx.fillText(`SENSITIVITY SNR: ${snr}`, W - 100, 15);
    },
    [scanning, scanProg, result, method, explosive, s, m, snr],
    { animate: true },
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={380} height={180} maxWidth={380} />
      <PillRow>
        <Pill
          active={method === "fluorescence"}
          onClick={() => { setResult(null); setMethod("fluorescence"); }}
          color={T.orange}
        >
          Fluorescence
        </Pill>
        <Pill
          active={method === "raman"}
          onClick={() => { setResult(null); setMethod("raman"); }}
          color={T.purple}
        >
          Raman
        </Pill>
        <Pill
          active={method === "ion_mobility"}
          onClick={() => { setResult(null); setMethod("ion_mobility"); }}
          color={T.accent}
        >
          IMS
        </Pill>
        <Pill
          active={method === "canine"}
          onClick={() => { setResult(null); setMethod("canine"); }}
          color={T.gold}
        >
          Canine 🐕
        </Pill>
      </PillRow>
      
      <PillRow>
        {Object.entries(explosives).map(([k, v]) => (
          <Pill
            key={k}
            active={explosive === k}
            onClick={() => {
              setResult(null);
              setExplosive(k);
            }}
            color={v.color}
          >
            {v.name}
          </Pill>
        ))}
      </PillRow>

      <DataRow>
        <DataBox label="SNR" value={snr} unit="dB" color={snr > 20 ? T.green : T.orange} />
        <DataBox label="LOD" value={lod < 1 ? lod : Math.round(lod)} unit="ppb" color={T.cyan} />
        <DataBox label="Confidence" value={prob} unit="%" color={prob > 80 ? T.green : T.orange} />
        <DataBox label="False Alarm" value={falseAlarm} unit="%" color={falseAlarm > 5 ? T.red : T.green} />
      </DataRow>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <ActionBtn onClick={startScan} disabled={scanning} color={T.accent}>
          {scanning ? `SCANNING... ${(scanProg * 100).toFixed(0)}%` : "🔬 SCAN SAMPLE"}
        </ActionBtn>
      </div>

      <InfoBox>
        DRDO&apos;s HEMRL and CFEES develop field-portable explosive detection kits. ECIL Hyderabad builds Raman-based detectors for airport screening. Paper FA-series at HEMCE covers advanced detection techniques. Different explosives have varying vapor pressures (TATP is high, HMX is low), radically altering detection probability for methods like IMS or Canine tracking.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.pink} />
      <ExportBtn
        simId="explosive_detection"
        getData={() => ({ method, explosive, snr, lod, prob, falseAlarm, result })}
        color={T.pink}
      />
    </div>
  );
}
