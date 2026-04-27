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
  if(penetrationRisk > 0) {
      reactionScore = current.sens * penetrationRisk * (1 + confinementFactor * 0.1);
  }

  // Map to NATO standard IM types
  let responseType = "Type VI";
  let responseDesc = "No Reaction";
  let responseColor = T.gray;
  let severity = 0;

  if (reactionScore > 80) { responseType = "Type I"; responseDesc = "Detonation"; responseColor = T.purple; severity = 5; }
  else if (reactionScore > 60) { responseType = "Type II"; responseDesc = "Partial Detonation"; responseColor = T.red; severity = 4; }
  else if (reactionScore > 40) { responseType = "Type III"; responseDesc = "Explosion"; responseColor = T.orange; severity = 3; }
  else if (reactionScore > 20) { responseType = "Type IV"; responseDesc = "Deflagration"; responseColor = T.gold; severity = 2; }
  else if (reactionScore > 5) { responseType = "Type V"; responseDesc = "Burning"; responseColor = T.cyan; severity = 1; }

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

      const cx = W / 2;
      const cy = H / 2;

      // Draw Bomb/Warhead profile
      const bombW = 80;
      const bombH = 100;
      
      if (reactionPhase < 1.1 || severity < 4) { // Survives structure intact somewhat
          ctx.fillStyle = current.color;
          ctx.fillRect(cx - bombW/2, cy - bombH/2, bombW, bombH);
          
          ctx.lineWidth = casingThick;
          ctx.strokeStyle = "#4A5568";
          ctx.strokeRect(cx - bombW/2, cy - bombH/2, bombW, bombH);
          
          ctx.font = `bold 10px ${TECH_FONT}`;
          ctx.fillStyle = T.white;
          ctx.textAlign = "center";
          ctx.fillText("WARHEAD", cx, cy);
      }

      if (firing) {
         if (reactionPhase <= 1.0) {
             // Bullet Approaching from left
             const bx = cx - 150 + (reactionPhase * (150 - bombW/2));
             ctx.fillStyle = T.orange;
             ctx.fillRect(bx, cy - 3, 15, 6);
             // motion blur
             ctx.fillStyle = "rgba(237, 137, 54, 0.3)";
             ctx.fillRect(bx - 30, cy - 2, 30, 4);
         } else {
             // Reaction!
             const pT = reactionPhase - 1.0; // 0 to 1
             
             if (penetrationRisk > 0) {
                 if (severity === 5 || severity === 4) {
                     // Type I / II Detonation (Massive blast)
                     const blastR = pT * W;
                     ctx.fillStyle = `rgba(159, 122, 234, ${1 - pT})`;
                     ctx.beginPath(); ctx.arc(cx, cy, blastR, 0, Math.PI*2); ctx.fill();
                     ctx.fillStyle = `rgba(255, 255, 255, ${1 - pT*2})`;
                     ctx.fillRect(0,0,W,H);
                     
                     // Fragments
                     ctx.fillStyle = "#A0AEC0";
                     for(let i=0; i<30; i++) {
                         const fx = cx + Math.cos(i) * (blastR * 0.8 + Math.random()*20);
                         const fy = cy + Math.sin(i*2) * (blastR * 0.8 + Math.random()*20);
                         ctx.fillRect(fx, fy, 4, 4);
                     }
                 }
                 else if (severity === 3) {
                     // Type III Explosion (Casing bursts, pressure wave but not full detonation)
                     const blastR = pT * W * 0.5;
                     ctx.fillStyle = `rgba(237, 137, 54, ${1 - pT})`;
                     ctx.beginPath(); ctx.arc(cx, cy, blastR, 0, Math.PI*2); ctx.fill();
                     
                     // Two big casing halves fly off
                     ctx.fillStyle = "#4A5568";
                     ctx.fillRect(cx - bombW/2 - pT*50, cy - bombH/2, 5, bombH);
                     ctx.fillRect(cx + bombW/2 + pT*50, cy - bombH/2, 5, bombH);
                 }
                 else if (severity === 2 || severity === 1) {
                     // Deflagration / Burn (Fire out of the bullet hole)
                     const holeX = cx - bombW/2;
                     
                     ctx.fillStyle = "#1A202C"; // scorch
                     ctx.beginPath(); ctx.arc(holeX, cy, 10, 0, Math.PI*2); ctx.fill();
                     
                     ctx.fillStyle = `rgba(246, 224, 94, ${1 - pT*0.5})`; // flame
                     ctx.beginPath(); 
                     ctx.arc(holeX - pT*40, cy, 8 + Math.random()*10, 0, Math.PI*2); 
                     ctx.fill();
                 }
             } else {
                 // Type VI No reaction (Bullet bounced or stuck)
                 ctx.fillStyle = T.gray;
                 ctx.beginPath(); ctx.arc(cx - bombW/2, cy, 4, 0, Math.PI*2); ctx.fill();
                 ctx.fillStyle = T.white;
                 ctx.font = `bold 10px ${TECH_FONT}`;
                 ctx.fillText("BULLET DEFEATED", cx, cy - 65);
             }
         }
      }

    },
    [explosive, casingThick, bulletVelocity, current, firing, reactionPhase, severity, penetrationRisk],
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
