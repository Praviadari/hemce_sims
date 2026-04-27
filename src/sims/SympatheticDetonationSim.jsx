import { useState, useCallback, useRef, useEffect } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ActionBtn, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function SympatheticDetonationSim() {
  const [gapDistance, setGapDistance] = useState(25); // mm
  const [barrier, setBarrier] = useState("air");
  const [acceptorSens, setAcceptorSens] = useState(5); // 1 = insensitive, 10 = sensitive

  const [firing, setFiring] = useState(false);
  const [reactionPhase, setReactionPhase] = useState(0); 
  const animRef = useRef(null);

  const barrierData = {
    air:   { attenuation: 0.1, label: "Air Gap Only", color: "#A0AEC0" },
    steel: { attenuation: 0.8, label: "Steel Plate", color: "#718096" },
    poly:  { attenuation: 1.5, label: "Polycarbonate Air-gap", color: "#63B3ED" }, // composite attenuation
  };

  const currentBarrier = barrierData[barrier];

  // Physics: Donor Detonation Pressure (Const 20 GPa roughly) attenuates across gap/barrier
  // Transmitted shock pressure at acceptor surface = f(gap, barrier)
  const baseP = 200; // arbitrary shock scale
  
  // Attenuation increases with gap distance and barrier type
  // Air attenuates very little at short mm ranges compared to high impedance metal/plastic boundaries
  const effAtten = currentBarrier.attenuation * (gapDistance / 10);
  const shockTransmitted = Math.max(0, baseP - effAtten*20);

  // Reaction threshold
  // Sensitive explosives (10) detonate at low pressures.
  // Insensitive (PBX) detonate at high pressures.
  const criticalPressure = 200 - (acceptorSens * 15);
  
  const isDetonation = shockTransmitted >= criticalPressure;

  const testFire = () => {
      setFiring(true);
      setReactionPhase(0);
      let frames = 0;
      const tick = () => {
          frames++;
          if (frames < 30) setReactionPhase(frames/30); // donor shock traveling
          else if (frames < 90) setReactionPhase(1 + (frames-30)/60); // impact & acceptor reaction
          else {
              setFiring(false);
              return;
          }
          animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
     return () => { if(animRef.current) cancelAnimationFrame(animRef.current); };
  }, [gapDistance, barrier, acceptorSens]);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const cx = 80;
      const cy = H / 2;

      const chargeW = 40;
      const chargeH = 60;

      // Donor Charge (Always fixed on left)
      if (reactionPhase < 0.2) {
          ctx.fillStyle = "#E53E3E"; // Red donor
          ctx.fillRect(cx - chargeW/2, cy - chargeH/2, chargeW, chargeH);
          ctx.fillStyle = T.white;
          ctx.font = `bold 10px ${TECH_FONT}`;
          ctx.textAlign="center";
          ctx.fillText("DONOR", cx, cy);
      } else {
          // Donor exploded
          const pt = Math.min(1, reactionPhase * 2);
          ctx.fillStyle = `rgba(229, 62, 62, ${1 - pt})`;
          ctx.beginPath(); ctx.arc(cx, cy, 30 + pt*W, 0, Math.PI*2); ctx.fill();
      }

      // Acceptor Charge
      const visualGap = Math.max(10, gapDistance * 1.5);
      const accX = cx + chargeW/2 + visualGap + chargeW/2;

      // Draw Barrier in the gap
      if (barrier !== "air") {
          const bW = 8;
          const bx = cx + chargeW/2 + visualGap/2 - bW/2;
          ctx.fillStyle = currentBarrier.color;
          if (reactionPhase < 0.5) {
             ctx.fillRect(bx, cy - chargeH/2, bW, chargeH);
             ctx.font = `8px ${TECH_FONT}`;
             ctx.fillStyle = T.gray;
             ctx.fillText(barrier.toUpperCase(), bx + 4, cy - chargeH/2 - 5);
          } else {
             // Barrier shatters
             ctx.fillRect(bx + reactionPhase*20, cy - chargeH/2 - reactionPhase*10, bW, Math.max(0, chargeH - reactionPhase*20));
             ctx.fillRect(bx + reactionPhase*15, cy + chargeH/2 + reactionPhase*10, bW, Math.max(0, chargeH - reactionPhase*20));
          }
      }

      // Acceptor Reaction
      if (reactionPhase < 1.0) {
          ctx.fillStyle = `#D69E2E`;
          ctx.fillRect(accX - chargeW/2, cy - chargeH/2, chargeW, chargeH);
          ctx.fillStyle = T.white;
          ctx.font = `bold 10px ${TECH_FONT}`;
          ctx.textAlign="center";
          ctx.fillText("ACCEPTOR", accX, cy);
      } else {
          if (isDetonation) {
             const pt = reactionPhase - 1.0;
             ctx.fillStyle = `rgba(214, 158, 46, ${1 - pt})`;
             ctx.beginPath(); ctx.arc(accX, cy, 20 + pt*W, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = T.red;
             ctx.fillText("DETONATION!", accX, cy);
          } else {
             ctx.fillStyle = `#D69E2E`;
             ctx.fillRect(accX - chargeW/2, cy - chargeH/2, chargeW, chargeH);
             
             // Maybe some scorch marks
             ctx.fillStyle = "rgba(0,0,0,0.4)";
             ctx.fillRect(accX - chargeW/2, cy - chargeH/2, 5, chargeH);
             
             ctx.fillStyle = T.green;
             ctx.fillText("DEFEATED", accX, cy);
          }
      }

      // Shockwave transit indicator
      if (reactionPhase > 0 && reactionPhase < 1.0) {
          const sx = cx + chargeW/2 + (reactionPhase * visualGap);
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx, cy - 40);
          ctx.quadraticCurveTo(sx + 10, cy, sx, cy + 40);
          ctx.stroke();
      }

      // Distance dimensioning
      ctx.strokeStyle = T.dimText;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cx + chargeW/2, cy + 45); ctx.lineTo(cx + chargeW/2, cy + 55);
      ctx.moveTo(accX - chargeW/2, cy + 45); ctx.lineTo(accX - chargeW/2, cy + 55);
      ctx.moveTo(cx + chargeW/2, cy + 50); ctx.lineTo(accX - chargeW/2, cy + 50);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = T.white;
      ctx.font = `9px ${TECH_FONT}`;
      ctx.fillText(`${gapDistance} mm GAP`, cx + chargeW/2 + visualGap/2, cy + 65);

    },
    [gapDistance, barrier, acceptorSens, firing, reactionPhase, isDetonation, shockTransmitted, criticalPressure, currentBarrier],
    { animate: firing },
  );

  const buildPrompt = useCallback(
    () =>
      `Sympathetic Detonation (Gap Test) simulation — current parameters:
ROLE: "You are an exploratory test engineer running standard Gap Tests (like Navy NOL Large Scale Gap Test) for explosive classification."

PARAMETERS:
1. Acceptor Sensitivity Scale: ${acceptorSens}/10 (Crit. Press: ${criticalPressure} idx)
2. Gap Distance: ${gapDistance} mm
3. Intervening Barrier: ${currentBarrier.label}
4. Shock Pressure Transmitted: ${shockTransmitted.toFixed(0)} idx
5. Results: ${isDetonation ? "SYMPATHETIC DETONATION" : "NO DETONATION (Passed)"}

ANALYSIS REQUEST:
Part 1 — TEST STANDARD: Explain the purpose of a gap test (using PMMA/Cards) in classifying the shock sensitivity of secondary explosives.
Part 2 — SHOCK IMPEDANCE: Why do composite laminates (like Polycarbonate/Steel) mitigate shock transmission better than solid steel? Discuss shock impedance mismatch causing wave reflections.
Part 3 — IM CLASSIFICATION: This test resulted in ${isDetonation ? "a failure" : "a pass"}. What are the storage restrictions for explosives that routinely sympathetically detonate adjacent charges versus those that don't?`,
    [gapDistance, barrier, acceptorSens, isDetonation, currentBarrier, shockTransmitted, criticalPressure],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={150} maxWidth={460} />
      
      <PillRow>
        <Pill active={barrier === "air"} onClick={() => setBarrier("air")} color={T.gray}>Air Gap</Pill>
        <Pill active={barrier === "steel"} onClick={() => setBarrier("steel")} color={T.orange}>Steel Plate</Pill>
        <Pill active={barrier === "poly"} onClick={() => setBarrier("poly")} color={T.cyan}>Polycarbonate</Pill>
      </PillRow>

      <Slider label="Gap Distance" value={gapDistance} onChange={setGapDistance} min={0} max={100} step={5} unit=" mm" color={T.accent} />
      <Slider label="Acceptor Explosive Sensitivity" value={acceptorSens} onChange={setAcceptorSens} min={1} max={10} step={1} unit="/10" color={T.red} />
      
      <DataRow>
        <DataBox label="Shock Trans." value={shockTransmitted.toFixed(0)} unit="idx" color={T.orange} />
        <DataBox label="Crit. Press." value={criticalPressure.toFixed(0)} unit="idx" color={T.purple} />
        <DataBox label="Result" value={isDetonation ? "GO" : "NO-GO"} color={isDetonation ? T.red : T.green} />
      </DataRow>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
         <ActionBtn onClick={testFire} disabled={firing} color={T.red}>💥 RUN GAP TEST</ActionBtn>
      </div>

      <InfoBox color={isDetonation ? T.red : T.green}>
        <strong>Sympathetic Detonation (Gap Tests)</strong> evaluate whether the detonation of a donor charge will impart a strong enough shockwave across a gap or barrier to detonate an adjacent acceptor charge. Complex barriers (like Polycarbonate composites) exploit <em>shock impedance mismatch</em>, reflecting and scattering the shockwave far more efficiently than homogeneous steel, preventing catastrophic chain reactions in ammunition storage arrays.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="symp_detonation" getData={() => ({ gapDistance, barrier, acceptorSens, shockTransmitted, isDetonation })} color={T.cyan} />
    </div>
  );
}
