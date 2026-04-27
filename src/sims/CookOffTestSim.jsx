import { useState, useRef, useMemo } from "react";
import { useCanvas, T, prng, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ActionBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export function CookOffTestSim() {
  const [phase, setPhase] = useState("idle"); // idle | heating | reaction
  const [munType, setMunType] = useState("standard");
  const [explosive, setExplosive] = useState("tnt");
  const [confinement, setConfinement] = useState("heavy");
  const [heatRate, setHeatRate] = useState(3);
  
  const tempRef = useRef(20);

  const cookoffData = {
     tnt: { melt: 81, decomp: 240, detTemp: 300, sensitivity: "low", color: "#eab308" },
     rdx: { melt: 205, decomp: 230, detTemp: 260, sensitivity: "medium", color: "#ef4444" },
     hmx: { melt: 280, decomp: 290, detTemp: 310, sensitivity: "medium", color: "#a855f7" },
     pbx: { melt: 190, decomp: 350, detTemp: 400, sensitivity: "low", color: "#3b82f6" }, 
  };
  const ed = cookoffData[explosive];
  
  // Insensitive munition modifier
  const imFactor = munType === "insensitive" ? 1.4 : 1.0; 

  // Response type based on confinement + heat rate
  const responseType = confinement === "heavy" && heatRate > 10 ? "DETONATION" :
                       confinement === "heavy" ? "DEFLAGRATION" :
                       confinement === "light" ? "BURN" : "BURN";

  // Time to event: t = (detTemp * imFactor - 20) / heatRate (minutes)
  const timeToEvent = ((ed.detTemp * imFactor - 20) / heatRate).toFixed(0);

  // Violence level (1-5 scale)
  const violence = confinement === "heavy" ? 5 :
                   confinement === "light" ? 3 : 1;

  // Thresholds
  const tMelt = ed.melt;
  const tDecomp = ed.decomp * imFactor;
  const tDet = ed.detTemp * imFactor;

  const canvasRef = useCanvas(
    (ctx, W, H, frameCount) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      // Heating simulation logic
      if (phase === "heating") {
        const ramp = Math.max(0.5, heatRate * 0.15); 
        tempRef.current += ramp;
        if (tempRef.current >= tDet) {
          tempRef.current = tDet;
          setPhase("reaction");
        }
      }

      const t = tempRef.current;

      // Determine visual state
      const isMelting = t >= tMelt && t < tDecomp;
      const isDecomp = t >= tDecomp && t < tDet;
      const isReacting = phase === "reaction";

      // Draw the heat source / environment below
      if (t > 20 || phase !== "idle") {
        if (heatRate > 10) {
           // Fast cook-off flames
           const fireInt = Math.min((t - 20) / (tDet - 20), 1);
           const fGrad = ctx.createLinearGradient(0, W/2, 0, H);
           fGrad.addColorStop(0, `rgba(255, 100, 0, 0)`);
           fGrad.addColorStop(1, `rgba(255, 50, 0, ${fireInt * 0.8})`);
           ctx.fillStyle = fGrad;
           ctx.beginPath();
           for(let i=0; i<20; i++) {
              let fHeight = 60 + Math.sin(frameCount * 0.1 + i) * 20 * fireInt;
              ctx.moveTo(i * (W/20), H);
              ctx.lineTo(i * (W/20) + (W/40), H - fHeight);
              ctx.lineTo((i+1) * (W/20), H);
           }
           ctx.fill();
        } else {
           // Slow cook-off gradient
           const fireInt = Math.min((t - 20) / (tDet - 20), 1);
           const slowGrad = ctx.createLinearGradient(0, H - 40, 0, H);
           slowGrad.addColorStop(0, "transparent");
           slowGrad.addColorStop(1, `rgba(255, 100, 0, ${fireInt * 0.5})`);
           ctx.fillStyle = slowGrad;
           ctx.fillRect(0, H - 40, W, 40);
        }
      }

      // Draw Munition Cross-Section
      const cx = W / 2;
      const cy = H / 2 - 10;
      const mWidth = 160;
      const mHeight = 60;
      const casingThick = confinement === "heavy" ? 10 : confinement === "light" ? 4 : 1;
      
      if (!isReacting || responseType !== "DETONATION") {
        // Casing
        ctx.fillStyle = confinement === "unconfined" ? "transparent" : T.gray;
        ctx.fillRect(cx - mWidth/2 - casingThick, cy - mHeight/2 - casingThick, mWidth + casingThick*2, mHeight + casingThick*2);
        
        ctx.fillStyle = "#333";
        ctx.fillRect(cx - mWidth/2 - casingThick, cy - mHeight/2 - casingThick, casingThick, mHeight + casingThick*2);

        // Nose 
        if (confinement !== "unconfined") {
           ctx.beginPath();
           ctx.moveTo(cx + mWidth/2 + casingThick, cy - mHeight/2 - casingThick);
           ctx.lineTo(cx + mWidth/2 + casingThick + 40, cy);
           ctx.lineTo(cx + mWidth/2 + casingThick, cy + mHeight/2 + casingThick);
           ctx.fill();
        }

        // Inner explosive core
        let coreColor = ed.color;
        // Temperature gradient overlay (blue->yellow->orange->red)
        const tempRatio = Math.min(1, (t - 20) / (tDet - 20));

        ctx.fillStyle = coreColor;
        ctx.fillRect(cx - mWidth/2, cy - mHeight/2, mWidth, mHeight);

        // Overlay heating color
        ctx.fillStyle = tempRatio < 0.5 ? `rgba(234, 179, 8, ${tempRatio * 1.5})` : `rgba(239, 68, 68, ${tempRatio})`;
        ctx.fillRect(cx - mWidth/2, cy - mHeight/2, mWidth, mHeight);

        // Physics Animations
        if (isMelting) {
           ctx.fillStyle = coreColor;
           for(let i=0; i<5; i++) {
              let dripY = cy + mHeight/2 + (frameCount * 0.5 + i*15) % 20;
              ctx.beginPath();
              ctx.arc(cx - mWidth/4 + i*25, dripY, 3, 0, Math.PI*2);
              ctx.fill();
           }
        }

        if (isDecomp) {
           ctx.fillStyle = "rgba(100, 255, 100, 0.6)";
           for(let i=0; i<15; i++) {
              let bx = cx - mWidth/2 + 10 + prng(frameCount, i*3)*mWidth*0.9;
              let by = cy - mHeight/2 + 10 + prng(frameCount, i*3+1)*(mHeight - 20);
              ctx.beginPath();
              ctx.arc(bx, by, prng(frameCount, i*3+2)*3+1, 0, Math.PI*2);
              ctx.fill();
           }
        }
      }

      // Reaction
      if (isReacting) {
        if (responseType === "DETONATION") {
          // Flash + Blast
          ctx.fillStyle = `rgba(255, 200, 50, 0.9)`;
          ctx.beginPath();
          for (let i = 0; i < 20; i++) {
            const r = prng(frameCount, i * 3) * 200 + 50;
            const a = prng(frameCount, i * 3 + 1) * Math.PI * 2;
            ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
          
          // Shockwave
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, (frameCount % 30) * 10, 0, Math.PI*2);
          ctx.stroke();

        } else if (responseType === "DEFLAGRATION") {
          // Violent fire breaking casing
          ctx.fillStyle = `rgba(255, 150, 50, 0.9)`;
          for (let i = 0; i < 15; i++) {
             ctx.beginPath();
             ctx.arc(cx + (prng(frameCount, i*4) * 160 - 80), cy - prng(frameCount, i*4+1) * 60, prng(frameCount, i*4+2) * 30 + 10, 0, Math.PI * 2);
             ctx.fill();
          }
          // Broken casing parts
          ctx.fillStyle = T.gray;
          ctx.fillRect(cx - 50, cy + 40, 30, casingThick);
          ctx.fillRect(cx + 40, cy + 50, 40, casingThick);

        } else {
          // Burn
          ctx.fillStyle = `rgba(100, 150, 255, 0.8)`;
          for (let i = 0; i < 10; i++) {
             ctx.beginPath();
             ctx.arc(cx + (prng(frameCount, i*4) * 100 - 50), cy - 20 - prng(frameCount, i*4+1) * 40, prng(frameCount, i*4+2) * 20 + 10, 0, Math.PI * 2);
             ctx.fill();
          }
        }
      }

      // Vertical Thermometer
      const barX = W - 30;
      const barY = 20;
      const barH = H - 40;
      
      // Thermometer BG
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(barX, barY, 15, barH);
      
      // Thermometer Fill
      const maxT = 500;
      const fillRatio = Math.min(1, t / maxT);
      const fillH = fillRatio * barH;
      const thermColor = t > tDet ? T.red : t > tDecomp ? T.orange : t > tMelt ? T.gold : T.cyan;
      ctx.fillStyle = thermColor;
      ctx.fillRect(barX, barY + barH - fillH, 15, fillH);

      // Phase Labels
      ctx.fillStyle = T.white;
      ctx.font = `800 12px monospace`;
      ctx.textAlign = "center";
      const phaseLabel = isReacting ? "REACTION" :
                         isDecomp ? "DECOMPOSITION" :
                         isMelting ? "MELT" : "SOLID";
      
      if (!isReacting) {
        ctx.fillText(`${Math.floor(t)}°C`, barX + 7, barY - 5);
      }
      ctx.font = `800 16px monospace`;
      ctx.fillStyle = thermColor;
      ctx.fillText(phaseLabel, cx, 30);
      ctx.textAlign = "left";

    },
    [phase, munType, explosive, confinement, heatRate, tMelt, tDecomp, tDet, responseType, ed],
    { animate: true },
  );

  const startTest = () => {
    tempRef.current = 20;
    setPhase("heating");
  };

  const reset = () => {
    tempRef.current = 20;
    setPhase("idle");
  };

  const vColor = violence > 3 ? T.red : violence === 3 ? T.orange : T.green;

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={200} />

      <PillRow>
        <Pill active={munType === "standard"} onClick={() => { setMunType("standard"); reset(); }} color={T.red}>
          Std Munition
        </Pill>
        <Pill active={munType === "insensitive"} onClick={() => { setMunType("insensitive"); reset(); }} color="#3b82f6">
          IM Modifier (+40%)
        </Pill>
      </PillRow>

      <PillRow>
        <Pill active={explosive === "tnt"} onClick={() => { setExplosive("tnt"); reset(); }} color={T.gold}>TNT</Pill>
        <Pill active={explosive === "rdx"} onClick={() => { setExplosive("rdx"); reset(); }} color={T.red}>RDX</Pill>
        <Pill active={explosive === "hmx"} onClick={() => { setExplosive("hmx"); reset(); }} color={T.purple}>HMX</Pill>
        <Pill active={explosive === "pbx"} onClick={() => { setExplosive("pbx"); reset(); }} color={T.cyan}>PBX (IM)</Pill>
      </PillRow>

      <PillRow>
        <Pill active={confinement === "unconfined"} onClick={() => { setConfinement("unconfined"); reset(); }} color={T.gray}>Unconfined</Pill>
        <Pill active={confinement === "light"} onClick={() => { setConfinement("light"); reset(); }} color={T.cyan}>Light</Pill>
        <Pill active={confinement === "heavy"} onClick={() => { setConfinement("heavy"); reset(); }} color={T.red}>Heavy Cas.</Pill>
      </PillRow>

      <Slider label="Heating Rate" value={heatRate} onChange={(v) => { setHeatRate(v); reset(); }} min={1} max={20} unit="°C/min" color={T.orange} />

      <DataRow>
        <DataBox label="T_melt" value={tMelt.toFixed(0)} unit="°C" color={T.gold} />
        <DataBox label="T_decomp" value={tDecomp.toFixed(0)} unit="°C" color={T.orange} />
        <DataBox label="T_det" value={tDet.toFixed(0)} unit="°C" color={T.red} />
      </DataRow>
      <DataRow style={{marginTop: 8}}>
        <DataBox label="Time" value={timeToEvent} unit="min" color={T.cyan} />
        <DataBox label="Response" value={responseType} unit="" color={vColor} />
        <DataBox label="Violence" value={`${violence}/5`} unit="" color={vColor} />
      </DataRow>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <ActionBtn onClick={startTest} disabled={phase !== "idle"} color={T.orange}>
          {phase === "heating" ? "HEATING..." : phase === "reaction" ? "TEST COMPLETED" : "INITIATE COOK-OFF TEST"}
        </ActionBtn>
      </div>

      <InfoBox color={munType === "insensitive" ? "#3b82f6" : T.accent}>
        Cook-off testing (MIL-STD-2105D) evaluates explosive response to thermal stimulus. Slow cook-off (3°C/min) simulates fire exposure; fast cook-off (&gt;10°C/min) simulates adjacent detonation heating. Insensitive Munitions (IM) must pass with burn-only response (no detonation). HEMRL tests all Indian warhead fills per STANAG 4240. Paper FA11-P05 at HEMCE 2026 presents slow cook-off in metallic casings.
      </InfoBox>

      <AIInsight
        buildPrompt={() => `Focus domain: insensitive munitions and cook-off thermal response testing.
Context: Analyzing cook-off test with ${explosive.toUpperCase()} in ${confinement} confinement at ${heatRate}°C/min. 
Behavior observed: ${responseType} response.
1. Provide a technical analysis of this cook-off outcome per MIL-STD-2105D.
2. What are the specific thermal decomposition mechanisms leading to this violence level?
3. Mention FA11-P05 from HEMCE 2026, which studies slow cook-off in metallic casings, and relate it to HEMRL/India's IM requirements.
`}
        color={T.cyan}
      />
    </div>
  );
}

export default CookOffTestSim;
