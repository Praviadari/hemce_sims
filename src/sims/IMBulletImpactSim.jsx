import { useState, useCallback, useRef, useEffect } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ActionBtn, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function IMBulletImpactSim() {
  const [explosive, setExplosive] = useState("tnt");
  const [casingThick, setCasingThick] = useState(6); // mm
  const [bulletVelocity, setBulletVelocity] = useState(850); // m/s (12.7mm bullet typically)

  const [firing, setFiring] = useState(false);
  const [reactionPhase, setReactionPhase] = useState(0); 
  const animRef = useRef(null);

  const expData = {
    tnt:   { sens: 5, label: "TNT (High Sens)", color: "#F6E05E" },
    compb: { sens: 6, label: "Comp-B (Very High)", color: "#ED8936" }, // more sensitive
    pbxn:  { sens: 2, label: "PBXN-109 (IM)", color: "#4A5568" }, // Insensitive
  };

  const current = expData[explosive];

  // IM Reaction scoring (Type I to Type VI)
  // Higher Score = More violent reaction
  // Bullet kin energy scales with v^2
  const energyFactor = Math.pow(bulletVelocity / 850, 2);
  
  // Casing provides mitigation up to a point, then creates confinement (which increases reaction violence if ignited)
  const penetrationRisk = Math.max(0, (energyFactor * 10) - casingThick); 
  const confinementFactor = casingThick * 0.5;

  let reactionScore = 0;
  if (penetrationRisk > 0) {
      reactionScore = current.sens * penetrationRisk * (1 + confinementFactor * 0.1);
  }

  const bulletMass = 0.046; // kg for 12.7mm AP
  const kineticEnergy = 0.5 * bulletMass * Math.pow(bulletVelocity, 2); // J
  const armorPenetration = Math.max(0, (bulletVelocity - 650) * 0.012 + 8); // approximate mm RHA equivalent
  const penetrationDepth = Math.min(1.0, penetrationRisk / 18);
  const hasPenetrated = penetrationDepth > 0.12;

  // Map to NATO standard IM types I-V
  let responseType = "Type V";
  let responseDesc = "No Reaction";
  let responseColor = T.green;
  let severity = 1;

  if (reactionScore > 80) { responseType = "Type I"; responseDesc = "Detonation"; responseColor = T.red; severity = 5; }
  else if (reactionScore > 60) { responseType = "Type II"; responseDesc = "Partial Detonation"; responseColor = T.red; severity = 4; }
  else if (reactionScore > 40) { responseType = "Type III"; responseDesc = "Burn"; responseColor = T.orange; severity = 3; }
  else if (reactionScore > 20) { responseType = "Type IV"; responseDesc = "Deflagration"; responseColor = T.gold; severity = 2; }

  const fireBullet = () => {
      setFiring(true);
      setReactionPhase(0);
      let frames = 0;
      const tick = () => {
          frames++;
          if(frames < 30) setReactionPhase(frames/30); // bullet traveling
          else if(frames < 90) setReactionPhase(1 + (frames-30)/60); // impact & reaction
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
  }, [explosive, casingThick, bulletVelocity]);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const shellX = W * 0.32;
      const shellY = H * 0.5;
      const shellL = 220;
      const shellH = 84;
      const casingPx = 4 + Math.min(10, casingThick * 0.4);
      const shellLeft = shellX;
      const shellRight = shellX + shellL;
      const shellTop = shellY - shellH / 2;
      const shellBottom = shellY + shellH / 2;
      const bulletStart = 36;
      const bulletTarget = shellLeft - 16;
      const travelPhase = Math.min(1, reactionPhase / 0.4);
      const bulletX = firing ? bulletStart + (bulletTarget - bulletStart) * travelPhase : bulletStart;
      const impactPhase = Math.max(0, Math.min(1, (reactionPhase - 0.4) / 0.2));
      const penetrationPhase = Math.max(0, Math.min(1, (reactionPhase - 0.6) / 0.4));
      const reactionPhaseNormalized = Math.max(0, Math.min(1, (reactionPhase - 1.0) / 0.8));
      const scoreLabels = [
        { label: "I: Det", color: T.red },
        { label: "II: Part Det", color: T.red },
        { label: "III: Burn", color: T.orange },
        { label: "IV: Deflag", color: T.gold },
        { label: "V: No React", color: T.green },
      ];
      const selectedIndex = severity === 5 ? 0 : severity === 4 ? 1 : severity === 3 ? 2 : severity === 2 ? 3 : 4;

      // Background floor shading
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, shellY + shellH / 2 + 14, W, 8);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, shellY + shellH / 2 + 22, W, 4);

      // Munition cylinder body
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(shellLeft + shellH/2, shellTop);
      ctx.lineTo(shellRight - shellH/2, shellTop);
      ctx.arc(shellRight - shellH/2, shellY, shellH/2, -Math.PI/2, Math.PI/2);
      ctx.lineTo(shellLeft + shellH/2, shellBottom);
      ctx.arc(shellLeft + shellH/2, shellY, shellH/2, Math.PI/2, -Math.PI/2);
      ctx.closePath();
      ctx.fillStyle = "#4A5568";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.stroke();
      ctx.restore();

      // Explosive fill inside casing
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(shellLeft + shellH/2 + casingPx, shellTop + casingPx);
      ctx.lineTo(shellRight - shellH/2 - casingPx, shellTop + casingPx);
      ctx.arc(shellRight - shellH/2 - casingPx, shellY, shellH/2 - casingPx, -Math.PI/2, Math.PI/2);
      ctx.lineTo(shellLeft + shellH/2 + casingPx, shellBottom - casingPx);
      ctx.arc(shellLeft + shellH/2 + casingPx, shellY, shellH/2 - casingPx, Math.PI/2, -Math.PI/2);
      ctx.closePath();
      ctx.fillStyle = current.color;
      ctx.fill();
      ctx.restore();

      // Bullet shape
      ctx.save();
      ctx.translate(bulletX, shellY);
      ctx.fillStyle = "#E2E8F0";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(24, -8);
      ctx.lineTo(42, 0);
      ctx.lineTo(24, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#718096";
      ctx.fillRect(16, -4, 28, 8);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillRect(22, -3, 10, 6);
      ctx.restore();

      // Bullet trail before firing
      if (!firing) {
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(bulletStart + 46, shellY);
        ctx.lineTo(shellLeft - 20, shellY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Impact crater and shock wave
      if (impactPhase > 0) {
        const impactX = shellLeft - 12;
        const impactY = shellY;

        // Crater
        const craterRadius = 8 + impactPhase * 6;
        ctx.fillStyle = "rgba(26, 32, 44, 0.95)";
        ctx.beginPath();
        ctx.arc(impactX, impactY, craterRadius, 0, Math.PI * 2);
        ctx.fill();

        // Crack lines
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i += 1) {
          const angle = (Math.PI * 2 / 6) * i + impactPhase * 0.6;
          ctx.beginPath();
          ctx.moveTo(impactX, impactY);
          ctx.lineTo(impactX + Math.cos(angle) * (16 + impactPhase * 24), impactY + Math.sin(angle) * (12 + impactPhase * 16));
          ctx.stroke();
        }

        // Shock ripples
        ctx.strokeStyle = `rgba(237, 137, 54, ${1 - impactPhase})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(impactX, impactY, 18 + impactPhase * 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(impactX, impactY, 28 + impactPhase * 20, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Penetration line and bullet entry
      if (penetrationPhase > 0 && hasPenetrated) {
        const startX = shellLeft - 12;
        const entryLen = Math.min(shellL - casingPx * 5, penetrationPhase * (shellL * 0.55));
        ctx.strokeStyle = "rgba(255, 99, 71, 0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(startX, shellY);
        ctx.lineTo(startX + entryLen, shellY);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.beginPath();
        ctx.arc(startX + entryLen, shellY, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Penetration depth gauge
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(shellLeft - 12, shellBottom + 18);
      ctx.lineTo(shellLeft - 12 + shellL * 0.55, shellBottom + 18);
      ctx.stroke();
      ctx.fillStyle = T.white;
      ctx.font = `600 10px ${TECH_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(`Penetration ${Math.round(penetrationDepth * 100)}%`, shellLeft - 12, shellBottom + 34);

      // Blast/Reaction effects
      if (reactionPhase > 0.6) {
        const effectX = shellLeft + 24;
        const effectR = reactionPhaseNormalized * 70;

        if (severity === 5 || severity === 4) {
          ctx.fillStyle = `rgba(255, 220, 128, ${0.9 - reactionPhaseNormalized * 0.6})`;
          ctx.beginPath();
          ctx.arc(effectX, shellY, effectR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, 120, 120, ${0.55 - reactionPhaseNormalized * 0.35})`;
          ctx.beginPath();
          ctx.arc(effectX, shellY, effectR * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }

        if (severity === 3) {
          for (let i = 0; i < 5; i += 1) {
            const flameX = effectX + Math.cos(i * 1.15 + frame * 0.03) * 12;
            const flameY = shellY - 4 - i * 4 + Math.sin(frame * 0.04 + i) * 4;
            ctx.fillStyle = `rgba(237, 137, 54, ${0.6 - i * 0.08})`;
            ctx.beginPath();
            ctx.ellipse(flameX, flameY, 10 - i, 18 - i * 2, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (severity === 2) {
          ctx.fillStyle = `rgba(255, 186, 73, ${0.5 + reactionPhaseNormalized * 0.4})`;
          ctx.beginPath();
          ctx.ellipse(effectX, shellY, 12, 22, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
        }

        if (severity === 1) {
          ctx.fillStyle = `rgba(66, 153, 225, ${0.85 - reactionPhaseNormalized * 0.45})`;
          ctx.beginPath();
          ctx.arc(shellLeft - 12, shellY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = T.white;
          ctx.font = `700 14px ${TECH_FONT}`;
          ctx.textAlign = "center";
          ctx.fillText("PASS ✓", shellLeft + shellL * 0.45, shellY - shellH - 6);
        }
      }

      // Explosive label
      ctx.fillStyle = T.white;
      ctx.font = `600 10px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(current.label, shellLeft + shellL / 2, shellY + 4);

      // Vertical scorecard
      const chartX = W - 92;
      const chartY = 30;
      const labelWidth = 64;
      ctx.textAlign = "left";
      ctx.font = `600 10px ${TECH_FONT}`;
      for (let i = 0; i < scoreLabels.length; i += 1) {
        const y = chartY + i * 28;
        ctx.fillStyle = scoreLabels[i].color;
        ctx.fillRect(chartX, y, 16, 18);
        if (i === selectedIndex) {
          ctx.strokeStyle = T.white;
          ctx.lineWidth = 2;
          ctx.strokeRect(chartX - 2, y - 2, 20, 22);
        }
        ctx.fillStyle = T.white;
        ctx.fillText(scoreLabels[i].label, chartX + 24, y + 13);
      }

      // Labels and gauges
      ctx.fillStyle = T.white;
      ctx.font = `700 11px ${TECH_FONT}`;
      ctx.fillText("Impact Scorecard", chartX, chartY - 12);
      ctx.font = `600 10px ${TECH_FONT}`;
      ctx.fillText(`KE ${Math.round(kineticEnergy)} J`, chartX, chartY + 160);
      ctx.fillText(`Armor Pene ${Math.round(armorPenetration)} mm`, chartX, chartY + 176);
    },
    [explosive, casingThick, bulletVelocity, current, firing, reactionPhase, severity, penetrationRisk, bulletMass, kineticEnergy, armorPenetration, penetrationDepth],
    { animate: firing },
  );

  const buildPrompt = useCallback(
    () =>
      `Insensitive Munitions (IM) Bullet Impact Test simulation — current parameters:
ROLE: "You are an IM standards expert mapping STANAG 4241 bullet impact criteria."

PARAMETERS:
1. Explosive Fill: ${current.label}
2. Casing Thickness: ${casingThick} mm
3. Threat: 12.7mm AP Bullet @ ${bulletVelocity} m/s
4. Energy Factor Limit: ${penetrationRisk.toFixed(1)}
5. Resulting IM Score: ${reactionScore.toFixed(0)}
6. Official Reaction Type: ${responseType} (${responseDesc})

ANALYSIS REQUEST:
Part 1 — TEST CRITERIA: What is STANAG 4241 and why do militaries demand munitions that resist bullet impacts without reacting worse than Type V (Burning)?
Part 2 — EXPLOSIVE SENSITIVITY: Why does Comp-B frequently result in a Type I (Detonation) event when struck, whereas PBXN-109 (an IM explosive) merely burns or deflagrates?
Part 3 — CONFINEMENT PARADOX: Explain why heavily encasing poor-quality explosives in thick steel can actually make non-penetrating hits safe, but makes penetrating hits drastically more violent (Deflagration-to-Detonation Transition, DDT).`,
    [explosive, casingThick, bulletVelocity, current, penetrationRisk, reactionScore, responseType, responseDesc],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={180} maxWidth={460} />
      
      <PillRow>
        <Pill active={explosive === "pbxn"} onClick={() => setExplosive("pbxn")} color={T.gray}>PBXN-109 (IM)</Pill>
        <Pill active={explosive === "tnt"} onClick={() => setExplosive("tnt")} color={T.gold}>TNT</Pill>
        <Pill active={explosive === "compb"} onClick={() => setExplosive("compb")} color={T.orange}>Comp-B</Pill>
      </PillRow>

      <Slider label="12.7mm Bullet Velocity" value={bulletVelocity} onChange={setBulletVelocity} min={500} max={1100} step={25} unit=" m/s" color={T.accent} />
      <Slider label="Steel Casing Thickness" value={casingThick} onChange={setCasingThick} min={2} max={20} step={1} unit=" mm" color={T.cyan} />
      
      <DataRow>
        <DataBox label="IM Class" value={responseType} color={responseColor} />
        <DataBox label="Reaction" value={responseDesc} color={responseColor} />
        <DataBox label="Risk Tally" value={reactionScore.toFixed(0)} color={T.gray} />
      </DataRow>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
         <ActionBtn onClick={fireBullet} disabled={firing} color={T.red}>🔥 TEST IMPACT</ActionBtn>
      </div>

      <InfoBox color={responseColor}>
        <strong>Insensitive Munitions (IM):</strong> To prevent catastrophic chain reactions aboard ships or in storage bunkers, NATO (STANAG 4241) requires munitions to suffer bullet impacts without detonating. <strong>{responseType} ({responseDesc})</strong> indicates that {severity >= 4 ? "the munition failed the IM requirement, violently detonating and risking friendly forces." : severity >= 2 ? "the munition violently burst but avoided a full shockwave detonation." : "the munition successfully passed IM requirements, burning safely or not reacting at all."}
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="im_bullet" getData={() => ({ explosive, casingThick, bulletVelocity, responseType, responseDesc })} color={T.cyan} />
    </div>
  );
}
