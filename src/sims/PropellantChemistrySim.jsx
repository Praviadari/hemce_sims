import { useState, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";

export default function PropellantChemistrySim() {
  const [oxidizer, setOxidizer] = useState("ap");
  const [binder, setBinder] = useState("htpb");
  const [alPercent, setAlPercent] = useState(18);
  const [nano, setNano] = useState(false);

  const oxData = {
    ap: { isp: 260, green: false },
    an: { isp: 220, green: true },
    adn: { isp: 275, green: true },
    hmx: { isp: 285, green: false },
  };
  const bindData = { htpb: { isp: 0 }, gap: { isp: 15 }, pban: { isp: -5 } };
  const oxcol = { ap: "#4A90D9", an: T.green, adn: T.purple, hmx: T.red };
  const ox = oxData[oxidizer],
    bn = bindData[binder];
  const totalIsp = (ox.isp + bn.isp + alPercent * 1.2 + (nano ? 12 : 0)).toFixed(0);
  const density = (ox.isp > 260 ? 1.91 : 1.8) * 0.7 + (2.7 * alPercent) / 100 + 0.92 * 0.3;
  const sensitivity = oxidizer === "hmx" ? "HIGH" : oxidizer === "ap" ? "MED" : "LOW";
  const greenScore = (ox.green ? 70 : 20) + (binder === "gap" ? 15 : 0);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();

      // Background for chemistry scene
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
      bg.addColorStop(0, theme.canvasBackground);
      bg.addColorStop(1, theme.canvasSurface);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const cx = 80,
        cy = H / 2,
        r = 50;

      // Molecular Matrix Container
      ctx.strokeStyle = `${T.accent}30`;
      ctx.lineWidth = 1;
      ctx.strokeRect(20, 20, 120, H - 40);

      // Matrix Grains (Simulated Solid Matrix)
      const grainCount = 100;
      for (let i = 0; i < grainCount; i++) {
        const gx = 25 + (i % 10) * 11;
        const gy = 25 + Math.floor(i / 10) * 10;

        const seed = Math.sin(i * 0.5 + performance.now() / 500);
        let col = "#A0522D"; // Binder default

        const p = i / grainCount;
        if (p < ox.isp / 300) col = oxcol[oxidizer];
        else if (p < ox.isp / 300 + alPercent / 50) col = "#C0C0C0";

        ctx.fillStyle = col;
        ctx.globalAlpha = 0.6 + seed * 0.2;
        ctx.fillRect(gx, gy, 9, 8);
      }
      ctx.globalAlpha = 1;

      // Energy Density Spectrum (Right Side)
      const sx = 160,
        sy = 30,
        sw = W - 180,
        sh = H - 60;
      ctx.strokeStyle = `${T.accent}20`;
      ctx.strokeRect(sx, sy, sw, sh);

      // Grid Lines
      ctx.beginPath();
      for (let y = sy; y < sy + sh; y += 20) {
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + sw, y);
      }
      ctx.stroke();

      // Stability Plot
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy + sh * 0.8);
      for (let x = 0; x < sw; x += 5) {
        const iy = Math.sin(x * 0.1 + performance.now() / 200) * 5 * (sensitivity === "HIGH" ? 3 : 1);
        ctx.lineTo(sx + x, sy + sh * 0.8 - (totalIsp / 350) * sh * 0.5 + iy);
      }
      ctx.stroke();

      // Nano-Enhancement Twinkle
      if (nano) {
        for (let i = 0; i < 15; i++) {
          const nx = 20 + prng(frame, i * 2) * 120;
          const ny = 20 + prng(frame, i * 2 + 1) * (H - 40);
          const s = Math.sin(performance.now() / 150 + i) * 0.5 + 0.5;
          ctx.fillStyle = T.gold;
          ctx.globalAlpha = s;
          ctx.beginPath();
          ctx.arc(nx, ny, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // HUD Text
      ctx.font = `900 9px ${TECH_FONT}`;
      ctx.fillStyle = T.accent;
      ctx.fillText("MATRIX: PROP-LOAD", 20, 15);
      ctx.fillText("ENERGY SPECTRUM (Isp)", sx, 25);

      ctx.font = `800 8px ${MONO_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.fillText(`MODE: ${nano ? "NANO-ENHANCED" : "STANDARD"}`, 160, H - 15);
    },
    [oxidizer, binder, alPercent, nano, totalIsp, sensitivity],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Solid propellant chemistry formulation simulation — current parameters:
ROLE: "You are an expert in energetic materials chemistry. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Oxidizer: ${oxidizer.toUpperCase()}
2. Oxidizer Isp contribution: ${ox.isp} s
3. Oxidizer green chemistry: ${ox.green ? "YES" : "NO"}
4. Binder: ${binder.toUpperCase()}
5. Binder Isp contribution: ${bn.isp} s
6. Aluminium fuel: ${alPercent}%
7. Nano-aluminium: ${nano ? "YES (3-5× burn rate enhancement)" : "NO"}
8. Total formulated Isp: ${totalIsp} s
9. Sensitivity level: ${sensitivity}
10. Green score: ${greenScore}%

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash) where applicable. What are India's current capabilities and gaps in this domain?`,
    [oxidizer, ox, binder, bn, alPercent, nano, totalIsp, sensitivity, greenScore],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={320} height={150} maxWidth={320} />
      <PillRow>
        <Pill active={oxidizer === "ap"} onClick={() => setOxidizer("ap")} color={T.accent}>
          AP
        </Pill>
        <Pill active={oxidizer === "an"} onClick={() => setOxidizer("an")} color={T.green}>
          AN ♻
        </Pill>
        <Pill active={oxidizer === "adn"} onClick={() => setOxidizer("adn")} color={T.purple}>
          ADN ♻
        </Pill>
        <Pill active={oxidizer === "hmx"} onClick={() => setOxidizer("hmx")} color={T.red}>
          HMX
        </Pill>
      </PillRow>
      <PillRow>
        <Pill active={binder === "htpb"} onClick={() => setBinder("htpb")} color={T.gold}>
          HTPB
        </Pill>
        <Pill active={binder === "gap"} onClick={() => setBinder("gap")} color={T.orange}>
          GAP
        </Pill>
        <Pill active={binder === "pban"} onClick={() => setBinder("pban")} color={T.gray}>
          PBAN
        </Pill>
        <Pill active={nano} onClick={() => setNano(!nano)} color={T.gold}>
          {nano ? "Nano ●" : "Nano ○"}
        </Pill>
      </PillRow>
      <Slider label="Aluminium %" value={alPercent} onChange={setAlPercent} min={0} max={30} unit="%" color={T.gray} />
      <DataRow>
        <DataBox label="Isp" value={totalIsp} unit="s" color={T.accent} />
        <DataBox label="Density" value={density.toFixed(2)} unit="g/cc" color={T.gold} />
        <DataBox
          label="Sensitivity"
          value={sensitivity}
          color={sensitivity === "HIGH" ? T.red : sensitivity === "MED" ? T.gold : T.green}
        />
        <DataBox label="Green" value={`${greenScore}%`} color={greenScore > 50 ? T.green : T.orange} />
      </DataRow>
      <InfoBox>
        <strong style={{ color: T.purple }}>Formulation:</strong> Oxidizer ({oxidizer.toUpperCase()}) + Binder (
        {binder.toUpperCase()}) + Al fuel. {ox.green ? "♻ Green oxidizer — reduced HCl emissions." : ""}{" "}
        {nano ? "Nano-Al increases burn rate 3-5× via surface area." : ""} HEMRL leads India's energetic materials
        synthesis.
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.purple} />
      <ExportBtn
        simId="propellant_chemistry"
        getData={() => ({ oxidizer, binder, alPercent, nano, totalIsp, density })}
        color={T.purple}
      />
    </div>
  );
}
