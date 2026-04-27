import { useState, useMemo, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas } from "../components";
import { AIInsight } from "../components/AIInsight";


export default function ReactiveArmorSim() {
  const [armorType, setArmorType] = useState("era");
  const [obliquity, setObliquity] = useState(30);
  const [threat, setThreat] = useState("heat");

  // ── Physics ────────────────────────────────────────────────────────────────
  const physics = useMemo(() => {
    const baseProt = {
      era: { ke: 80, heat: 400, fragment: 150 },
      nera: { ke: 50, heat: 250, fragment: 120 },
      composite: { ke: 300, heat: 200, fragment: 250 },
    };
    const baseV50 = { era: 1200, nera: 1000, composite: 1500 };
    const threatFactor = { ke: 1.0, heat: 0.6, fragment: 1.3 };
    const armorBonus = {
      era: threat === "heat" ? 15 : 5,
      composite: threat === "ke" ? 15 : 5,
      nera: 5,
    };

    const obliqRad = (obliquity * Math.PI) / 180;
    const obliquityFactor = Math.min(4.0, 1 / Math.cos(obliqRad));

    const protEff = Math.round(baseProt[armorType][threat] * obliquityFactor);
    const V50eff = Math.round(baseV50[armorType] * obliquityFactor * threatFactor[threat]);
    const defeatPct = Math.min(99, Math.round(60 + obliquity * 0.4 + armorBonus[armorType]));

    return { protEff, V50eff, defeatPct, obliquityFactor };
  }, [armorType, obliquity, threat]);

  // ── Canvas ─────────────────────────────────────────────────────────────────
  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const canvasTheme = getCanvasTheme();

      // Background
      const bgGlow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
      bgGlow.addColorStop(0, `${T.accent}08`);
      bgGlow.addColorStop(1, "transparent");
      ctx.fillStyle = canvasTheme.panelFill;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, W, H);

      // ── Colour helpers ──────────────────────────────────────────────────
      const reactiveColor = armorType === "era" ? T.red : armorType === "nera" ? T.accent : "#2ecc71";

      // ── Draw angled armor stack (centre) ────────────────────────────────
      const plateCx = W / 2 - 10;
      const plateCy = H / 2;
      const plateW = 28;
      const plateH = H * 0.72;
      const obliqRad = (obliquity * Math.PI) / 180;

      ctx.save();
      ctx.translate(plateCx, plateCy);
      ctx.rotate(-obliqRad);

      // Outer steel layer
      ctx.fillStyle = "#556070";
      ctx.strokeStyle = `${T.gray}60`;
      ctx.lineWidth = 1;
      ctx.fillRect(-plateW / 2 - 8, -plateH / 2, 8, plateH);
      ctx.strokeRect(-plateW / 2 - 8, -plateH / 2, 8, plateH);

      // Reactive / intermediate layer
      const shimmerShift = Math.sin(frame * 0.05) * 50;
      const reactGrad = ctx.createLinearGradient(-plateW / 2, 0 + shimmerShift, plateW / 2, 0 - shimmerShift);
      reactGrad.addColorStop(0, `${reactiveColor}55`);
      reactGrad.addColorStop(0.5, reactiveColor);
      reactGrad.addColorStop(1, `${reactiveColor}55`);
      ctx.fillStyle = reactGrad;
      ctx.strokeStyle = `${reactiveColor}99`;
      ctx.fillRect(-plateW / 2, -plateH / 2, plateW, plateH);
      ctx.strokeRect(-plateW / 2, -plateH / 2, plateW, plateH);

      // ERA tile markings
      if (armorType === "era") {
        ctx.strokeStyle = `${T.red}60`;
        ctx.lineWidth = 0.8;
        for (let y = -plateH / 2 + 14; y < plateH / 2 - 5; y += 14) {
          ctx.beginPath();
          ctx.moveTo(-plateW / 2, y);
          ctx.lineTo(plateW / 2, y);
          ctx.stroke();
          ctx.fillStyle = `rgba(255, 69, 58, ${0.1 + Math.sin(frame * 0.1 + y)*0.1})`;
          ctx.fillRect(-plateW / 2, y - 10, plateW, 10);
        }
      }
      // NERA wavy lines
      if (armorType === "nera") {
        ctx.strokeStyle = `${T.accent}50`;
        ctx.lineWidth = 1;
        for (let y = -plateH / 2 + 10; y < plateH / 2 - 5; y += 10) {
          ctx.beginPath();
          for (let x = -plateW / 2; x <= plateW / 2; x += 4) {
            const wave = Math.sin((x + y) * 0.4 - frame * 0.1) * 2;
            x === -plateW / 2 ? ctx.moveTo(x, y + wave) : ctx.lineTo(x, y + wave);
          }
          ctx.stroke();
        }
      }
      // Composite ceramic fracture lines
      if (armorType === "composite") {
        ctx.strokeStyle = "#2ecc7150";
        ctx.lineWidth = 0.7;
        const hexPts = [
          [-8, -plateH / 2 + 20],
          [4, -plateH / 2 + 30],
          [8, -plateH / 2 + 50],
          [-4, -plateH / 2 + 60],
          [-8, -plateH / 2 + 80],
          [6, -plateH / 2 + 90],
        ];
        hexPts.forEach(([hx, hy], i) => {
          if (i < hexPts.length - 1) {
            ctx.beginPath();
            ctx.moveTo(hx, hy);
            ctx.lineTo(hexPts[i + 1][0], hexPts[i + 1][1]);
            ctx.stroke();
          }
        });
      }

      // Inner steel backing
      ctx.fillStyle = "#455060";
      ctx.strokeStyle = `${T.gray}50`;
      ctx.lineWidth = 1;
      ctx.fillRect(plateW / 2, -plateH / 2, 8, plateH);
      ctx.strokeRect(plateW / 2, -plateH / 2, 8, plateH);

      ctx.restore();

      // ── Incoming threat (from left) ─────────────────────────────────────
      const threatEndX = plateCx - Math.cos(obliqRad) * (plateW / 2 + 8) - 10;
      const threatY = plateCy + Math.sin(obliqRad) * 0;
      
      const approach = (frame % 300) / 300; 
      const offsetX = -100 + approach * 100;
      const tX = threatEndX + offsetX;

      if (threat === "ke") {
        // Long thin APFSDS rod
        ctx.shadowBlur = 8;
        ctx.shadowColor = T.cyan;
        ctx.fillStyle = T.cyan;
        ctx.fillRect(40 + offsetX, threatY - 3, tX - (40 + offsetX), 6);
        ctx.shadowBlur = 0;
        // Fin stub
        ctx.fillStyle = `${T.cyan}88`;
        ctx.fillRect(40 + offsetX, threatY - 8, 14, 16);
      } else if (threat === "heat") {
        // HEAT projectile nose
        ctx.fillStyle = T.orange;
        ctx.strokeStyle = `${T.orange}aa`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tX, threatY);
        ctx.lineTo(tX - 20, threatY - 10);
        ctx.lineTo(tX - 50, threatY - 10);
        ctx.lineTo(tX - 50, threatY + 10);
        ctx.lineTo(tX - 20, threatY + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Standoff probe
        ctx.strokeStyle = T.yellow ?? "#f4c430";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tX, threatY);
        ctx.lineTo(tX + 18, threatY);
        ctx.stroke();
      } else {
        // Irregular fragment polygon
        ctx.fillStyle = T.gray;
        ctx.strokeStyle = "#88a0b8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const fpts = [
          [tX - 18, threatY - 9],
          [tX - 8, threatY - 14],
          [tX, threatY - 4],
          [tX - 4, threatY + 10],
          [tX - 16, threatY + 8],
        ];
        fpts.forEach(([fx, fy], i) => (i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // ── Impact effects ──────────────────────────────────────────────────
      const impactX = plateCx - Math.cos(obliqRad) * 4;
      const impactY = plateCy;

      if (armorType === "era") {
        // Reactive tiles flying out — deterministic rotation per tile index
        const tileOffsets = [
          [-16, -22],
          [10, -18],
          [-8, 18],
          [14, 20],
          [-22, 4],
        ];
        tileOffsets.forEach(([dx, dy], tileIdx) => {
          ctx.save();
          ctx.translate(impactX + dx, impactY + dy);
          ctx.rotate(prng(0, tileIdx) * 0.5);
          ctx.fillStyle = T.orange;
          ctx.shadowBlur = 6;
          ctx.shadowColor = T.orange;
          ctx.fillRect(-4, -4, 8, 8);
          ctx.shadowBlur = 0;
          ctx.restore();
        });
      } else if (armorType === "nera") {
        // Bulging layer (ellipse outline)
        ctx.strokeStyle = `${T.accent}80`;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.ellipse(impactX, impactY, 18, 35, -obliqRad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Ceramic fracture radial lines
        ctx.strokeStyle = `#2ecc71aa`;
        ctx.lineWidth = 1;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
          ctx.beginPath();
          ctx.moveTo(impactX, impactY);
          ctx.lineTo(impactX + Math.cos(a) * 22, impactY + Math.sin(a) * 22);
          ctx.stroke();
        }
      }

      // ── Residual penetration indicator (right) ──────────────────────────
      const residualX = plateCx + Math.cos(obliqRad) * (plateW / 2 + 18) + 12;
      const residualMaxLen = 60;
      const residualFrac = Math.max(0, 1 - physics.defeatPct / 100);
      const residualLen = residualFrac * residualMaxLen;

      ctx.font = `700 8px ${TECH_FONT}`;
      ctx.fillStyle = T.dimText ?? "#88a0b8";
      ctx.textAlign = "left";
      ctx.fillText("RESIDUAL", residualX + 2, plateCy - 38);

      ctx.strokeStyle = `${T.gray}40`;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(residualX, plateCy - 30);
      ctx.lineTo(residualX, plateCy - 30 + residualMaxLen);
      ctx.stroke();

      if (residualLen > 0) {
        ctx.strokeStyle = residualFrac > 0.4 ? T.red : T.orange;
        ctx.shadowBlur = 8;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(residualX, plateCy - 30);
        ctx.lineTo(residualX, plateCy - 30 + residualLen);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.lineCap = "butt";

      // ── Labels ────────────────────────────────────────────────────────────
      ctx.textAlign = "left";
      ctx.font = `900 9px ${TECH_FONT}`;
      ctx.fillStyle = T.accent;
      ctx.fillText("ARMOR PROTECTION MODEL", 8, 14);

      ctx.font = `700 8px ${TECH_FONT}`;
      ctx.fillStyle = reactiveColor;
      ctx.fillText(armorType.toUpperCase(), plateCx - 14, 14);

      ctx.fillStyle = T.gray;
      ctx.fillText(`OBL: ${obliquity}°`, plateCx - 20, H - 8);

      ctx.fillStyle = T.cyan;
      ctx.textAlign = "right";
      ctx.fillText(threat.toUpperCase(), W - 8, 14);
    },
    [armorType, obliquity, threat, physics],
    { animate: true }
  );

  // ── AI prompt ──────────────────────────────────────────────────────────────
  const buildPrompt = useCallback(
    () =>
      `Ballistic protection and armor engineering simulation — current parameters:
ROLE: "You are an expert in ballistic protection, armor engineering, and DRDO vehicle protection programs. You have deep knowledge of ERA, NERA, composite armors, and Indian armored vehicle development."

PARAMETERS (numbered):
1. Armor type: ${armorType.toUpperCase()} (${armorType === "era" ? "Explosive Reactive Armor" : armorType === "nera" ? "Non-Explosive Reactive Armor" : "Ceramic-metal composite laminate"})
2. Obliquity angle: ${obliquity}°
3. Threat type: ${threat.toUpperCase()} (${threat === "ke" ? "KE penetrator / APFSDS" : threat === "heat" ? "HEAT shaped charge jet" : "Artillery fragment"})
4. Effective protection: ${physics.protEff} mm RHAe
5. Ballistic limit (V50): ${physics.V50eff} m/s
6. Defeat probability: ${physics.defeatPct}%
7. Obliquity factor (sec θ): ${physics.obliquityFactor.toFixed(2)}x

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Evaluate the protection effectiveness. Is the obliquity angle optimal? How does the armor type interact with this threat category?
Part 2 — SAFETY & RISK: What are the failure modes for this armor configuration? What are the survivability risks for the crew at this protection level?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO armor programs? Reference specific Indian systems (e.g., Arjun MBT Kanchan armor, FRCV program, BMP-II upgrades, DRDO ERA tiles) where applicable. What are India's current capabilities and development priorities in vehicle protection?`,
    [armorType, obliquity, threat, physics],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={220} maxWidth={460} />

      {/* Armor type */}
      <PillRow>
        <Pill active={armorType === "era"} onClick={() => setArmorType("era")}>
          💥 ERA
        </Pill>
        <Pill active={armorType === "nera"} onClick={() => setArmorType("nera")}>
          🔵 NERA
        </Pill>
        <Pill active={armorType === "composite"} onClick={() => setArmorType("composite")}>
          🟢 Composite
        </Pill>
      </PillRow>

      {/* Threat type */}
      <PillRow>
        <Pill active={threat === "ke"} onClick={() => setThreat("ke")}>
          ⚡ KE (APFSDS)
        </Pill>
        <Pill active={threat === "heat"} onClick={() => setThreat("heat")}>
          🎯 HEAT
        </Pill>
        <Pill active={threat === "fragment"} onClick={() => setThreat("fragment")}>
          💢 Fragment
        </Pill>
      </PillRow>

      <Slider
        label="Obliquity Angle"
        value={obliquity}
        onChange={(v) => setObliquity(v)}
        min={0}
        max={75}
        step={1}
        unit="°"
        color={T.cyan}
      />

      <DataRow>
        <DataBox label="Protection" value={physics.protEff} unit="mm RHAe" color={T.accent} />
        <DataBox label="V50" value={physics.V50eff} unit="m/s" color={T.green} />
        <DataBox
          label="Defeat %"
          value={`${physics.defeatPct}%`}
          color={physics.defeatPct > 80 ? T.green : physics.defeatPct > 50 ? T.orange : T.red}
        />
        <DataBox label="Obliquity" value={obliquity} unit="°" color={T.cyan} />
      </DataRow>

      <InfoBox color={T.accent}>
        <strong style={{ color: T.accent }}>DRDO&apos;s Kanchan</strong> composite armor (Arjun MBT) provides multi-threat
        protection. ERA tiles (Contact-5 type) are effective against HEAT jets but less so vs KE rods. NERA offers
        reusable protection without explosive risk.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.accent} />
    </div>
  );
}
