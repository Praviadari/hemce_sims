import { useState, useRef, useEffect, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { Pill, PillRow, Slider, DataBox, DataRow, InfoBox, SimCanvas, ActionBtn, ResetBtn, ExportBtn } from "../components";
import { AIInsight } from "../components/AIInsight";

import { MISSILE_DB } from "../data/missileDB";

export default function DetonationSim() {
  const related = MISSILE_DB.filter((m) => m.relatedSimId === "detonation");
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [charge, setCharge] = useState(5);
  const [distance, setDistance] = useState(20);
  const [heMat, setHeMat] = useState("tnt");
  const [barrier, setBarrier] = useState("none"); // "none" | "sandbag" | "concrete" | "aqueous_foam" | "composite"
  const [application, setApplication] = useState("openfield"); // "openfield" | "shaped_charge" | "efp" | "mining" | "demolition"
  const animRef = useRef(null);
  const vod = { tnt: 6900, rdx: 8750, cl20: 9380, hmx: 9100 }[heMat];
  const reF = { tnt: 1.0, rdx: 1.6, cl20: 2.0, hmx: 1.7 }[heMat];
  const tntEq = (charge * reF).toFixed(1);
  const scaledDist = distance / Math.pow(Number(tntEq), 1 / 3);
  const logZ = Math.log10(Number(scaledDist));
  let peakOP = Math.pow(10, 2.78 - 1.6 * logZ - 0.198 * logZ * logZ);
  if (scaledDist < 0.5) peakOP = 500;
  if (scaledDist > 40) peakOP = 0.001;

  const appData = {
    openfield: { factor: 1.0, desc: "Unconfined detonation — standard Kingery-Bulmash" },
    shaped_charge: { factor: 0.3, desc: "Energy focused into jet — 70% less blast, high penetration" },
    efp: { factor: 0.5, desc: "Explosively Formed Penetrator — moderate blast + projectile" },
    mining: { factor: 1.2, desc: "Confined blast — 20% amplification from rock reflection" },
    demolition: { factor: 0.8, desc: "Controlled demo — shaped charges reduce collateral blast" },
  };

  peakOP = peakOP * appData[application].factor;
  const peakOPDisplay = peakOP.toFixed(2);
  const attenuation = { none: 1.0, sandbag: 0.55, concrete: 0.30, aqueous_foam: 0.40, composite: 0.20 };
  const mitigatedOP = (Number(peakOP) * attenuation[barrier]).toFixed(2);
  const impulse = (((0.067 * Math.pow(Number(tntEq), 2 / 3)) / distance) * 1000).toFixed(0);
  const arrivalMs = ((distance / (340 + peakOP * 100)) * 1000).toFixed(0);
  const progress = Math.min(time / 2, 1);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const cy = H / 2,
        cx = 60;
      const theme = getCanvasTheme();

      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W);
      bgGrad.addColorStop(0, theme.canvasBackground);
      bgGrad.addColorStop(1, theme.canvasSurface);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H - 20);
      ctx.lineTo(W, H - 20);
      ctx.stroke();

      const chargeColor = { tnt: T.orange, rdx: T.gold, cl20: T.red, hmx: T.accent }[heMat];
      const pulse = Math.sin(frame * 0.05);
      ctx.shadowBlur = running ? 0 : 10 + pulse * 5;
      ctx.shadowColor = chargeColor;
      ctx.fillStyle = chargeColor;
      ctx.beginPath();
      ctx.roundRect(cx - 10 - pulse, cy - 10 - pulse, 20 + pulse * 2, 20 + pulse * 2, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = `900 8px ${TECH_FONT}`;
      ctx.fillStyle = T.bg;
      ctx.textAlign = "center";
      ctx.fillText("HE", cx, cy + 3);

      if (!running) {
        ctx.fillStyle = T.orange;
        for (let i = 0; i < 15; i++) {
          const a = prng(frame, i) * Math.PI * 2;
          const r = 20 + ((frame * 0.2 + prng(frame, i + 1) * 30) % 50);
          ctx.globalAlpha = Math.max(0, 1 - (r - 20) / 50);
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (running) {
        const r = progress * (W - 40);
        const alpha = Math.max(0, 1 - progress);

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
        ctx.lineWidth = 2 + (1 - progress) * 6;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2.2, Math.PI / 2.2);
        ctx.stroke();

        if (progress < 0.4) {
          const fireR = r * 0.6;
          const fireGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, fireR);
          fireGrad.addColorStop(0, T.white);
          fireGrad.addColorStop(0.3, T.orange);
          fireGrad.addColorStop(1, "transparent");
          ctx.fillStyle = fireGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, fireR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = `rgba(76, 201, 240, ${alpha * 0.2})`;
        ctx.lineWidth = 15;
        ctx.beginPath();
        if (r > 10) {
          ctx.arc(cx, cy, r - 10, -Math.PI / 2.2, Math.PI / 2.2);
          ctx.stroke();
        }
      }

      const tgt = Math.min(cx + distance * 3, W - 30);
      
      const barrierX = cx + distance * 1.5;
      if (barrier !== "none") {
        const barrierColor = { sandbag: "#8B7355", concrete: "#808080", aqueous_foam: T.cyan, composite: T.green }[barrier];
        ctx.fillStyle = barrierColor;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(barrierX - 5, cy - 30, 10, 60);
        ctx.globalAlpha = 1;
        ctx.font = `600 7px ${TECH_FONT}`;
        ctx.fillStyle = T.dimText;
        ctx.textAlign = "center";
        ctx.fillText(barrier.toUpperCase().replace("_", " "), barrierX, cy + 40);
      }

      ctx.strokeStyle = T.green;
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tgt, 20);
      ctx.lineTo(tgt, H - 20);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = `800 10px ${MONO_FONT}`;
      ctx.fillStyle = T.green;
      ctx.globalAlpha = 0.5 + Math.sin(frame * 0.08) * 0.5;
      ctx.fillText(`${distance}m STANDOFF`, tgt - 10, 15);
      ctx.globalAlpha = 1;

      if (running && progress * (W - 40) >= tgt - cx) {
        ctx.fillStyle = T.red;
        ctx.beginPath();
        ctx.arc(tgt, cy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `900 10px ${TECH_FONT}`;
        ctx.fillText("IMPACT", tgt - 20, cy - 15);
      }
    },
    [running, time, charge, distance, heMat, progress, barrier],
    { animate: true }
  );

  const profileRef = useCanvas(
    (ctx, W, H) => {
      const theme = getCanvasTheme();
      ctx.fillStyle = theme.canvasBackground;
      ctx.fillRect(0, 0, W, H);

      const padL = 30,
        padR = 10,
        padT = 8,
        padB = 15;
      const plotW = W - padL - padR,
        plotH = H - padT - padB;

      const thresholds = [
        { val: 0.07, label: "Glass", color: T.gold },
        { val: 0.35, label: "Ear", color: T.orange },
        { val: 2.0, label: "Lung", color: T.red },
      ];
      thresholds.forEach(({ val, label, color }) => {
        const y = padT + plotH * (1 - Math.min(1, Math.log10(val + 1) / Math.log10(6)));
        ctx.strokeStyle = `${color}40`;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = `600 6px ${TECH_FONT}`;
        ctx.fillStyle = color;
        ctx.textAlign = "right";
        ctx.fillText(`${label} ${val}`, padL - 2, y + 3);
      });

      ctx.strokeStyle = T.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const d = 2 + (i / 50) * 98;
        const z = d / Math.pow(Number(tntEq), 1 / 3);
        const logZ = Math.log10(z);
        const logP = 2.78 - 1.6 * logZ - 0.198 * logZ * logZ;
        const op = Math.pow(10, logP);
        const x = padL + (d / 100) * plotW;
        const y = padT + plotH * (1 - Math.min(1, Math.log10(op + 1) / Math.log10(6)));
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      const curX = padL + (distance / 100) * plotW;
      ctx.strokeStyle = T.green;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(curX, padT);
      ctx.lineTo(curX, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = `600 7px ${TECH_FONT}`;
      ctx.fillStyle = T.dimText;
      ctx.textAlign = "center";
      ctx.fillText("Distance (m)", W / 2, H - 2);
    },
    [charge, distance, heMat, tntEq],
  );

  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const tick = (now) => {
      const dt = (now - start) / 1000;
      setTime(dt);
      if (dt < 2) animRef.current = requestAnimationFrame(tick);
      else {
        setRunning(false);
        setTime(2);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running]);

  const reset = () => {
    cancelAnimationFrame(animRef.current);
    setRunning(false);
    setTime(0);
  };

  const buildPrompt = useCallback(
    () =>
      `Detonation blast effects simulation — current parameters:
ROLE: "You are an expert in detonics and blast effects. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Explosive material: ${heMat.toUpperCase()}
2. Charge mass: ${charge} kg
3. TNT equivalent: ${tntEq} kg
4. Stand-off distance: ${distance} m
5. Velocity of detonation: ${(vod / 1000).toFixed(2)} km/s
6. Hopkinson-Cranz scaled distance Z: ${scaledDist.toFixed(1)} m/kg^(1/3)
7. Peak overpressure at standoff: ${peakOPDisplay} bar
8. Impulse: ${impulse} kPa·ms
9. Arrival time: ${arrivalMs} ms
10. Barrier type: ${barrier}
11. Mitigated overpressure: ${mitigatedOP} bar
12. Application context: ${application}

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — SAFETY & RISK: What are the safety margins? What failure modes exist at these conditions? What would a test engineer watch for?
Part 3 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash) where applicable. What are India's current capabilities and gaps in this domain?
Related Indian systems: ${related.map((m) => m.name).join(", ")}`,
    [heMat, charge, tntEq, distance, vod, scaledDist, peakOPDisplay, impulse, arrivalMs, related, barrier, mitigatedOP, application],
  );

  const unClass = Number(peakOP) > 2 ? "1.1 Mass Explosion" :
                  Number(peakOP) > 0.35 ? "1.2 Projection Hazard" :
                  Number(peakOP) > 0.07 ? "1.3 Fire Hazard" : "1.4 Minor Hazard";
  const unColor = Number(peakOP) > 2 ? T.red : Number(peakOP) > 0.35 ? T.orange : T.gold;

  return (
    <div>
      <SimCanvas canvasRef={canvasRef} width={420} height={140} maxWidth={420} />
      <SimCanvas canvasRef={profileRef} width={340} height={60} label="Overpressure distance profile" />
      <PillRow>
        <Pill
          active={heMat === "tnt"}
          onClick={() => {
            reset();
            setHeMat("tnt");
          }}
          color={T.orange}
        >
          TNT
        </Pill>
        <Pill
          active={heMat === "rdx"}
          onClick={() => {
            reset();
            setHeMat("rdx");
          }}
          color={T.gold}
        >
          RDX
        </Pill>
        <Pill
          active={heMat === "hmx"}
          onClick={() => {
            reset();
            setHeMat("hmx");
          }}
          color={T.accent}
        >
          HMX
        </Pill>
        <Pill
          active={heMat === "cl20"}
          onClick={() => {
            reset();
            setHeMat("cl20");
          }}
          color={T.red}
        >
          CL-20
        </Pill>
      </PillRow>
      <PillRow>
        <Pill active={application === "openfield"} onClick={() => setApplication("openfield")} color={T.orange}>Open Field</Pill>
        <Pill active={application === "shaped_charge"} onClick={() => setApplication("shaped_charge")} color={T.red}>Shaped Charge</Pill>
        <Pill active={application === "efp"} onClick={() => setApplication("efp")} color={T.gold}>EFP</Pill>
        <Pill active={application === "mining"} onClick={() => setApplication("mining")} color={T.green}>Mining</Pill>
        <Pill active={application === "demolition"} onClick={() => setApplication("demolition")} color={T.gray}>Demolition</Pill>
      </PillRow>
      <div style={{ fontSize: 10, color: T.dimText, marginTop: 4, marginBottom: 12, fontStyle: "italic", textAlign: "center" }}>
        {appData[application].desc}
      </div>
      <PillRow>
        <Pill active={barrier === "none"} onClick={() => setBarrier("none")} color={T.red}>No Barrier</Pill>
        <Pill active={barrier === "sandbag"} onClick={() => setBarrier("sandbag")} color={T.gold}>Sandbag</Pill>
        <Pill active={barrier === "concrete"} onClick={() => setBarrier("concrete")} color={T.gray}>Concrete</Pill>
        <Pill active={barrier === "aqueous_foam"} onClick={() => setBarrier("aqueous_foam")} color={T.cyan}>Aqueous Foam</Pill>
        <Pill active={barrier === "composite"} onClick={() => setBarrier("composite")} color={T.green}>Composite</Pill>
      </PillRow>
      <Slider
        label="Charge Mass"
        value={charge}
        onChange={(v) => {
          reset();
          setCharge(v);
        }}
        min={1}
        max={50}
        unit=" kg"
        color={T.orange}
      />
      <Slider
        label="Standoff Distance"
        value={distance}
        onChange={(v) => {
          reset();
          setDistance(v);
        }}
        min={5}
        max={100}
        unit=" m"
        color={T.green}
      />
      <DataRow>
        <DataBox label="VoD" value={(vod / 1000).toFixed(1)} unit="km/s" color={T.orange} />
        <DataBox label="TNT Eq" value={tntEq} unit="kg" color={T.gold} />
        <DataBox
          label="Peak ΔP"
          value={peakOPDisplay}
          unit="bar"
          color={Number(peakOP) > 2 ? T.red : Number(peakOP) > 0.35 ? T.orange : Number(peakOP) > 0.07 ? T.gold : T.green}
        />
        <DataBox label="Mitigated ΔP" value={mitigatedOP} unit="bar" color={Number(mitigatedOP) > 2 ? T.red : Number(mitigatedOP) > 0.35 ? T.orange : T.green} />
        <DataBox label="Attenuation" value={Math.round((1 - attenuation[barrier]) * 100)} unit="%" color={barrier === "none" ? T.red : T.green} />
        <DataBox label="Impulse" value={impulse} unit="kPa·ms" color={T.purple} />
        <DataBox label="Arrival" value={arrivalMs} unit="ms" color={T.cyan} />
      </DataRow>
      <div style={{ fontSize: 10, color: T.dimText, marginTop: 4, textAlign: "center" }}>
        {Number(peakOP) > 2.0 ? (
          <span style={{ color: T.red }}>⚠ LUNG DAMAGE ZONE (&gt;2 bar)</span>
        ) : Number(peakOP) > 0.35 ? (
          <span style={{ color: T.orange }}>⚠ EARDRUM RUPTURE ZONE (&gt;0.35 bar)</span>
        ) : Number(peakOP) > 0.07 ? (
          <span style={{ color: T.gold }}>⚠ WINDOW BREAK ZONE (&gt;0.07 bar)</span>
        ) : (
          <span style={{ color: T.green }}>✓ Low risk zone</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <ActionBtn
          onClick={() => {
            if (!running) {
              setTime(0);
              setRunning(true);
            }
          }}
          disabled={running}
          color={T.red}
        >
          {running ? "DETONATING..." : "💥 DETONATE"}
        </ActionBtn>
        <ResetBtn onClick={reset} />
      </div>
      <InfoBox>
        <strong style={{ color: T.orange }}>Hopkinson-Cranz scaling:</strong> Z = R/W^(1/3). CL-20 is ~2× TNT equivalent
        — HEMRL&apos;s indigenous development. Overpressure &gt;1 bar causes structural damage.
        Blast mitigation uses barriers (sandbag, concrete, aqueous foam) to attenuate overpressure. Composite blast walls can reduce peak overpressure by 80%. HEMRL tests mitigation for ammunition storage safety.
        {related.length > 0 && (
          <div style={{ marginTop: 8, borderTop: `1px solid ${T.glassBorder}`, paddingTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 4 }}>
              INDIAN SYSTEMS USING THIS TECHNOLOGY:
            </div>
            {related.map((m) => (
              <div key={m.id} style={{ fontSize: 10, color: T.gray, marginBottom: 2 }}>
                {m.image_emoji} <strong style={{ color: T.white }}>{m.name}</strong>
                {" — "}{m.propulsion.stages} | {m.performance.range}
                {m.sources[0] && (
                  <a href={m.sources[0].url} target="_blank" rel="noopener noreferrer"
                     style={{ color: T.accent, marginLeft: 4, fontSize: 9 }}>
                    [source]
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </InfoBox>
      <InfoBox color={unColor}>
        <strong>UN Hazard Classification:</strong> {unClass}<br/>
        <span style={{ fontSize: 10 }}>
          Quantity-Distance (Q-D) safe storage: {Math.round(distance * 1.5)}m minimum separation.<br/>
          NEQ (Net Explosive Quantity): {tntEq} kg TNT equivalent.<br/>
          Ref: AASTP-1 (NATO) / JSG 1300 (Indian MoD) safety standards.
        </span>
      </InfoBox>
      <AIInsight buildPrompt={buildPrompt} color={T.red} />
      <ExportBtn
        simId="detonation"
        getData={() => ({ heMat, charge, distance, peakOP: peakOPDisplay, impulse, arrivalMs })}
        color={T.red}
      />
    </div>
  );
}
