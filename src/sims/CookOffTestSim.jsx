import { useState, useRef } from "react";
import { useCanvas, T, prng } from "../utils";
import { Pill, PillRow, DataBox, DataRow, InfoBox, SimCanvas, ActionBtn } from "../components";
import { AIInsight } from "../components/AIInsight";


export function CookOffTestSim() {
  const [phase, setPhase] = useState("idle"); // idle | heating | reaction
  const [munType, setMunType] = useState("standard"); // standard | insensitive
  const tempRef = useRef(20);

  const canvasRef = useCanvas(
    (ctx, W, H, frameCount) => {
      ctx.clearRect(0, 0, 460, 180);

      // Heating simulation logic (Fast Cook-Off Test equivalent)
      if (phase === "heating") {
        tempRef.current += 1.5;
        if (tempRef.current >= 400) {
          setPhase("reaction");
        }
      }

      const t = tempRef.current;

      // Draw the furnace / fire environment
      const fireIntensity = phase !== "idle" ? Math.min((t - 20) / 200, 1) : 0;
      ctx.fillStyle = `rgba(255, 50, 0, ${fireIntensity * 0.4 + Math.sin(frameCount * 0.2) * 0.1})`;
      ctx.fillRect(0, 100, 460, 80);

      // Draw the munition casing
      ctx.fillStyle = T.gray;
      ctx.fillRect(160, 60, 140, 60);
      ctx.fillStyle = "#444";
      ctx.fillRect(150, 55, 10, 70); // Base
      ctx.beginPath();
      ctx.moveTo(300, 60);
      ctx.lineTo(340, 90);
      ctx.lineTo(300, 120);
      ctx.fill(); // Nose cone

      // Inner energetic core
      ctx.fillStyle = munType === "insensitive" ? "#3b82f6" : "#ef4444";
      ctx.fillRect(165, 65, 130, 50);

      if (phase === "reaction") {
        if (munType === "standard") {
          // High-order Detonation
          ctx.fillStyle = `rgba(255, 200, 50, 0.9)`;
          ctx.beginPath();
          for (let i = 0; i < 15; i++) {
            const r = prng(frameCount, i * 3) * 150 + 50;
            const a = prng(frameCount, i * 3 + 1) * Math.PI * 2;
            ctx.lineTo(230 + Math.cos(a) * r, 90 + Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = T.white;
          ctx.font = "bold 20px monospace";
          ctx.textAlign = "center";
          ctx.fillText("CRITICAL FAILURE (DETONATION)", 230, 40);
        } else {
          // Deflagration (Burning peacefully)
          ctx.fillStyle = `rgba(100, 150, 255, 0.8)`;
          for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.arc(230 + (prng(frameCount, i * 4) * 100 - 50), 60 - prng(frameCount, i * 4 + 1) * 40, prng(frameCount, i * 4 + 2) * 20 + 10, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#3b82f6";
          ctx.font = "bold 20px monospace";
          ctx.textAlign = "center";
          ctx.fillText("SAFE BURN (TYPE V REACTION)", 230, 40);
        }
      } else {
        // Temperature read out
        ctx.fillStyle = phase === "idle" ? T.dimText : T.white;
        ctx.font = "16px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.floor(t)}°C`, 230, 30);
      }
    },
    [phase, munType],
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

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={180} />

      <PillRow>
        <Pill
          active={munType === "standard"}
          onClick={() => {
            setMunType("standard");
            reset();
          }}
          color={T.red}
        >
          Standard Munition
        </Pill>
        <Pill
          active={munType === "insensitive"}
          onClick={() => {
            setMunType("insensitive");
            reset();
          }}
          color="#3b82f6"
        >
          Insensitive Munition (IM)
        </Pill>
      </PillRow>

      <DataRow>
        <DataBox
          label="Cook-off Temp"
          value={munType === "insensitive" ? "180+" : "140"}
          unit="°C"
          color={munType === "insensitive" ? "#3b82f6" : undefined}
        />
        <DataBox
          label="Reaction Type"
          value={munType === "insensitive" ? "Burn" : "Detonate"}
          color={munType === "insensitive" ? "#3b82f6" : undefined}
        />
      </DataRow>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <ActionBtn onClick={startTest} disabled={phase !== "idle"} color={T.orange}>
          {phase === "heating" ? "HEATING..." : phase === "reaction" ? "TEST COMPLETED" : "INITIATE FIRE TEST"}
        </ActionBtn>
      </div>

      <InfoBox color={munType === "insensitive" ? "#3b82f6" : T.accent}>
        Insensitive Munitions (IM) are designed to withstand catastrophic external stimuli (Fast Cook-off, Bullet
        Impact, Sympathetic Detonation) using advanced polymer-bonded explosives (PBX) and venting casings. They simply
        burn instead of detonating violently, saving vessels and crews from catastrophic chain reactions.
      </InfoBox>

      <AIInsight
        buildPrompt={() =>
          `Explain the strategic importance of STANAG 4439 compliant Insensitive Munitions (IM) compared to standard TNT/RDX equivalents in modern defense platforms.`
        }
        color={munType === "insensitive" ? "#3b82f6" : undefined}
      />
    </div>
  );
}

export default CookOffTestSim;
