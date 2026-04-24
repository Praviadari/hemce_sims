import { useState } from "react";
import { T, font } from "../utils/theme";
import { useCanvas } from "../utils/useCanvas";
import { Pill, Slider, DataBox, InfoBox, PillRow, DataRow } from "../components/Primitives";

export default function PropellantChemistrySim() {
  const [oxidizer, setOxidizer] = useState("ap");
  const [binder, setBinder] = useState("htpb");
  const [alPercent, setAlPercent] = useState(18);
  const [nano, setNano] = useState(false);

  const oxData = { ap: { isp: 260, green: false }, an: { isp: 220, green: true }, adn: { isp: 275, green: true }, hmx: { isp: 285, green: false } };
  const bindData = { htpb: { isp: 0 }, gap: { isp: 15 }, pban: { isp: -5 } };
  const oxCol = { ap: "#4A90D9", an: T.green, adn: T.purple, hmx: T.red };

  const ox = oxData[oxidizer], bn = bindData[binder];
  const totalIsp = Math.round(ox.isp + bn.isp + alPercent * 1.2 + (nano ? 12 : 0));
  const density = (ox.isp > 260 ? 1.91 : 1.8) * .7 + 2.7 * alPercent / 100 + .92 * .3;
  const sensitivity = oxidizer === "hmx" ? "HIGH" : oxidizer === "ap" ? "MED" : "LOW";
  const greenScore = (ox.green ? 70 : 20) + (binder === "gap" ? 15 : 0);

  const canvasRef = useCanvas((ctx, W, H) => {
    const cx = W / 2 - 20, cy = H / 2, r = 50;
    const oxa = Math.PI * 1.4;
    ctx.fillStyle = oxCol[oxidizer]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -.7, -.7 + oxa); ctx.fill();
    const ala = (alPercent / 100) * Math.PI * 2;
    ctx.fillStyle = "#C0C0C0"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -.7 + oxa, -.7 + oxa + ala); ctx.fill();
    ctx.fillStyle = binder === "gap" ? "#E67E22" : "#A0522D"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, -.7 + oxa + ala, -.7 + Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0A1628"; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.font = `bold 10px ${font}`; ctx.fillStyle = T.white; ctx.textAlign = "center"; ctx.fillText("HEM", cx, cy + 4);
    if (nano) { for (let i = 0; i < 12; i++) { const a = Math.random() * Math.PI * 2, d = 22 + Math.random() * 26; ctx.fillStyle = `rgba(244,162,97,${.4 + Math.random() * .4})`; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.5, 0, Math.PI * 2); ctx.fill(); } }
    ctx.textAlign = "left"; ctx.font = `9px ${font}`;
    const lx = W - 95, ly = 15;
    [[oxCol[oxidizer], oxidizer.toUpperCase()], ["#C0C0C0", `Al ${alPercent}%`], [binder === "gap" ? "#E67E22" : "#A0522D", binder.toUpperCase()]].forEach(([c, t], i) => {
      ctx.fillStyle = c; ctx.fillRect(lx, ly + i * 15, 8, 8); ctx.fillStyle = T.gray; ctx.fillText(t, lx + 12, ly + 8 + i * 15);
    });
  }, [oxidizer, binder, alPercent, nano]);

  return (<div>
    <canvas ref={canvasRef} width={320} height={150} style={{ width: "100%", maxWidth: 320, height: "auto", background: "#0D1B2A", borderRadius: 8, border: `1px solid ${T.accent}33`, display: "block", margin: "0 auto" }} />
    <PillRow>
      <Pill active={oxidizer === "ap"} onClick={() => setOxidizer("ap")} color={T.accent}>AP</Pill>
      <Pill active={oxidizer === "an"} onClick={() => setOxidizer("an")} color={T.green}>AN ♻</Pill>
      <Pill active={oxidizer === "adn"} onClick={() => setOxidizer("adn")} color={T.purple}>ADN ♻</Pill>
      <Pill active={oxidizer === "hmx"} onClick={() => setOxidizer("hmx")} color={T.red}>HMX</Pill>
    </PillRow>
    <PillRow>
      <Pill active={binder === "htpb"} onClick={() => setBinder("htpb")} color={T.gold}>HTPB</Pill>
      <Pill active={binder === "gap"} onClick={() => setBinder("gap")} color={T.orange}>GAP</Pill>
      <Pill active={binder === "pban"} onClick={() => setBinder("pban")} color={T.gray}>PBAN</Pill>
      <Pill active={nano} onClick={() => setNano(!nano)} color={T.gold}>{nano ? "Nano ●" : "Nano ○"}</Pill>
    </PillRow>
    <Slider label="Aluminium %" value={alPercent} onChange={setAlPercent} min={0} max={30} unit="%" color={T.gray} />
    <DataRow>
      <DataBox label="Isp" value={totalIsp} unit="s" color={T.accent} />
      <DataBox label="Density" value={density.toFixed(2)} unit="g/cc" color={T.gold} />
      <DataBox label="Sensitivity" value={sensitivity} color={sensitivity === "HIGH" ? T.red : sensitivity === "MED" ? T.gold : T.green} />
      <DataBox label="Green" value={`${greenScore}%`} color={greenScore > 50 ? T.green : T.orange} />
    </DataRow>
    <InfoBox><strong style={{ color: T.purple }}>Formulation:</strong> Oxidizer + Binder + Al fuel. {ox.green ? "♻ Green oxidizer — reduced HCl emissions." : ""} {nano ? "Nano-Al increases burn rate 3-5× via surface area." : ""} HEMRL leads India's energetic materials synthesis.</InfoBox>
  </div>);
}
