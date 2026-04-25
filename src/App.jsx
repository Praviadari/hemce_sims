import React, { useState, useEffect, Suspense, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";
import { THEMES, FONT, TECH_FONT } from "./utils";
import { Pill, ErrorBoundary } from "./components";
import { SIM_REGISTRY, CATEGORIES } from "./sims";
import "./styles/global.css";

/* Skeleton loader for lazy-loaded simulations */
function SimSkeleton({ color }) {
  const fallback = color || THEMES.dark.accent;

  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        borderRadius: 14,
        background: `${fallback}08`,
        border: `1px solid ${fallback}20`,
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    >
      <div
        style={{
          fontFamily: TECH_FONT,
          fontSize: 11,
          fontWeight: 800,
          color: fallback,
          letterSpacing: 2,
          opacity: 0.6,
        }}
      >
        LOADING SIMULATION...
      </div>
    </div>
  );
}

export default function App() {
  const [activeSim, setActiveSim] = useState("rocket");
  const [catFilter, setCatFilter] = useState("all");
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const currentTheme = THEMES[theme];

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const filtered =
    catFilter === "all"
      ? SIM_REGISTRY
      : SIM_REGISTRY.filter((s) => s.cat === catFilter);

  const active = SIM_REGISTRY.find((s) => s.id === activeSim);
  const ActiveComp = active?.comp;

  // Swipe gestures
  const [touchStart, setTouchStart] = useState(null);
  const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const dir = touchStart - touchEnd;
    if (Math.abs(dir) > 50) {
      const idx = filtered.findIndex((s) => s.id === activeSim);
      if (dir > 0 && idx < filtered.length - 1) setActiveSim(filtered[idx + 1].id);
      if (dir < 0 && idx > 0) setActiveSim(filtered[idx - 1].id);
    }
    setTouchStart(null);
  };

  // Exhibition Mode (Fullscreen + Wake Lock)
  const [exhibition, setExhibition] = useState(false);
  const wakeLockRef = useRef(null);

  const toggleExhibition = async () => {
    try {
      if (!exhibition) {
        if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        if ("wakeLock" in navigator) wakeLockRef.current = await navigator.wakeLock.request("screen");
        setExhibition(true);
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
        setExhibition(false);
      }
    } catch (err) {
      console.warn("Exhibition mode fully permitted only upon user gesture.", err);
    }
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 50% 0%, #0a192f 0%, ${currentTheme.bg} 100%)`,
        color: currentTheme.white,
        fontFamily: FONT,
        padding: "14px 10px 48px",
        maxWidth: "100%",
        margin: "0 auto",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: "fixed", top: "-10%", left: "-10%",
        width: "40%", height: "40%",
        background: `${currentTheme.accent}08`, filter: "blur(100px)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "10%", right: "-10%",
        width: "30%", height: "30%",
        background: `${currentTheme.pink}05`, filter: "blur(80px)",
        borderRadius: "50%", pointerEvents: "none", zIndex: 0,
      }} />

      {/* Skip-to-content for keyboard users */}
      <a
        href="#active-sim"
        style={{
          position: "absolute", top: -40, left: 8, zIndex: 100,
          background: currentTheme.accent, color: currentTheme.bg, padding: "6px 12px",
          borderRadius: 6, fontSize: 12, fontWeight: 700,
          transition: "top 0.2s",
        }}
        onFocus={(e) => { e.currentTarget.style.top = "8px"; }}
        onBlur={(e) => { e.currentTarget.style.top = "-40px"; }}
      >
        Skip to simulation
      </a>

      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: 20, paddingTop: 8, position: "relative", zIndex: 1 }}>
        <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 8 }}>
          <button
            onClick={toggleTheme}
            style={{
              background: currentTheme.glass,
              border: `1px solid ${currentTheme.glassBorder}`,
              color: currentTheme.accent,
              padding: "5px 10px", borderRadius: 8,
              fontFamily: TECH_FONT, fontSize: 8, fontWeight: 800,
              cursor: "pointer", touchAction: "manipulation",
              letterSpacing: 1,
            }}
          >
            {theme === "dark" ? "LIGHT MODE" : "DARK MODE"}
          </button>
          <button
            onClick={toggleExhibition}
            style={{
              background: exhibition ? `${currentTheme.red}20` : currentTheme.glass,
              border: `1px solid ${exhibition ? currentTheme.red : currentTheme.glassBorder}`,
              color: exhibition ? currentTheme.red : currentTheme.gray,
              padding: "5px 10px", borderRadius: 8,
              fontFamily: TECH_FONT, fontSize: 8, fontWeight: 800,
              cursor: "pointer", touchAction: "manipulation",
              letterSpacing: 1,
            }}
          >
            {exhibition ? "EXIT EXHIBIT MODE" : "ENTER EXHIBIT MODE"}
          </button>
        </div>
        <div style={{
          fontSize: "clamp(8px, 2.5vw, 11px)",
          color: currentTheme.accent,
          letterSpacing: 3,
          fontWeight: 800,
          textTransform: "uppercase",
          textShadow: `0 0 10px ${currentTheme.accent}30`,
        }}>
          HEMCE-2026 • 15TH INTERNATIONAL CONFERENCE & EXHIBITS
        </div>
        <div style={{
          fontSize: "clamp(18px, 5.5vw, 28px)",
          fontWeight: 900,
          color: currentTheme.white,
          fontFamily: TECH_FONT,
          letterSpacing: 1,
          marginTop: 5,
          background: `linear-gradient(to bottom, #fff, ${currentTheme.gray})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          SIMULATION HUB
        </div>
        <div style={{
          width: 44, height: 3,
          background: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.pink})`,
          margin: "10px auto 0",
          borderRadius: 2,
          boxShadow: `0 0 10px ${currentTheme.accent}40`,
        }} />
        <div style={{ fontSize: "clamp(8px, 2.2vw, 10px)", color: currentTheme.dimText, marginTop: 6, fontWeight: 500 }}>
          ORGANISED BY HEMSI IN ASSOCIATION WITH DRDO & ISRO
        </div>
      </header>

      {/* Category filter */}
      <nav
        aria-label="Filter simulations by category"
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 14,
          overflowX: "auto",
          paddingBottom: 6,
          position: "relative",
          zIndex: 1,
        }}
      >
        {CATEGORIES.map((c) => (
          <Pill key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)} color={c.color} label={`Filter: ${c.label}`}>
            {c.label}
          </Pill>
        ))}
      </nav>

      {/* Sim grid */}
      <div
        role="list"
        aria-label="Available simulations"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(115px, 1fr))",
          gap: 12,
          marginBottom: 20,
          position: "relative",
          zIndex: 1,
        }}
      >
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSim(s.id)}
            style={{
              padding: "14px 6px",
              borderRadius: 14,
              border: activeSim === s.id ? `2px solid ${s.color}` : `1px solid ${currentTheme.glassBorder}`,
              background: activeSim === s.id ? `${s.color}15` : currentTheme.glass,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: activeSim === s.id ? s.color : currentTheme.white,
              fontFamily: TECH_FONT,
              fontSize: "clamp(9px, 2.5vw, 11px)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all .25s cubic-bezier(0.4, 0, 0.2, 1)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              boxShadow: activeSim === s.id ? `0 6px 18px ${s.color}25` : "0 2px 8px rgba(0,0,0,0.15)",
              transform: activeSim === s.id ? "scale(1.03)" : "scale(1)",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              minHeight: 72,
            }}
            onTouchStart={(e) => { if (activeSim !== s.id) e.currentTarget.style.opacity = "0.75"; }}
            onTouchEnd={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <div style={{
              fontSize: 22,
              marginBottom: 2,
              filter: activeSim === s.id ? `drop-shadow(0 0 8px ${s.color}60)` : "grayscale(0.4)",
              transition: "all .25s",
            }}>{s.icon}</div>
            <div style={{ lineHeight: 1.2, fontSize: "clamp(9px, 2.5vw, 11px)" }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Active simulation panel */}
      {ActiveComp && (
        <div
          id="active-sim"
          style={{
            background: currentTheme.card,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 18,
            padding: "14px 10px",
            border: `1px solid ${currentTheme.accent}20`,
            boxShadow: `0 15px 30px rgba(0,0,0,0.3), inset 0 0 20px ${currentTheme.accent}05`,
            position: "relative",
            zIndex: 1,
            width: "100%",
          }}
        >
          {/* Panel header */}
          <div style={{
            fontSize: "clamp(13px, 3.5vw, 17px)",
            fontWeight: 900,
            color: currentTheme.white,
            fontFamily: TECH_FONT,
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: `1px solid ${active.color}20`,
            paddingBottom: 10,
          }}>
            <span style={{ fontSize: 26, filter: `drop-shadow(0 0 10px ${active.color}80)` }}>
              {active.icon}
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "clamp(8px, 2vw, 10px)", color: active.color, letterSpacing: 2, fontWeight: 800 }}>
                ACTIVE SIMULATION
              </span>
              {active.label}
            </div>
          </div>
          <ErrorBoundary color={active.color}>
            <Suspense fallback={<SimSkeleton color={active.color} />}>
              <ActiveComp />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {/* Topic tags */}
      {active && (
        <div style={{
          marginTop: 10,
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          position: "relative",
          zIndex: 1,
        }}>
          {active.tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: "clamp(8px, 2vw, 10px)",
                padding: "4px 10px",
                borderRadius: 20,
                background: `${active.color}12`,
                color: active.color,
                border: `1px solid ${active.color}28`,
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

      {/* About TSPL */}
      <div style={{
        marginTop: 40,
        padding: "24px 16px",
        borderRadius: 16,
        background: `linear-gradient(135deg, ${currentTheme.card}, ${currentTheme.bg})`,
        border: `1px solid ${currentTheme.glassBorder}`,
        position: "relative",
        zIndex: 1,
        textAlign: "center"
      }}>
        <div style={{ color: currentTheme.accent, fontFamily: TECH_FONT, fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 8 }}>
          TECHNOLOGY PARTNER
        </div>
        <div style={{ color: currentTheme.white, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
          Thermal Systems Hyderabad Pvt. Ltd. (TSPL)
        </div>
        <p style={{ color: currentTheme.gray, fontSize: 12, lineHeight: 1.6, maxWidth: 600, margin: "0 auto", marginBottom: 16 }}>
          With nearly four decades of expertise, TSPL is a global leader in designing, engineering, and delivering turnkey Waste Heat Recovery Solutions. Having successfully executed over 400+ projects across 40 countries, they specialize in high-energy thermal management and complex boilers for the world's most demanding continuous process operations.
        </p>
        <a href="https://www.thermalindia.com" target="_blank" rel="noopener noreferrer" style={{
          display: "inline-block",
          padding: "8px 16px",
          borderRadius: 20,
          background: `${currentTheme.accent}15`,
          border: `1px solid ${currentTheme.accent}40`,
          color: currentTheme.accent,
          fontFamily: TECH_FONT,
          fontSize: 10,
          fontWeight: 700,
          textDecoration: "none",
          letterSpacing: 1
        }}>
          EXPLORE THERMALINDIA.COM
        </a>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center",
        marginTop: 28,
        fontSize: "clamp(8px, 2.2vw, 10px)",
        color: currentTheme.dimText,
        lineHeight: 1.9,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          background: `linear-gradient(90deg, transparent, ${currentTheme.dimText}40, transparent)`,
          height: 1, width: "100%", marginBottom: 14,
        }} />
        SCAN QR AT BOOTH • INTERACT ON MOBILE
        <br />
        <strong style={{ color: currentTheme.gray }}>HEMCE-2026</strong> • APRIL 29 – MAY 1, 2026
        <br />
        LEONIA HOLISTIC DESTINATION • SHAMIRPET, HYDERABAD
        <br />
        <a href="https://www.hemsindia.co.in/hemce2026" target="_blank" rel="noopener noreferrer" style={{ color: currentTheme.accent, textDecoration: "none", marginTop: 4, display: "inline-block" }}>
          WWW.HEMSINDIA.CO.IN/HEMCE2026
        </a>
      </div>
      <Analytics />
    </div>
  );
}
