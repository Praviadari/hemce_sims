import { useState, useEffect, useRef } from "react";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow, SimCanvas } from "../components";
import { T, FONT, useCanvas } from "../utils";

export default function HybridRocketSim() {
  const [throttle, setThrottle] = useState(50);
  const [fuel, setFuel] = useState("paraffin");
  const [oxidizer, setOxidizer] = useState("n2o");
  const [running, setRunning] = useState(false);
  const ivRef = useRef(null);

  const fd = { paraffin: { rate: 3.2, isp: 250 }, htpb: { rate: 1.0, isp: 240 }, abs: { rate: 1.5, isp: 230 } }[fuel];
  const od = { n2o: { name: "N₂O", mult: 1.0 }, lox: { name: "LOX", mult: 1.3 }, h2o2: { name: "H₂O₂", mult: 1.1 } }[oxidizer];
  const thrust = Math.round(fd.isp * throttle / 100 * od.mult * 0.4);
  const regRate = (fd.rate * (throttle / 100) * od.mult).toFixed(1);

  const canvasRef = useCanvas((ctx, W, H) => {
    const cy = H / 2;
    ctx.fillStyle = "#1A3A5A"; ctx.beginPath(); ctx.roundRect(10, cy - 25, 50, 50, 6); ctx.fill(); ctx.strokeStyle = T.accent; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = `bold 8px ${FONT}`; ctx.fillStyle = T.accent; ctx.textAlign = "center"; ctx.fillText(od.name, 35, cy + 4);
    ctx.strokeStyle = running ? `rgba(0,180,216,.6)` : `rgba(0,180,216,.15)`; ctx.lineWidth = running ? 3 : 1; ctx.beginPath(); ctx.moveTo(60, cy); ctx.lineTo(90, cy); ctx.stroke();
    ctx.fillStyle = "#555"; ctx.fillRect(88, cy - 12, 8, 24);
    ctx.fillStyle = "#1E3A5F"; ctx.beginPath(); ctx.roundRect(96, cy - 28, 160, 56, 4); ctx.fill();
    const fc = fuel === "paraffin" ? "#F5DEB3" : fuel === "abs" ? "#8B8682" : "#A0522D";
    ctx.fillStyle = fc; ctx.fillRect(100, cy - 26, 152, 10); ctx.fillRect(100, cy + 16, 152, 10);
    if (running) { for (let i = 0; i < 8; i++) { ctx.fillStyle = `rgba(255,${120 + Math.random() * 80},0,${0.2 + throttle / 200})`; ctx.beginPath(); ctx.arc(105 + Math.random() * 140, cy + (Math.random() - 0.5) * 20, 2 + Math.random() * 4, 0, Math.PI * 2); ctx.fill(); } }
    ctx.fillStyle = "#374151"; ctx.beginPath(); ctx.moveTo(256, cy - 28); ctx.lineTo(280, cy - 15); ctx.lineTo(300, cy - 30); ctx.lineTo(300, cy + 30); ctx.lineTo(280, cy + 15); ctx.lineTo(256, cy + 28); ctx.closePath(); ctx.fill();
    if (running) { for (let i = 0; i < 6; i++) { ctx.strokeStyle = `rgba(255,180,0,${0.2 + Math.random() * 0.3 * throttle / 100})`; ctx.lineWidth = 1 + Math.random() * 2; ctx.beginPath(); ctx.moveTo(300, cy + (Math.random() - 0.5) * 15); ctx.lineTo(300 + Math.random() * 50 * throttle / 100, cy + (Math.random() - 0.5) * 40 * throttle / 100); ctx.stroke(); } }
    ctx.textAlign = "left"; ctx.font = `bold 8px ${FONT}`; ctx.fillStyle = T.dimText; ctx.fillText("OX TANK", 12, cy - 30); ctx.fillText("FUEL GRAIN", 130, cy - 32); ctx.fillStyle = T.gray; ctx.fillText("NOZZLE", 264, cy - 34);
  }, [running, throttle, fuel, oxidizer]);

  useEffect(() => { if (running) { ivRef.current = setInterval(() => {}, 80); return () => clearInterval(ivRef.current); } }, [running]);

  return (<div>
    <SimCanvas canvasRef={canvasRef} width={370} height={120} maxWidth={370} />
    <PillRow>
      <Pill active={fuel === "paraffin"} onClick={() => setFuel("paraffin")} color={T.gold}>Paraffin</Pill>
      <Pill active={fuel === "htpb"} onClick={() => setFuel("htpb")} color={T.orange}>HTPB</Pill>
      <Pill active={fuel === "abs"} onClick={() => setFuel("abs")} color={T.gray}>ABS (3D)</Pill>
    </PillRow>
    <PillRow>
      <Pill active={oxidizer === "n2o"} onClick={() => setOxidizer("n2o")} color={T.cyan}>N₂O</Pill>
      <Pill active={oxidizer === "lox"} onClick={() => setOxidizer("lox")} color={T.accent}>LOX</Pill>
      <Pill active={oxidizer === "h2o2"} onClick={() => setOxidizer("h2o2")} color={T.green}>H₂O₂</Pill>
      <Pill active={running} onClick={() => setRunning(!running)} color={running ? T.red : T.green}>{running ? "⏹ Stop" : "▶ Run"}</Pill>
    </PillRow>
    <Slider label="Throttle" value={throttle} onChange={setThrottle} min={0} max={100} unit="%" color={T.green} />
    <DataRow>
      <DataBox label="Thrust" value={thrust} unit="kN" color={T.orange} />
      <DataBox label="Isp" value={fd.isp} unit="s" color={T.accent} />
      <DataBox label="Reg Rate" value={regRate} unit="mm/s" color={T.gold} />
    </DataRow>
    <InfoBox><strong style={{ color: T.green }}>Hybrid advantage:</strong> Throttleable, restartable, inherently safer. {fuel === "paraffin" ? "Paraffin: 3× regression rate." : fuel === "abs" ? "ABS: 3D-printable grains." : "HTPB: standard baseline."} ISRO/HEMRL co-developing hybrid motors.</InfoBox>
  </div>);
}
