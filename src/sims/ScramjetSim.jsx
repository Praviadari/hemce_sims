import { useState, useMemo, useCallback } from "react";
import { T, TECH_FONT, MONO_FONT, useCanvas, getCanvasTheme, prng } from "../utils";
import { MISSILE_DB } from "../data/missileDB";

export default function ScramjetSim() {
  const related = MISSILE_DB.filter((m) => m.relatedSimId === "scramjet");
  const [mach, setMach] = useState(6);
  const [propMode, setPropMode] = useState("scramjet");
  const [fuelType, setFuelType] = useState("hydrogen");
  const [altitude, setAltitude] = useState(25);
  const [cooling, setCooling] = useState(true);

  const handlePropMode = (mode) => {
    setPropMode(mode);
    const range = { scramjet: [4, 12], ramjet: [1.5, 5], irrt: [1.5, 4] }[mode];
    if (mach < range[0] || mach > range[1]) {
      setMach((range[0] + range[1]) / 2);
    }
  };

  const temp = useMemo(() => Math.round(288 * (1 + 0.2 * mach * mach)), [mach]);
  const { thrustN, eta, Pt2, Ve, Tcomb, T_atm } = useMemo(() => {
    const fuelHeat = fuelType === "hydrogen" ? 2200 : fuelType === "jp7" ? 1400 : 1600;
    const V0 = mach * 340;
    const P_atm = 101325 * Math.exp(-altitude / 8.5);
    const T_atm = 288 - 6.5 * Math.min(altitude, 11);
    const Pt2 = P_atm * Math.pow(1 + 0.2 * mach * mach, 3.5);
    const mdot = 0.5 + mach * 0.3;
    
    let thrustN = 0, Ve = 0, eta = 0, Tcomb = 0;
    
    if (propMode === "scramjet") {
      Tcomb = temp + fuelHeat;
      Ve = Math.sqrt(2 * 1005 * Tcomb * (1 - Math.pow(P_atm / Pt2, 0.286)));
      const F_sp = Ve - V0;
      thrustN = Math.max(0, Math.round((F_sp * mdot) / 1000));
      eta = Math.round((1 - T_atm / Tcomb) * 100);
    } else if (propMode === "ramjet") {
      Tcomb = temp + fuelHeat * 0.8;
      Ve = Math.sqrt(2 * 1005 * Tcomb * 0.6);
      const ramjetEta = mach < 2 ? 0.4 : mach > 4 ? 0.3 : 0.7;
      thrustN = Math.max(0, Math.round((Ve * ramjetEta - V0) * mdot / 1000));
      eta = Math.round((1 - T_atm / Tcomb) * 100 * ramjetEta);
    } else if (propMode === "irrt") {
      const irrtFuelHeat = { hydrogen: 1800, jp7: 1200, ethylene: 1400 }[fuelType];
      Tcomb = temp + irrtFuelHeat;
      const irrtEta = 0.55;
      Ve = Math.sqrt(2 * 1005 * Tcomb * irrtEta);
      thrustN = Math.max(0, Math.round((Ve - V0) * mdot * 0.8 / 1000));
      eta = Math.round((1 - T_atm / Tcomb) * 100 * irrtEta);
    }
    return { thrustN, eta, Pt2, Ve, Tcomb, T_atm };
  }, [mach, fuelType, altitude, temp, propMode]);
  const wallT = useMemo(() => {
    const base = temp * 0.6;
    return Math.round(cooling ? base * 0.35 : base);
  }, [temp, cooling]);

  const canvasRef = useCanvas(
    (ctx, W, H, frame) => {
      const cy = H / 2;

      // Canvas Backgrounds
      const theme = getCanvasTheme();
      const bgGrad = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, W);
      bgGrad.addColorStop(0, theme.canvasBackground);
      bgGrad.addColorStop(1, theme.canvasSurface);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      ctx.font = `900 12px ${TECH_FONT}`;
      ctx.fillStyle = T.white;
      ctx.textAlign = "center";
      ctx.fillText(propMode === "scramjet" ? "SCRAMJET" : propMode === "ramjet" ? "RAMJET" : "INTEGRAL RAM ROCKET", W/2, 20);

      // Inlet Diffuser
      ctx.fillStyle = "#2D3748";
      ctx.strokeStyle = `${T.accent}40`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20, cy - 40);
      ctx.lineTo(80, cy - 20);
      ctx.lineTo(80, cy + 20);
      ctx.lineTo(20, cy + 40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (propMode === "scramjet") {
        // Scramjet Combustor
        ctx.fillStyle = "#1A202C";
        ctx.fillRect(80, cy - 20, 180, 40);
        ctx.strokeRect(80, cy - 20, 180, 40);

        const flameGrad = ctx.createLinearGradient(130, 0, 260, 0);
        flameGrad.addColorStop(0, T.white);
        flameGrad.addColorStop(0.2, T.orange);
        flameGrad.addColorStop(1, "transparent");

        ctx.fillStyle = flameGrad;
        ctx.globalAlpha = 0.6 + prng(frame, 1) * 0.2;
        ctx.beginPath();
        ctx.roundRect(130, cy - 15, 130 + mach * 5, 30, 4);
        ctx.fill();
        ctx.globalAlpha = 1;

        for (let i = 0; i < 12; i++) {
          const px = 140 + prng(frame, i * 3) * 150;
          const py = cy + (prng(frame, i * 3 + 1) - 0.5) * 25;
          ctx.fillStyle = `rgba(255, 200, 100, ${prng(frame, i * 3 + 2) * 0.8})`;
          ctx.fillRect(px, py, 4 + prng(frame, i * 3 + 2) * 10, 1);
        }

        if (cooling) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = T.cyan;
          ctx.strokeStyle = `${T.cyan}88`;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(100, cy - 25, 160, 50);
          ctx.setLineDash([]);
          ctx.shadowBlur = 0;
        }

        // Expansion Nozzle
        ctx.fillStyle = "#2D3748";
        ctx.beginPath();
        ctx.moveTo(260, cy - 20); ctx.lineTo(340, cy - 45); ctx.lineTo(340, cy + 45); ctx.lineTo(260, cy + 20);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.font = `900 10px ${TECH_FONT}`;
        ctx.textAlign = "center";
        ctx.fillStyle = T.cyan; ctx.fillText("SUPERSONIC COMBUSTOR", 170, cy + 55);

      } else if (propMode === "ramjet") {
        // Ramjet Diffuser step to Subsonic Combustor
        ctx.fillStyle = "#1A202C";
        ctx.fillRect(80, cy - 35, 180, 70);
        ctx.strokeRect(80, cy - 35, 180, 70);

        // Flame holders (V-gutters)
        ctx.fillStyle = T.gray;
        ctx.beginPath(); ctx.moveTo(110, cy); ctx.lineTo(130, cy - 15); ctx.lineTo(130, cy + 15); ctx.fill();

        const flameGrad = ctx.createLinearGradient(130, 0, 260, 0);
        flameGrad.addColorStop(0, T.white); flameGrad.addColorStop(0.3, T.orange); flameGrad.addColorStop(1, "transparent");
        ctx.fillStyle = flameGrad;
        ctx.globalAlpha = 0.8 + prng(frame, 1) * 0.2;
        ctx.beginPath(); ctx.arc(130, cy, 20, -Math.PI/2.5, Math.PI/2.5); ctx.arc(260, cy, 30, Math.PI/2.5, -Math.PI/2.5); ctx.fill();
        ctx.globalAlpha = 1;

        // Expansion Nozzle
        ctx.fillStyle = "#2D3748";
        ctx.beginPath();
        ctx.moveTo(260, cy - 35); ctx.lineTo(340, cy - 15); ctx.lineTo(340, cy + 15); ctx.lineTo(260, cy + 35);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.font = `900 10px ${TECH_FONT}`;
        ctx.textAlign = "center";
        ctx.fillStyle = T.orange; ctx.fillText("SUBSONIC COMBUSTOR", 170, cy + 55);

      } else if (propMode === "irrt") {
        // IRRT Combustor Walls (Solid Fuel Grain lining)
        ctx.fillStyle = "#1A202C";
        ctx.fillRect(80, cy - 35, 180, 70);
        
        ctx.fillStyle = "#A0522D"; // Fuel Grain
        ctx.fillRect(80, cy - 35, 180, 15);
        ctx.fillRect(80, cy + 20, 180, 15);

        ctx.strokeRect(80, cy - 35, 180, 70);

        const flameGrad = ctx.createLinearGradient(120, 0, 260, 0);
        flameGrad.addColorStop(0, T.yellow); flameGrad.addColorStop(0.4, T.orange); flameGrad.addColorStop(1, "transparent");
        ctx.fillStyle = flameGrad;
        ctx.globalAlpha = 0.5 + prng(frame, 1) * 0.3;
        ctx.fillRect(100, cy - 20, 160, 40);
        ctx.globalAlpha = 1;

        // Expansion Nozzle
        ctx.fillStyle = "#2D3748";
        ctx.beginPath();
        ctx.moveTo(260, cy - 35); ctx.lineTo(340, cy - 20); ctx.lineTo(340, cy + 20); ctx.lineTo(260, cy + 35);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.font = `900 10px ${TECH_FONT}`;
        ctx.textAlign = "center";
        ctx.fillStyle = T.green; ctx.fillText("SOLID FUEL GRAIN BURN", 170, cy + 55);
      }

      // Exhaust Expansion Fan
      const exhaustGrad = ctx.createLinearGradient(340, 0, 410, 0);
      exhaustGrad.addColorStop(0, `${T.accent}44`); exhaustGrad.addColorStop(1, "transparent");
      ctx.fillStyle = exhaustGrad;
      ctx.beginPath(); ctx.moveTo(340, cy - (propMode === "scramjet" ? 40 : 15)); ctx.lineTo(410, cy - 60); ctx.lineTo(410, cy + 60); ctx.lineTo(340, cy + (propMode === "scramjet" ? 40 : 15)); ctx.fill();

      // Inlet Shockwaves (Aero-Heating)
      if (mach > 5) {
        ctx.shadowBlur = 10; ctx.shadowColor = T.red; ctx.strokeStyle = `rgba(255, 69, 58, 0.8)`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(20, cy - 40); ctx.lineTo(25, cy - 41); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20, cy + 40); ctx.lineTo(25, cy + 41); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.strokeStyle = `${T.cyan}${Math.floor(20 + mach * 10).toString(16)}`; ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(20, cy - 40); ctx.lineTo(60 + i * 15, cy - 10 + i * 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20, cy + 40); ctx.lineTo(60 + i * 15, cy + 10 - i * 5); ctx.stroke();
      }

      // Mach Vector Overlay
      ctx.strokeStyle = T.white;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, cy);
      ctx.lineTo(40, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(40, cy);
      ctx.lineTo(35, cy - 3);
      ctx.moveTo(40, cy);
      ctx.lineTo(35, cy + 3);
      ctx.stroke();
      ctx.font = `bold 9px ${MONO_FONT}`;
      ctx.fillStyle = T.white;
      ctx.fillText(`M${mach}`, 10, cy - 8);
    },
    [mach, fuelType, cooling],
    { animate: true },
  );

  const buildPrompt = useCallback(
    () =>
      `Air-breathing propulsion simulation — current parameters:
ROLE: "You are an expert in hypersonic and ramjet propulsion. You have deep knowledge of DRDO, HEMRL, and Indian defense R&D programs."

PARAMETERS (numbered):
1. Propulsion mode: ${propMode.toUpperCase()}
2. Flight Mach number: ${mach}
3. Fuel type: ${fuelType}
4. Altitude: ${altitude} km
5. Active regenerative cooling: ${cooling ? "YES" : "NO"}
6. Stagnation temperature: ${temp} K
7. Thermal efficiency: ${eta} %
8. Inlet total pressure: ${(Pt2 / 1e6).toFixed(2)} MPa
9. Exit velocity (Ve): ${Math.round(Ve)} m/s
10. Combustor total temperature: ${Tcomb} K
11. Net thrust: ${thrustN} kN

ANALYSIS REQUEST:
Part 1 — PERFORMANCE: Analyze these parameters. Are they realistic? What performance regime do they represent (low/medium/high)? What is the efficiency?
Part 2 — INDIA-SPECIFIC CONTEXT: How does this relate to DRDO/HEMRL programs? Reference specific Indian systems (e.g., Agni, BrahMos, Pinaka, SMART, Astra, Nag, Akash, HSTDV) where applicable. What are India's current capabilities and gaps in this domain?
Related Indian systems: ${related.map((m) => m.name).join(", ")}`,
    [propMode, mach, fuelType, altitude, cooling, temp, eta, Pt2, Ve, Tcomb, thrustN, related],
  );

  const modeInfo = {
    scramjet: "Supersonic combustion at M>5. DRDO HSTDV achieved Mach 6 flight (2020) and 1000s ground test (Apr 2025).",
    ramjet: "Subsonic combustion, M1.5-5 range. Powers Akash SAM (ramjet-rocket) and BrahMos cruise stage (liquid ramjet with JP-10).",
    irrt: "Integral Ram Rocket uses a solid fuel grain that burns with ram air — no liquid fuel system needed. PL8 speaker Dr. BS Subhash Chandran (DRDL) leads India's IRRT development for next-gen SAMs and cruise missiles.",
  };
  const machRange = { scramjet: [4, 12], ramjet: [1.5, 5], irrt: [1.5, 4] }[propMode];

  return (
    <div>
      <PillRow>
        <Pill active={propMode === "scramjet"} onClick={() => handlePropMode("scramjet")} color={T.cyan}>Scramjet</Pill>
        <Pill active={propMode === "ramjet"} onClick={() => handlePropMode("ramjet")} color={T.orange}>Ramjet</Pill>
        <Pill active={propMode === "irrt"} onClick={() => handlePropMode("irrt")} color={T.green}>IRRT</Pill>
      </PillRow>
      <SimCanvas canvasRef={canvasRef} width={420} height={130} maxWidth={420} />
      <PillRow>
        <Pill active={fuelType === "hydrogen"} onClick={() => setFuelType("hydrogen")} color={T.green}>
          {propMode === "irrt" ? "Boron-HTPB" : "Hydrogen"}
        </Pill>
        <Pill active={fuelType === "jp7"} onClick={() => setFuelType("jp7")} color={T.orange}>
          {propMode === "irrt" ? "Carbon-Metal" : "JP-7"}
        </Pill>
        <Pill active={fuelType === "ethylene"} onClick={() => setFuelType("ethylene")} color={T.cyan}>
          {propMode === "irrt" ? "AP-HTPB" : "Ethylene"}
        </Pill>
        {propMode === "scramjet" && (
          <Pill active={cooling} onClick={() => setCooling(!cooling)} color={T.cyan}>
            {cooling ? "Cooling ON" : "Cooling OFF"}
          </Pill>
        )}
      </PillRow>
      <Slider
        label="Mach Number"
        value={mach}
        onChange={setMach}
        min={machRange[0]}
        max={machRange[1]}
        step={0.5}
        unit=""
        color={T.orange}
      />
      <Slider label="Altitude" value={altitude} onChange={setAltitude} min={0} max={30} unit=" km" color={T.accent} />
      <DataRow>
        <DataBox label="Stagnation T" value={temp} unit="K" color={temp > 2500 ? T.red : T.orange} />
        <DataBox label="η_thermal" value={eta} unit="%" color={T.green} />
        <DataBox label="Inlet Pt" value={(Pt2 / 1e6).toFixed(1)} unit="MPa" color={T.purple} />
        <DataBox label="Ve" value={Math.round(Ve)} unit="m/s" color={T.cyan} />
        <DataBox label="Thrust" value={thrustN} unit="kN" color={T.green} />
        {propMode === "scramjet" && <DataBox label="Wall T" value={wallT} unit="K" color={wallT > 800 ? T.red : T.cyan} />}
      </DataRow>
      <InfoBox>
        <strong style={{ color: T.cyan }}>{propMode.toUpperCase()}:</strong> {modeInfo[propMode]}
        {propMode === "scramjet" && !cooling && " ⚠ Without cooling, walls exceed material limits above Mach 7."}
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
      <AIInsight buildPrompt={buildPrompt} color={T.cyan} />
      <ExportBtn
        simId="scramjet"
        getData={() => ({ mach, fuelType, altitude, cooling, thrustN, eta, Ve })}
        color={T.cyan}
      />
    </div>
  );
}
