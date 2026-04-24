import { useState } from "react";
import { T, FONT, TECH_FONT } from "./utils";
import { Pill } from "./components";
import { SIM_REGISTRY, CATEGORIES } from "./sims";
import "./styles/global.css";

export default function App() {
  const [activeSim, setActiveSim] = useState("rocket");
  const [catFilter, setCatFilter] = useState("all");

  const filtered =
    catFilter === "all"
      ? SIM_REGISTRY
      : SIM_REGISTRY.filter((s) => s.cat === catFilter);

  const active = SIM_REGISTRY.find((s) => s.id === activeSim);
  const ActiveComp = active?.comp;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 50% 0%, #0a192f 0%, ${T.bg} 100%)`,
        color: T.white,
        fontFamily: FONT,
        padding: "16px 12px 60px",
        maxWidth: "100%",
        margin: "0 auto",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Decorative background elements */}
      <div style={{
        position: "fixed",
        top: "-10%",
        left: "-10%",
        width: "40%",
        height: "40%",
        background: `${T.accent}08`,
        filter: "blur(100px)",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 0
      }} />
      <div style={{
        position: "fixed",
        bottom: "10%",
        right: "-10%",
        width: "30%",
        height: "30%",
        background: `${T.pink}05`,
        filter: "blur(80px)",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 10, position: "relative", zIndex: 1 }}>
        <div style={{ 
          fontSize: 10, 
          color: T.accent, 
          letterSpacing: 4, 
          fontWeight: 800,
          textTransform: "uppercase",
          textShadow: `0 0 10px ${T.accent}30`
        }}>
          HEMCE 2026 • THE FUTURE OF DEFENCE
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: T.white,
            fontFamily: TECH_FONT,
            letterSpacing: 1,
            marginTop: 6,
            background: `linear-gradient(to bottom, #fff, ${T.gray})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SIMULATION HUB
        </div>
        <div
          style={{
            width: 48,
            height: 3,
            background: `linear-gradient(90deg, ${T.accent}, ${T.pink})`,
            margin: "12px auto 0",
            borderRadius: 2,
            boxShadow: `0 0 10px ${T.accent}40`
          }}
        />
        <div style={{ fontSize: 10, color: T.dimText, marginTop: 8, fontWeight: 500 }}>
          THERMAL SYSTEMS HYD PVT. LTD. • EXHIBITION PORTAL
        </div>
      </div>

      {/* Category filter */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          overflowX: "auto",
          paddingBottom: 8,
          position: "relative",
          zIndex: 1,
          scrollbarWidth: "none"
        }}
        className="no-scrollbar"
      >
        {CATEGORIES.map((c) => (
          <Pill
            key={c.id}
            active={catFilter === c.id}
            onClick={() => setCatFilter(c.id)}
            color={c.color}
          >
            {c.label}
          </Pill>
        ))}
      </div>

      {/* Sim grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: 8,
          marginBottom: 16,
          position: "relative",
          zIndex: 1
        }}
      >
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSim(s.id)}
            style={{
              padding: "16px 8px",
              borderRadius: 16,
              border: activeSim === s.id
                ? `2px solid ${s.color}`
                : `1px solid ${T.glassBorder}`,
              background: activeSim === s.id ? `${s.color}15` : T.glass,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: activeSim === s.id ? s.color : T.white,
              fontFamily: TECH_FONT,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              boxShadow: activeSim === s.id ? `0 8px 20px ${s.color}25` : "0 4px 10px rgba(0,0,0,0.1)",
              transform: activeSim === s.id ? "scale(1.02)" : "scale(1)",
            }}
          >
            <div style={{ 
              fontSize: 24, 
              marginBottom: 4, 
              filter: activeSim === s.id ? `drop-shadow(0 0 8px ${s.color}60)` : "grayscale(0.5)",
              transition: "all .3s"
            }}>{s.icon}</div>
            <div style={{ lineHeight: 1.2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Active simulation */}
      {ActiveComp && (
        <div
          style={{
            background: T.card,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 20,
            padding: "16px 12px",
            border: `1px solid ${T.accent}20`,
            boxShadow: `0 15px 30px rgba(0,0,0,0.3), inset 0 0 20px ${T.accent}05`,
            position: "relative",
            zIndex: 1,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: T.white,
              fontFamily: TECH_FONT,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: `1px solid ${active.color}20`,
              paddingBottom: 12,
            }}
          >
            <span style={{ 
              fontSize: 28, 
              filter: `drop-shadow(0 0 10px ${active.color}80)` 
            }}>{active.icon}</span> 
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 10, color: active.color, letterSpacing: 2, fontWeight: 800 }}>ACTIVE SIMULATION</span>
              {active.label}
            </div>
          </div>
          <ActiveComp />
        </div>
      )}

      {/* Topic tags */}
      {active && (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1
          }}
        >
          {active.tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10,
                padding: "4px 12px",
                borderRadius: 20,
                background: `${active.color}15`,
                color: active.color,
                border: `1px solid ${active.color}30`,
                fontFamily: TECH_FONT,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: 32,
          fontSize: 10,
          color: T.dimText,
          lineHeight: 1.8,
          position: "relative",
          zIndex: 1
        }}
      >
        <div style={{ 
          background: `linear-gradient(90deg, transparent, ${T.dimText}40, transparent)`, 
          height: 1, 
          width: "100%", 
          marginBottom: 16 
        }} />
        SCAN QR AT BOOTH • INTERACT ON MOBILE
        <br />
        <strong style={{ color: T.gray }}>HEMCE 2026</strong> • THERMAL SYSTEMS HYD PVT. LTD.
        <br />
        29 APR – 01 MAY • HIGH ENERGY MATERIALS CONFERENCE & EXHIBITION
      </div>
    </div>
  );
}

