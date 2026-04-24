import { useState, useRef, useEffect } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, ActionBtn } from "../components";
import { T, FONT } from "../utils";

export default function ExplosiveDetectionSim() {
  const [method, setMethod] = useState("colorimetric");
  const [sample, setSample] = useState("rdx");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanProg, setScanProg] = useState(0);
  const animRef = useRef(null);

  const methods = { colorimetric: { time: 2, sensitivity: "ppm", fp: 5 }, spectroscopic: { time: 4, sensitivity: "ppb", fp: 1 }, canine: { time: 1, sensitivity: "ppt", fp: 8 }, ion_mobility: { time: 3, sensitivity: "ppb", fp: 2 } };
  const samples = { rdx: { color: T.red, name: "RDX", det: true }, tnt: { color: T.gold, name: "TNT", det: true }, petn: { color: T.orange, name: "PETN", det: true }, clean: { color: T.green, name: "Clean", det: false }, fertilizer: { color: "#8B7355", name: "AN Fert", det: method !== "canine" } };
  const m = methods[method], s = samples[sample];

  const startScan = () => {
    if (scanning) return;
    setScanning(true); setResult(null); setScanProg(0);
    const start = performance.now();
    const tick = (now) => { const p = Math.min((now - start) / (m.time * 1000), 1); setScanProg(p); if (p < 1) animRef.current = requestAnimationFrame(tick); else { setScanning(false); setResult(s.det ? "DETECTED" : "CLEAR"); } };
    animRef.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (<div>
    <div style={{ background: "#0D1B2A", borderRadius: 8, border: `1px solid ${T.accent}33`, padding: 16, textAlign: "center", marginBottom: 12 }}>
      <div style={{ display: "inline-flex", width: 60, height: 60, borderRadius: "50%", background: `${s.color}33`, border: `3px solid ${s.color}`, alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: FONT, fontSize: 11, color: s.color, fontWeight: 700 }}>{s.name}</span>
      </div>
      <div style={{ marginTop: 10, height: 6, background: `${T.dimText}22`, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${scanProg * 100}%`, borderRadius: 3, transition: "width .1s", background: scanning ? T.accent : result === "DETECTED" ? T.red : result === "CLEAR" ? T.green : T.dimText }} />
      </div>
      {result && <div style={{ marginTop: 8, padding: "6px 16px", borderRadius: 6, display: "inline-block", background: result === "DETECTED" ? `${T.red}22` : `${T.green}22`, border: `1px solid ${result === "DETECTED" ? T.red : T.green}44`, color: result === "DETECTED" ? T.red : T.green, fontFamily: FONT, fontSize: 14, fontWeight: 800 }}>{result === "DETECTED" ? `⚠ ${s.name} DETECTED` : "✓ ALL CLEAR"}</div>}
    </div>
    <PillRow>
      <Pill active={method === "colorimetric"} onClick={() => { setResult(null); setMethod("colorimetric"); }} color={T.orange}>Colorimetric</Pill>
      <Pill active={method === "spectroscopic"} onClick={() => { setResult(null); setMethod("spectroscopic"); }} color={T.purple}>Raman</Pill>
      <Pill active={method === "ion_mobility"} onClick={() => { setResult(null); setMethod("ion_mobility"); }} color={T.accent}>IMS</Pill>
      <Pill active={method === "canine"} onClick={() => { setResult(null); setMethod("canine"); }} color={T.gold}>Canine 🐕</Pill>
    </PillRow>
    <PillRow>{Object.entries(samples).map(([k, v]) => <Pill key={k} active={sample === k} onClick={() => { setResult(null); setSample(k); }} color={v.color}>{v.name}</Pill>)}</PillRow>
    <DataRow>
      <DataBox label="Scan Time" value={m.time} unit="s" color={T.accent} />
      <DataBox label="Sensitivity" value={m.sensitivity} color={T.green} />
      <DataBox label="False +" value={`${m.fp}%`} color={m.fp > 5 ? T.gold : T.green} />
    </DataRow>
    <div style={{ display: "flex", gap: 8 }}><ActionBtn onClick={startScan} disabled={scanning} color={T.accent}>{scanning ? `SCANNING... ${(scanProg * 100).toFixed(0)}%` : "🔬 SCAN SAMPLE"}</ActionBtn></div>
    <InfoBox><strong style={{ color: T.purple }}>Detection:</strong> {method === "colorimetric" ? "HEMRL field kit — color reagents, used by police/BSF." : method === "spectroscopic" ? "Raman — laser molecular fingerprinting, ppb sensitivity." : method === "ion_mobility" ? "IMS — airport-grade screening, low false-positive." : "Canine — ppt sensitivity, gold standard for field sweeps."}</InfoBox>
  </div>);
}
