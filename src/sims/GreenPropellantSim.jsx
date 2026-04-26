import { useState, useRef } from "react";
import { useCanvas, T } from "../utils";

export function GreenPropellantSim() {
  const [phase, setPhase] = useState("idle"); // idle | mixing | complete
  const [tech, setTech] = useState("adn"); // adn | han | gap
  const progressRef = useRef(0);
  const particlesRef = useRef([]);

  const initParticles = () => {
    particlesRef.current = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * 460,
      y: Math.random() * 180,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      type: Math.random() > 0.5 ? "oxidizer" : "fuel",
      alpha: Math.random() * 0.5 + 0.3,
    }));
  };

  if (particlesRef.current.length === 0) initParticles();

  const canvasRef = useCanvas(
    (ctx, W, H, frameCount) => {
      ctx.clearRect(0, 0, 460, 180);

      const isMixing = phase === "mixing";
      if (isMixing) {
        progressRef.current = Math.min(progressRef.current + 0.005, 1);
        if (progressRef.current >= 1) setPhase("complete");
      }

      particlesRef.current.forEach((p, i) => {
        // Movement
        if (isMixing) {
          // Vortex effect simulating nanoscale energetic mixing
          const cx = 230,
            cy = 90;
          const angle = Math.atan2(p.y - cy, p.x - cx);
          const dist = Math.hypot(p.x - cx, p.y - cy);

          p.x -= Math.sin(angle) * (dist * 0.05);
          p.y += Math.cos(angle) * (dist * 0.05);

          // Binding to form clustered nano-energetics
          if (progressRef.current > 0.5) {
            p.x += (cx - p.x) * 0.02;
            p.y += (cy - p.y) * 0.02;
            if (p.type === "fuel") p.type = "bound";
          }
        } else {
          // Brownian motion
          p.x += p.vx * 0.2;
          p.y += p.vy * 0.2;
          if (p.x < 0 || p.x > 460) p.vx *= -1;
          if (p.y < 0 || p.y > 180) p.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        let color;
        if (p.type === "oxidizer") color = tech === "adn" ? "120, 255, 160" : "80, 200, 255";
        else if (p.type === "fuel")
          color = "255, 200, 100"; // Nano-Al
        else color = "100, 255, 100"; // Bound green energetic

        ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
        ctx.shadowColor = `rgba(${color}, 0.8)`;
        ctx.shadowBlur = isMixing ? 15 : 5;
        ctx.fill();
      });

      if (phase === "complete") {
        ctx.fillStyle = "rgba(100, 255, 120, 0.2)";
        ctx.fillRect(0, 0, 460, 180);
        ctx.fillStyle = T.white;
        ctx.font = "24px 'Space Mono'";
        ctx.textAlign = "center";
        ctx.shadowBlur = 0;
        ctx.fillText("SYNTHESIS COMPLETE", 230, 95);
      }
    },
    [phase, tech],
    { animate: true },
  );

  const startMixing = () => {
    progressRef.current = 0;
    initParticles();
    setPhase("mixing");
  };

  const getStats = () => {
    if (tech === "adn") return { isp: 275, toxicity: "None", signature: "Reduced" };
    if (tech === "han") return { isp: 260, toxicity: "Low", signature: "Minimum" };
    return { isp: 245, toxicity: "None", signature: "Low" };
  };

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={180} />

      <PillRow>
        <Pill active={tech === "adn"} onClick={() => setTech("adn")}>
          ADN Oxidizer
        </Pill>
        <Pill active={tech === "han"} onClick={() => setTech("han")}>
          HAN-based
        </Pill>
        <Pill active={tech === "gap"} onClick={() => setTech("gap")}>
          GAP Polymer
        </Pill>
      </PillRow>

      <DataRow>
        <DataBox label="Estimated Isp" value={getStats().isp} unit="s" />
        <DataBox label="Toxicity" value={getStats().toxicity} />
        <DataBox label="Exhaust Sig" value={getStats().signature} />
      </DataRow>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <ActionBtn onClick={startMixing} disabled={phase === "mixing"} color="#2ecc71">
          {phase === "mixing" ? "SYNTHESIZING..." : "SYNTHESIZE MATRIX"}
        </ActionBtn>
      </div>

      <InfoBox>
        Green energetics like Ammonium Dinitramide (ADN) and Hydroxylammonium Nitrate (HAN) replace highly toxic and
        corrosive Hydrazine and Ammonium Perchlorate. They burn clean, producing zero HCl (hydrochloric acid) in the
        exhaust signature, while delivering higher specific impulse.
      </InfoBox>

      <AIInsight
        buildPrompt={() =>
          `Analyze the benefits of using ${tech.toUpperCase()} based green propellants over traditional highly toxic space and defense propulsion materials.`
        }
      />
    </div>
  );
}
