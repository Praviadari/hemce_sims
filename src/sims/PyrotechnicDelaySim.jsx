import { useState, useCallback, useRef, useEffect } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ActionBtn, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function PyrotechnicDelaySim() {
  const [mix, setMix] = useState("w_bacro4");
  const [ambientTemp, setAmbientTemp] = useState(25); // Celsius
  const [length, setLength] = useState(20); // mm

  const [burning, setBurning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const animRef = useRef(null);
  const startRef = useRef(null);

  const mixData = {
    w_bacro4:  { baseRate: 8.5,  tempCoeff: 0.003, label: "Tungsten/BaCrO4", color: "#A0AEC0", stability: "Excellent" },
    b_bacro4:  { baseRate: 25.0, tempCoeff: 0.006, label: "Boron/BaCrO4",    color: "#F6AD55", stability: "High" },
    zr_ni:     { baseRate: 45.0, tempCoeff: 0.012, label: "Zirconium/Ni",    color: "#DD6B20", stability: "Unstable" },
  };

  const current = mixData[mix];

  // Temperature affects burn rate (Arrhenius style simplified)
  // Higher temp = faster burn
  const tempDelta = ambientTemp - 25;
  const activeRate = current.baseRate * (1 + current.tempCoeff * tempDelta); // mm/s
  
  const idealTime = length / current.baseRate; // seconds
  const actualTime = length / activeRate; // seconds
  
  // Variance/Deviation tracking
  const deviation = ((actualTime - idealTime) / idealTime) * 100; // percent

  const stopBurn = useCallback(() => {
     if(animRef.current) cancelAnimationFrame(animRef.current);
     setBurning(false);
     setElapsed(0);
  }, []);

  const startBurn = () => {
      setBurning(true);
      setElapsed(0);
      startRef.current = performance.now();
      const tick = (now) => {
         const dt = (now - startRef.current) / 1000;
         setElapsed(dt);
         if (dt < actualTime) {
             animRef.current = requestAnimationFrame(tick);
         } else {
             setElapsed(actualTime);
             setBurning(false);
         }
      };
      animRef.current = requestAnimationFrame(tick);
  };

  // Cleanup
  useEffect(() => stopBurn, [mix, ambientTemp, length, stopBurn]);

  const pVal = Math.min(1.0, elapsed / actualTime);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = 20;
      const cy = H / 2;
      const drawL = W - 60;

      // Draw Detonator Housing / Delay Column constraints
      ctx.strokeStyle = "#4A5568";
      ctx.fillStyle = theme.canvasSurface;
      ctx.lineWidth = 4;
      
      // Delay Tube
      ctx.beginPath();
      ctx.moveTo(cx, cy - 15); ctx.lineTo(cx + drawL, cy - 15);
      ctx.moveTo(cx, cy + 15); ctx.lineTo(cx + drawL, cy + 15);
      ctx.stroke();

      // Output Charge (End constraint)
      ctx.fillStyle = T.red;
      ctx.fillRect(cx + drawL, cy - 15, 20, 30);
      
      ctx.font = `8px ${MONO_FONT}`;
      ctx.fillStyle = T.white;
      ctx.fillText("RDX Base Charge", cx + drawL, cy + 25);

      // Primer (Start)
      ctx.fillStyle = T.accent;
      ctx.fillRect(cx - 10, cy - 15, 10, 30);

      // The delay mix inside the column
      const colX = cx;
      const colW = drawL * pVal; // Unburned remains to the right? Wait, burn progresses left -> right.
      
      // Unburned Mix
      ctx.fillStyle = current.color;
      ctx.fillRect(colX, cy - 12, drawL, 24);

      // Burned Slag (Black/Gray) behind the flame front
      ctx.fillStyle = "#1A202C";
      ctx.fillRect(colX, cy - 12, colW, 24);

      // Flame Front
      if (burning && pVal < 1.0) {
         ctx.shadowBlur = 15;
         ctx.shadowColor = T.gold;
         ctx.fillStyle = T.gold;
         ctx.fillRect(colX + colW - 5, cy - 12, 10, 24);
         
         // Sparks moving leftwards from flame front
         for(let i=0; i<8; i++) {
             ctx.fillStyle = i%2===0 ? T.orange : T.red;
             const spX = colX + colW - 5 - (Math.random() * 20);
             const spY = cy - 12 + Math.random() * 24;
             ctx.beginPath(); ctx.arc(spX, spY, 1 + Math.random(), 0, Math.PI*2); ctx.fill();
         }
         ctx.shadowBlur = 0;
      }
      
      if (pVal >= 1.0) {
         // Detonation of output charge!
         ctx.fillStyle = T.orange;
         ctx.beginPath();
         ctx.arc(cx + drawL + 10, cy, 30 + Math.sin(frame)*5, 0, Math.PI*2);
         ctx.fill();
         ctx.fillStyle = T.white;
         ctx.font = `bold 12px ${TECH_FONT}`;
         ctx.fillText("DETONATION", cx + drawL - 30, cy);
      }

      // Timing Text Overlay
      ctx.fillStyle = T.white;
      ctx.font = `14px ${MONO_FONT}`;
      ctx.fillText(`Timer: ${elapsed.toFixed(2)} s`, cx + 20, cy + 5);

    },
    [mix, current, burning, elapsed, actualTime, pVal],
    { animate: burning || pVal >= 1 },
  );

  const buildPrompt = useCallback(
    () =>
      `Pyrotechnic delay train timing analysis — current parameters:
ROLE: "You are a pyrotechnician focused on fuze timing and energetic materials."

PARAMETERS:
1. Composition: ${current.label}
2. Column Length: ${length} mm
3. Base Burn Rate: ${current.baseRate} mm/s
4. Ambient Temp Offset: ${ambientTemp}°C
5. Temp Coefficient: ${(current.tempCoeff*100).toFixed(1)}% /°C
6. Ideal Time: ${idealTime.toFixed(3)} s
7. Actual Time (shifted by env): ${actualTime.toFixed(3)} s
8. Timing Deviation: ${deviation.toFixed(1)}%

ANALYSIS REQUEST:
Part 1 — ENVIRONMENTAL SHIFT: Why do ambient temperatures (e.g. desert vs arctic deployments) notoriously degrade pyrotechnic delay precision compared to electronic fuzes?
Part 2 — MATERIAL: Tungsten/Barium Chromate (W/BaCrO4) is famously gasless. What does "gasless delay" mean and why is this critical for maintaining consistent burn rates inside sealed metal tubes?
Part 3 — RELIABILITY: In DRDO munitions testing, what is the accepted deviation margin for delays, and how does this affect fragmentation shell air-burst height calculations?`,
    [mix, current, ambientTemp, length, idealTime, actualTime, deviation],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={120} maxWidth={460} />
      
      <PillRow>
        <Pill active={mix === "w_bacro4"} onClick={() => setMix("w_bacro4")} color={T.gray}>W / BaCrO₄ (Gasless)</Pill>
        <Pill active={mix === "b_bacro4"} onClick={() => setMix("b_bacro4")} color={T.orange}>B / BaCrO₄</Pill>
        <Pill active={mix === "zr_ni"} onClick={() => setMix("zr_ni")} color={T.red}>Zr / Ni Delay</Pill>
      </PillRow>

      <Slider label="Ambient Temperature" value={ambientTemp} onChange={setAmbientTemp} min={-40} max={70} step={5} unit=" °C" color={T.cyan} />
      <Slider label="Delay Column Length" value={length} onChange={setLength} min={5} max={100} step={5} unit=" mm" color={T.accent} />
      
      <DataRow>
        <DataBox label="Burn Rate" value={activeRate.toFixed(2)} unit="mm/s" color={T.orange} />
        <DataBox label="Ideal Time" value={idealTime.toFixed(2)} unit="s" color={T.gray} />
        <DataBox label="Actual Time" value={actualTime.toFixed(2)} unit="s" color={T.accent} />
        <DataBox label="Deviation" value={deviation > 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`} color={Math.abs(deviation) > 10 ? T.red : T.green} />
      </DataRow>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
         <ActionBtn onClick={startBurn} disabled={burning || pVal >= 1} color={T.green}>🔥 IGNITE DELAY</ActionBtn>
         <ActionBtn onClick={stopBurn} disabled={!burning && pVal < 1} color={T.gray}>RESET</ActionBtn>
      </div>

      <InfoBox color={T.cyan}>
        <strong>Pyrotechnic Delays</strong> ensure predictable detonation timings (e.g., waiting 0.5s after penetrating a bunker before detonating). Unlike electronics, chemical delays are inherently vulnerable to <em>ambient temperatures</em> (burning faster in deserts and slower in arctic conditions) and pressure shifts. <strong>Gasless</strong> mixes like <code>W/BaCrO₄</code> are preferred inside sealed detonators because producing gas would radically increase internal pressure and unexpectedly accelerate the remaining burn rate.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="delay" getData={() => ({ mix, ambientTemp, length, actualTime, deviation })} color={T.cyan} />
    </div>
  );
}
