import { useState, useCallback, useRef, useEffect } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
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
    w_bacro4:  { baseRate: 8.5,  tempCoeff: 0.003, label: "Tungsten/BaCrO4", color: "#A0AEC0", stability: "Excellent", limitT: 400 },
    b_bacro4:  { baseRate: 25.0, tempCoeff: 0.006, label: "Boron/BaCrO4",    color: "#F6AD55", stability: "High",      limitT: 420 },
    zr_ni:     { baseRate: 45.0, tempCoeff: 0.012, label: "Zirconium/Ni",    color: "#DD6B20", stability: "Unstable",  limitT: 430 },
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
  const timingError = Math.abs(actualTime - idealTime) / idealTime * 100;
  const accuracy = timingError < 2 ? "MIL-SPEC" : timingError < 5 ? "ACCEPTABLE" : "OUT OF SPEC";

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

      const surfaceTemp = 273 + ambientTemp + 24;
      const leftWidth = W * 0.55;
      const midY = H * 0.25;
      const colX = 32;
      const colY = midY;
      const colW = leftWidth - 64;
      const colH = 40;
      const frontX = colX + Math.max(2, Math.min(colW, colW * pVal));
      const scaleText = `${length} mm`;

      // Delay column housing
      ctx.fillStyle = "rgba(85, 92, 110, 0.95)";
      ctx.fillRect(colX - 10, colY - 22, colW + 20, colH + 44);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      ctx.strokeRect(colX - 10, colY - 22, colW + 20, colH + 44);

      // Column fill
      ctx.fillStyle = current.color;
      ctx.fillRect(colX, colY - 12, colW, colH);

      // Burnt region
      ctx.fillStyle = "rgba(26, 32, 44, 0.95)";
      ctx.fillRect(colX, colY - 12, frontX - colX, colH);

      // Burn front line
      ctx.fillStyle = "rgba(255,235,190,0.98)";
      ctx.fillRect(frontX - 4, colY - 12, 8, colH);

      // Sparks at burn front
      for (let i = 0; i < 6; i += 1) {
        const sx = frontX + prng(frame, i) * 16;
        const sy = colY + (i % 2 ? 4 : -4) + prng(frame, i + 1) * 10;
        ctx.fillStyle = i % 2 === 0 ? T.orange : T.red;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 + prng(frame, i + 2), 0, Math.PI * 2);
        ctx.fill();
      }

      // Combustion gas bubbles
      for (let i = 0; i < 10; i += 1) {
        const gx = frontX + prng(frame, i + 5) * 30;
        const gy = colY - 18 - prng(frame, i + 6) * 12;
        ctx.fillStyle = "rgba(255,210,160,0.5)";
        ctx.beginPath();
        ctx.arc(gx, gy, 1 + prng(frame, i + 7), 0, Math.PI * 2);
        ctx.fill();
      }

      // Heat haze
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i += 1) {
        const y = colY - 20 - i * 4;
        ctx.beginPath();
        ctx.moveTo(colX + (frame * 0.8 + i * 12) % colW, y);
        ctx.bezierCurveTo(colX + 30, y - 6, colX + 50, y + 6, colX + 90, y);
        ctx.stroke();
      }

      // Input/Output ends
      ctx.fillStyle = T.red;
      ctx.beginPath();
      ctx.arc(colX - 18, colY + colH / 2 - 8, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = T.white;
      ctx.font = `600 9px ${MONO_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("Det", colX - 18, colY + colH / 2 - 4);

      ctx.fillStyle = T.orange;
      ctx.beginPath();
      ctx.arc(colX + colW + 18, colY + colH / 2 - 8, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = T.white;
      ctx.fillText("Out", colX + colW + 18, colY + colH / 2 - 4);

      // Column length indicator
      ctx.fillStyle = T.dimText;
      ctx.font = `600 10px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(scaleText, colX + colW / 2, colY + colH + 38);

      // Temperature profile strip
      const stripY = H - 40;
      const stripH = 32;
      const stripX = 24;
      const stripW = W - 48;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(stripX, stripY, stripW, stripH);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.strokeRect(stripX, stripY, stripW, stripH);
      ctx.fillStyle = T.white;
      ctx.font = `700 10px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText("T Profile along delay column", stripX, stripY - 8);

      ctx.beginPath();
      for (let i = 0; i <= 40; i += 1) {
        const x = stripX + (i / 40) * stripW;
        const frac = i / 40;
        const temp = 300 + (surfaceTemp - 300) * Math.exp(-5 * frac);
        const y = stripY + stripH - ((temp - 300) / (surfaceTemp - 300)) * stripH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = T.red;
      ctx.lineWidth = 2;
      ctx.stroke();

      const limitX = stripX + ((current.limitT - 273) / (surfaceTemp - 273)) * stripW;
      const safeX = stripX + ((323 - 273) / (surfaceTemp - 273)) * stripW;
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(limitX, stripY);
      ctx.lineTo(limitX, stripY + stripH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(safeX, stripY);
      ctx.lineTo(safeX, stripY + stripH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = T.white;
      ctx.font = `600 9px ${TECH_FONT}`;
      ctx.fillText("Limit", limitX + 4, stripY + 12);
      ctx.fillText("Safe", safeX + 4, stripY + 24);

      // Timing display
      const timerX = W - 150;
      const timerY = 24;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(timerX, timerY - 20, 126, 44);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.strokeRect(timerX, timerY - 20, 126, 44);
      ctx.fillStyle = timingError < 5 ? (timingError < 2 ? T.green : T.orange) : T.red;
      ctx.font = `800 20px ${MONO_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(`${elapsed.toFixed(2)} / ${idealTime.toFixed(2)}`, timerX + 63, timerY + 4);
      ctx.font = `600 10px ${MONO_FONT}`;
      ctx.fillText(accuracy, timerX + 63, timerY + 22);

      // Timing annotation
      ctx.fillStyle = T.white;
      ctx.font = `600 9px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(`Burn progress ${Math.round(pVal * 100)}%`, colX, colY - 34);
    },
    [mix, current, burning, elapsed, actualTime, pVal, timingError, accuracy, idealTime, ambientTemp],
    { animate: burning || pVal > 0 },
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
        <DataBox label="Accuracy" value={`${accuracy}`} color={accuracy === "MIL-SPEC" ? T.green : accuracy === "ACCEPTABLE" ? T.orange : T.red} />
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
