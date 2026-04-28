import { useState, useCallback } from "react";
import { T, TECH_FONT, useCanvas, getCanvasTheme } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

export default function BlastMitigationSim() {
  const [netExplosiveWeight, setNew] = useState(500); // kg TNT equivalent
  const [distance, setDistance] = useState(50); // meters
  const [barrier, setBarrier] = useState("none");
  const [storageClass, setStorageClass] = useState("1.1");

  const barrierData = {
    none:            { reduction: 1.0, label: "Open Air", color: "#A0AEC0" },
    wall:            { reduction: 0.6, label: "Concrete Blast Wall", color: "#F6AD55" },
    earth:           { reduction: 0.3, label: "Earth Berm / Igloo", color: "#9AE6B4" },
    aqueous_foam:    { reduction: 0.25, label: "Aqueous Foam", color: T.cyan },
    steel_container: { reduction: 0.15, label: "Steel ISO Container", color: T.gray },
  };

  const currentBarrier = barrierData[barrier];
  const qdMultiplier = { "1.1": 1.0, "1.2": 0.7, "1.3": 0.45, "1.4": 0.2 };
  const qdFactor = qdMultiplier[storageClass] ?? 1.0;

  // Quantity-Distance (Q-D) Scaling Law (Hopkinson-Cranz)
  // Scaled Distance: Z = R / (W ^ (1/3))
  const Z = distance / Math.pow(netExplosiveWeight, 1 / 3);

  // Incident Overpressure (rough empirical formula for TNT, output in kPa)
  let overpressure = 0;
  if (Z > 0) {
      const pBar = (6.7 / Math.pow(Z, 3)) + (2 / Math.pow(Z, 2)) + (0.5 / Z);
      overpressure = Math.round(pBar * 100 * currentBarrier.reduction); // kPa
  }

  const ibd = Math.round(22.2 * Math.pow(netExplosiveWeight * qdFactor, 1 / 3));
  const imd = Math.round(9.7 * Math.pow(netExplosiveWeight * qdFactor, 1 / 3));
  const fragRange = storageClass === "1.1" || storageClass === "1.2"
    ? Math.round(45 * Math.pow(netExplosiveWeight, 0.4))
    : 0;
  const impulse = Math.round(overpressure * 3.5 * currentBarrier.reduction);

  let damageLevel = "SAFE ZONE";
  let damageColor = T.green;
  if (overpressure > 200) { damageLevel = "TOTAL DESTRUCTION"; damageColor = T.purple; }
  else if (overpressure > 70) { damageLevel = "SEVERE STRUCTURAL"; damageColor = T.red; }
  else if (overpressure > 35) { damageLevel = "MODERATE DAMAGE"; damageColor = T.orange; }
  else if (overpressure > 7)  { damageLevel = "WINDOW BREAKAGE"; damageColor = T.gold; }

  const safeDistance = Math.max(ibd, fragRange + 15, distance + 25, Math.round(ibd * 1.3));

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const centerX = W * 0.34;
      const centerY = H * 0.52;
      const maxRing = Math.max(ibd, imd, fragRange, safeDistance, 120);
      const scale = (W * 0.52 - 40) / maxRing;
      const radiusIMD = Math.max(32, imd * scale);
      const radiusIBD = Math.max(radiusIMD + 18, ibd * scale);
      const radiusFrag = fragRange > 0 ? Math.max(radiusIBD + 18, fragRange * scale) : 0;
      const radiusSafe = Math.max(radiusFrag + 18, safeDistance * scale);

      const observerDist = Math.min(distance, maxRing * 0.9);
      const observerX = centerX + observerDist * scale;
      const barrierX = centerX + Math.min(observerDist * 0.45, maxRing * 0.6) * scale;
      const pulse = (frame % 140) / 140;

      // Rings
      const ringSet = [
        { r: radiusIMD, color: T.red, label: `IMD ${imd}m` },
        { r: radiusIBD, color: T.orange, label: `IBD ${ibd}m` },
        { r: radiusFrag, color: T.yellow, label: `Frag ${fragRange}m` },
        { r: radiusSafe, color: T.green, label: `Safe ${safeDistance}m` },
      ];

      ringSet.forEach((ring) => {
        if (!ring.r || ring.r <= 0) return;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Magazine / storage cell
      ctx.fillStyle = "#E53E3E";
      ctx.fillRect(centerX - 10, centerY - 10, 20, 20);
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(centerX - 10, centerY - 10, 20, 20);
      ctx.fillStyle = T.white;
      ctx.font = `600 10px ${TECH_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("MAG", centerX, centerY + 4);

      // Barrier line
      ctx.strokeStyle = currentBarrier.color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(barrierX, centerY - 32);
      ctx.lineTo(barrierX, centerY + 32);
      ctx.stroke();
      ctx.fillStyle = currentBarrier.color;
      ctx.font = `600 9px ${TECH_FONT}`;
      ctx.fillText(currentBarrier.label, barrierX, centerY + 52);

      // Observer icon
      ctx.fillStyle = T.blue;
      ctx.beginPath();
      ctx.arc(observerX, centerY + 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = T.white;
      ctx.fillRect(observerX - 1, centerY + 20, 2, 10);
      ctx.beginPath();
      ctx.moveTo(observerX - 6, centerY + 26);
      ctx.lineTo(observerX + 6, centerY + 26);
      ctx.strokeStyle = T.white;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.fillStyle = T.white;
      ctx.font = `600 10px ${TECH_FONT}`;
      ctx.fillText("Observer", observerX, centerY + 42);

      // Blast wave animation
      if (overpressure > 0) {
        ctx.strokeStyle = `rgba(255, 99, 71, ${0.6 - pulse * 0.4})`;
        ctx.lineWidth = 3;
        const blastR = Math.min(radiusSafe, radiusIMD + pulse * (radiusSafe - radiusIMD));
        ctx.beginPath();
        ctx.arc(centerX, centerY, blastR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Legend
      const legendX = W - 145;
      const legendY = 20;
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.fillRect(legendX - 10, legendY - 12, 150, 100);
      ctx.fillStyle = T.white;
      ctx.font = `700 11px ${TECH_FONT}`;
      ctx.fillText("Q-D Legend", legendX, legendY);
      const legendItems = [
        { text: "IMD - inter-magazine", color: T.red },
        { text: "IBD - inhabited building", color: T.orange },
        { text: "Fragment range", color: T.yellow },
        { text: "Safe zone", color: T.green },
      ];
      ctx.font = `600 10px ${TECH_FONT}`;
      legendItems.forEach((item, idx) => {
        const y = legendY + 20 + idx * 18;
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, y - 10, 12, 12);
        ctx.fillStyle = T.white;
        ctx.fillText(item.text, legendX + 18, y);
      });

      // Ring labels
      ctx.fillStyle = T.white;
      ctx.font = `600 9px ${TECH_FONT}`;
      ringSet.forEach((ring) => {
        if (!ring.r || ring.r <= 0) return;
        ctx.fillText(ring.label, centerX + ring.r + 8, centerY + 2);
      });
    },
    [netExplosiveWeight, distance, barrier, storageClass, currentBarrier, overpressure, ibd, imd, fragRange, safeDistance],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Ammunition Storage Blast Mitigation calculation — current parameters:
ROLE: "You are a military safety infrastructure engineer applying Quantity-Distance (Q-D) principles for HEMRL/DRDO explosive storage limits."

PARAMETERS:
1. Net Explosive Weight (NEW): ${netExplosiveWeight} kg TNT eq
2. Standoff Distance: ${distance} m
      3. Storage Class: ${storageClass}
      4. Scaled Distance (Z): ${Z.toFixed(2)} m/kg^(1/3)
      5. Barrier: ${currentBarrier.label} (Mitigation: ${currentBarrier.reduction}x)
      6. Est. Incident Overpressure: ${overpressure} kPa
      7. Anticipated Damage level: ${damageLevel}

ANALYSIS REQUEST:
Part 1 — Q-D: Explain how AASTP-1 / JSG 1300 define safe distances and why Class 1.1 demands the greatest separation.
Part 2 — MITIGATION: Describe the difference between aqueous foam and steel ISO containers when reducing blast impulse and overpressure.
Part 3 — ASSESSMENT: With ${overpressure} kPa striking an inhabited building, what damage band would this fall into and what barriers would be required to keep it within safe Q-D limits?`,
    [netExplosiveWeight, distance, storageClass, currentBarrier, overpressure, Z, damageLevel],
  );

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={460} height={220} maxWidth={460} />
      
      <PillRow>
        <Pill active={barrier === "none"} onClick={() => setBarrier("none")} color={T.gray}>Open Air Stack</Pill>
        <Pill active={barrier === "wall"} onClick={() => setBarrier("wall")} color={T.orange}>Concrete Blast Wall</Pill>
        <Pill active={barrier === "earth"} onClick={() => setBarrier("earth")} color={T.green}>Earth Berm / Igloo</Pill>
        <Pill active={barrier === "aqueous_foam"} onClick={() => setBarrier("aqueous_foam")} color={T.cyan}>Aqueous Foam</Pill>
        <Pill active={barrier === "steel_container"} onClick={() => setBarrier("steel_container")} color={T.gray}>Steel ISO Container</Pill>
      </PillRow>

      <PillRow>
        <Pill active={storageClass === "1.1"} onClick={() => setStorageClass("1.1")} color={T.red}>1.1</Pill>
        <Pill active={storageClass === "1.2"} onClick={() => setStorageClass("1.2")} color={T.orange}>1.2</Pill>
        <Pill active={storageClass === "1.3"} onClick={() => setStorageClass("1.3")} color={T.yellow}>1.3</Pill>
        <Pill active={storageClass === "1.4"} onClick={() => setStorageClass("1.4")} color={T.green}>1.4</Pill>
      </PillRow>

      <Slider label="Net Explosive Weight (NEW)" value={netExplosiveWeight} onChange={setNew} min={100} max={5000} step={100} unit=" kg TNT" color={T.red} />
      <Slider label="Observer Distance" value={distance} onChange={setDistance} min={10} max={300} step={5} unit=" m" color={T.accent} />
      
      <DataRow>
        <DataBox label="IBD" value={ibd} unit="m" color={T.red} />
        <DataBox label="IMD" value={imd} unit="m" color={T.orange} />
        <DataBox label="Impulse" value={impulse} unit="kPa·ms" color={T.purple} />
        <DataBox label="Overpressure" value={overpressure} unit="kPa" color={damageColor} />
      </DataRow>

      <InfoBox color={T.cyan}>
        Quantity-Distance (Q-D) standards (AASTP-1 NATO / JSG 1300 India) define safe separation distances for explosive storage. Class 1.1 (mass detonation) requires the largest Q-D. Blast walls reduce overpressure by 40-85%. HEMRL and CFEES conduct Q-D validation testing for all Indian ammunition depots.
      </InfoBox>

      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn simId="blast_mitig" getData={() => ({ netExplosiveWeight, distance, barrier, storageClass, ibd, imd, fragRange, impulse, overpressure, damageLevel })} color={T.cyan} />
    </div>
  );
}
