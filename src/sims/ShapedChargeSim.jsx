import { useState, useMemo, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";

export default function ShapedChargeSim() {
  const [liner, setLiner] = useState("copper");
  const [coneAngle, setConeAngle] = useState(42);
  const [standoff, setStandoff] = useState(3);
  const [explosive, setExplosive] = useState("rdx");

  // ── Physics ────────────────────────────────────────────────────────────────
  const physics = useMemo(() => {
    const VoDMap = { rdx: 8750, hmx: 9100 };
    const linerDensityMap = { copper: 8960, tantalum: 16650, steel: 7850 };

    const VoD = VoDMap[explosive];
    const linerDensity = linerDensityMap[liner];
    const halfAngleRad = (coneAngle * Math.PI) / 360;

    // Munroe-effect jet & slug velocities
    const Vjet = VoD * Math.cos(halfAngleRad);
    const Vslug = VoD * Math.sin(halfAngleRad) * 0.3;

    // Birkhoff-Eichelberger penetration
    const linerLength = 80 / Math.tan(halfAngleRad); // mm
    const P = linerLength * Math.sqrt(linerDensity / 7850);

    // Standoff optimality factor
    const rawFactor = 1 - 0.05 * Math.pow(standoff - 3, 2);
    const standoffFactor = Math.min(1.0, Math.max(0.3, rawFactor));
    const Peff = Math.round(P * standoffFactor);

    return { Vjet, Vslug, P, standoffFactor, Peff, linerDensity };
  }, [liner, coneAngle, standoff, explosive]);

  // ── Canvas ─────────────────────────────────────────────────────────────────
  const canvasRef = useCanvas(
    (ctx, W, H) => {
      const canvasTheme = getCanvasTheme();

      // Background
      const bgGlow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
      bgGlow.addColorStop(0, `${T.red}08`);
      bgGlow.addColorStop(1, "transparent");
      ctx.fillStyle = canvasTheme.panelFill;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, W, H);

      // ── Colour helpers ────────────────────────────────────────────────────
      const linerColor = liner === "copper" ? "#b87333" : liner === "tantalum" ? "#8899aa" : "#aab0b8";
      const explColor = explosive === "rdx" ? "#c0392b" : "#8e44ad";

      // ── Shaped charge body (left-centre) ──────────────────────────────────
      const bodyX = 30,
        bodyY = 30,
        bodyW = 100,
        bodyH = H - 60;
      const cx = bodyX + bodyW / 2;

      // Cylindrical explosive body
      const bodyGrad = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
      bodyGrad.addColorStop(0, `${explColor}55`);
      bodyGrad.addColorStop(0.5, explColor);
      bodyGrad.addColorStop(1, `${explColor}55`);
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = `${T.red}80`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bodyX, bodyY, bodyW, bodyH, 6);
      ctx.fill();
      ctx.stroke();

      // Detonator (top, red circle)
      ctx.shadowBlur = 12;
      ctx.shadowColor = T.red;
      ctx.fillStyle = T.red;
      ctx.beginPath();
      ctx.arc(cx, bodyY + 10, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Conical liner (V-shape at bottom of charge)
      const halfAngleRad = (coneAngle * Math.PI) / 360;
      const coneHeight = Math.min(bodyH * 0.55, 70 / Math.tan(halfAngleRad));
      const coneBaseY = bodyY + bodyH;
      const coneHalfW = coneHeight * Math.tan(halfAngleRad);
      const coneTipX = cx;
      const coneTipY = coneBaseY - coneHeight;

      const linerGrad = ctx.createLinearGradient(cx - coneHalfW, 0, cx + coneHalfW, 0);
      linerGrad.addColorStop(0, `${linerColor}88`);
      linerGrad.addColorStop(0.5, linerColor);
      linerGrad.addColorStop(1, `${linerColor}88`);
      ctx.fillStyle = linerGrad;
      ctx.strokeStyle = `${linerColor}cc`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - coneHalfW, coneBaseY);
      ctx.lineTo(coneTipX, coneTipY);
      ctx.lineTo(cx + coneHalfW, coneBaseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // ── Jet & slug (extending right from cone tip) ────────────────────────
      const standoffPx = Math.min(standoff * 18, W - bodyX - bodyW - 40);
      const jetStartX = cx + bodyW / 2 + 4;
      const jetY = coneTipY;
      const targetX = bodyX + bodyW + standoffPx;

      // Jet glow line
      ctx.shadowBlur = 10;
      ctx.shadowColor = linerColor;
      const jetGrad = ctx.createLinearGradient(jetStartX, 0, targetX, 0);
      jetGrad.addColorStop(0, linerColor);
      jetGrad.addColorStop(1, "transparent");
      ctx.strokeStyle = jetGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(jetStartX, jetY);
      ctx.lineTo(targetX, jetY);
      ctx.stroke();

      // Slug (thicker blob just behind jet head)
      const slugX = jetStartX + (targetX - jetStartX) * 0.25;
      ctx.fillStyle = linerColor;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.ellipse(slugX, jetY, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // ── Target plate ──────────────────────────────────────────────────────
      const targetW = 18;
      const targetH = H - 40;
      const penetrationFrac = Math.min(physics.Peff / 300, 1); // normalise to 300 mm max
      const penetrationPx = penetrationFrac * targetW;

      ctx.fillStyle = "#607080";
      ctx.strokeStyle = `${T.gray}80`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(targetX, 20, targetW, targetH, 3);
      ctx.fill();
      ctx.stroke();

      // Penetration channel in target
      if (physics.Peff > 0) {
        ctx.fillStyle = canvasTheme.canvasSurface;
        ctx.beginPath();
        ctx.roundRect(targetX, jetY - 5, penetrationPx + 2, 10, 2);
        ctx.fill();
        // Spall glow at penetration front
        ctx.shadowBlur = 8;
        ctx.shadowColor = T.orange;
        ctx.fillStyle = T.orange;
        ctx.beginPath();
        ctx.arc(targetX + penetrationPx, jetY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Labels ────────────────────────────────────────────────────────────
      ctx.textAlign = "left";
      ctx.font = `900 9px ${TECH_FONT}`;
      ctx.fillStyle = T.accent;
      ctx.fillText("SHAPED CHARGE", bodyX, bodyY - 6);

      ctx.fillStyle = T.gray;
      ctx.font = `600 8px ${TECH_FONT}`;
      ctx.fillText(`STANDOFF: ${standoff} CD`, jetStartX + 2, jetY - 10);

      ctx.fillStyle = linerColor;
      ctx.fillText(liner.toUpperCase() + " LINER", bodyX, coneBaseY + 12);

      ctx.fillStyle = T.red;
      ctx.fillText("DET", cx - 10, bodyY + 28);

      ctx.fillStyle = T.dimText ?? "#88a0b8";
      ctx.textAlign = "center";
      ctx.fillText("RHA TARGET", targetX + targetW / 2, 16);
    },
    [liner, coneAngle, standoff, explosive, physics],
  );

  // ── AI prompt ──────────────────────────────────────────────────────────────
  const buildPrompt = useCallback(
    () =>
      `Shaped charge warhead engineering simulation — current parameters:
ROLE: "You are an expert in shaped charge warhead engineering, terminal ballistics, and DRDO anti-armour programs. You have deep knowledge of the Munroe effect, Birkhoff-Eichelberger penetration theory, and Indian defence R&D."

PARAMETERS (numbered):
1. Liner material: ${liner} (density ${liner === "copper" ? 8960 : liner === "tantalum" ? 16650 : 7850} kg/m³)
2. Cone half-angle: ${coneAngle / 2}° (full apex angle: ${coneAngle}°)
3. Standoff distance: ${standoff} caliber diameters (CD)
4. Explosive fill: ${explosive.toUpperCase()} (VoD: ${explosive === "rdx" ? 8750 : 9100} m/s)
5. Jet velocity (Vjet): ${(physics.Vjet / 1000).toFixed(2)} km/s
6. Slug velocity: ${Math.round(physics.Vslug)} m/s
7. Effective penetration: ${physics.Peff} mm RHA
8. Standoff efficiency factor: ${(physics.standoffFactor * 100).toFixed(0)}%

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Evaluate these parameters. What jet tip velocity regime does this represent? How does liner density affect penetration? Is the standoff optimal?
Part 2 — SAFETY & RISK: What are the key failure modes (jet break-up, precursor effects, target obliquity)? What safety considerations apply to shaped charge assembly and handling?
Part 3 — INDIA-SPECIFIC CONTEXT: How do these parameters relate to DRDO shaped charge programs? Reference specific Indian systems (e.g., Nag ATGM, Arjun MBT anti-tank rounds, Helina, MPATGM) where applicable. What are India's current capabilities and development focus in shaped charge warhead technology?`,
    [liner, coneAngle, standoff, explosive, physics],
  );

  const reset = () => {};

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={220} maxWidth={460} />

      {/* Liner selector */}
      <PillRow>
        <Pill active={liner === "copper"} onClick={() => setLiner("copper")}>
          🟤 Copper
        </Pill>
        <Pill active={liner === "tantalum"} onClick={() => setLiner("tantalum")}>
          ⚫ Tantalum
        </Pill>
        <Pill active={liner === "steel"} onClick={() => setLiner("steel")}>
          🔩 Steel
        </Pill>
      </PillRow>

      {/* Cone-angle selector */}
      <PillRow>
        <Pill active={coneAngle === 42} onClick={() => setConeAngle(42)}>
          42° (narrow)
        </Pill>
        <Pill active={coneAngle === 60} onClick={() => setConeAngle(60)}>
          60° (standard)
        </Pill>
        <Pill active={coneAngle === 90} onClick={() => setConeAngle(90)}>
          90° (wide)
        </Pill>
      </PillRow>

      {/* Explosive selector */}
      <PillRow>
        <Pill active={explosive === "rdx"} onClick={() => setExplosive("rdx")}>
          RDX
        </Pill>
        <Pill active={explosive === "hmx"} onClick={() => setExplosive("hmx")}>
          HMX
        </Pill>
      </PillRow>

      <Slider
        label="Standoff Distance"
        value={standoff}
        onChange={(v) => setStandoff(v)}
        min={1}
        max={20}
        step={0.5}
        unit=" CD"
        color={T.green}
      />

      <DataRow>
        <DataBox label="Jet Velocity" value={(physics.Vjet / 1000).toFixed(1)} unit="km/s" color={T.red} />
        <DataBox label="Penetration" value={physics.Peff} unit="mm RHA" color={T.orange} />
        <DataBox label="Standoff η" value={`${(physics.standoffFactor * 100).toFixed(0)}%`} color={T.green} />
        <DataBox label="Slug V" value={Math.round(physics.Vslug)} unit="m/s" color={T.purple} />
      </DataRow>

      <InfoBox color={T.red}>
        Shaped charges use the <strong style={{ color: T.red }}>Munroe effect</strong> — explosive-driven metal liner
        collapse forms a hypervelocity jet. DRDO's anti-tank munitions (Nag ATGM) use copper-lined shaped charges.
        Optimal standoff is <strong>2–4 CD</strong>.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.red} />
      <ExportBtn
        simId="shaped_charge"
        getData={() => ({
          liner,
          coneAngle,
          standoff,
          explosive,
          jetVelocityKms: (physics.Vjet / 1000).toFixed(2),
          penetrationMmRha: physics.Peff,
          standoffFactor: (physics.standoffFactor * 100).toFixed(0) + "%",
        })}
        color={T.red}
      />
    </div>
  );
}
