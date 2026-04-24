import React from "react";
import { T, FONT, TECH_FONT, MONO_FONT, haptics } from "../utils";

export const Pill = ({ active, onClick, children, color = T.accent, label }) => (
  <button
    onClick={(e) => { haptics.light(); onClick && onClick(e); }}
    aria-label={label ?? (typeof children === "string" ? children : undefined)}
    aria-pressed={active}
    style={{
      padding: "7px 13px",
      borderRadius: 24,
      border: active ? `2px solid ${color}` : `1px solid ${T.glassBorder}`,
      background: active ? `${color}20` : T.glass,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      color: active ? color : T.gray,
      fontFamily: TECH_FONT,
      fontSize: 10,
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
      whiteSpace: "nowrap",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      boxShadow: active ? `0 0 15px ${color}30` : "none",
      touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent",
      minHeight: 36,
    }}
    onTouchStart={(e) => { e.currentTarget.style.opacity = "0.7"; }}
    onTouchEnd={(e) => { e.currentTarget.style.opacity = "1"; }}
  >
    {children}
  </button>
);

export const Slider = ({ label, value, onChange, min, max, step = 1, unit = "", color = T.accent }) => {
  const id = `slider-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <label htmlFor={id} style={{ color: T.gray, fontSize: 11, fontWeight: 500 }}>{label}</label>
      <span style={{ color, fontSize: 13, fontWeight: 800, fontFamily: MONO_FONT }} aria-live="polite">
        {typeof value === "number" ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
        <span style={{ fontSize: 10, opacity: 0.8, marginLeft: 2 }}>{unit}</span>
      </span>
    </div>
    <div style={{ position: "relative", height: 8, display: "flex", alignItems: "center" }}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={`${label}: ${value}${unit}`}
        onChange={(e) => { haptics.light(); onChange(Number(e.target.value)); }}
        style={{
          width: "100%",
          accentColor: color,
          height: 6,
          cursor: "pointer",
          background: "rgba(255,255,255,0.05)",
          borderRadius: 3,
          touchAction: "pan-x",
        }}
      />
    </div>
  </div>
  );
};

export const DataBox = ({ label, value, unit, color = T.accent }) => (
  <div
    style={{
      background: `linear-gradient(135deg, ${color}15, ${color}05)`,
      border: `1px solid ${color}30`,
      borderRadius: 12,
      padding: "10px 12px",
      textAlign: "center",
      minWidth: 78,
      flex: "1 1 78px",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      transition: "transform 0.2s",
    }}
  >
    <div style={{ fontSize: 19, fontWeight: 900, color, fontFamily: MONO_FONT, letterSpacing: "-0.5px" }}>{value}</div>
    <div style={{ fontSize: 9, color: T.gray, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>
      {label}
      {unit && <span style={{ opacity: 0.6, marginLeft: 2 }}>[{unit}]</span>}
    </div>
  </div>
);

export const InfoBox = ({ color = T.accent, children }) => (
  <div
    style={{
      marginTop: 15,
      padding: "12px 16px",
      background: T.glass,
      borderRadius: 12,
      borderLeft: `3px solid ${color}`,
      borderTop: `1px solid ${T.glassBorder}`,
      borderRight: `1px solid ${T.glassBorder}`,
      borderBottom: `1px solid ${T.glassBorder}`,
      fontSize: 12,
      color: T.gray,
      lineHeight: 1.65,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    }}
  >
    {children}
  </div>
);

export const PillRow = ({ children }) => (
  <div style={{
    display: "flex",
    gap: 8,
    margin: "12px 0",
    flexWrap: "wrap",
    overflowX: "auto",
    paddingBottom: 4,
    scrollbarWidth: "none",
  }}>{children}</div>
);

export const DataRow = ({ children }) => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>{children}</div>
);

export const ActionBtn = ({ onClick, disabled, color, children, label }) => (
  <button
    onClick={(e) => { haptics.heavy(); onClick && onClick(e); }}
    disabled={disabled}
    aria-label={label ?? (typeof children === "string" ? children : undefined)}
    aria-disabled={disabled}
    style={{
      flex: 1,
      padding: "13px 0",
      borderRadius: 12,
      border: "none",
      background: disabled ? T.dimText : `linear-gradient(135deg, ${color}, ${T.pink})`,
      color: T.white,
      fontFamily: TECH_FONT,
      fontSize: 13,
      fontWeight: 800,
      cursor: disabled ? "not-allowed" : "pointer",
      letterSpacing: 2,
      textTransform: "uppercase",
      boxShadow: disabled ? "none" : `0 4px 15px ${color}40`,
      transition: "all 0.15s",
      touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent",
      minHeight: 48,
    }}
    onTouchStart={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
    onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
  >
    {children}
  </button>
);

export const ResetBtn = ({ onClick }) => (
  <button
    onClick={(e) => { haptics.medium(); onClick && onClick(e); }}
    aria-label="Reset simulation"
    style={{
      padding: "13px 16px",
      borderRadius: 12,
      border: `1px solid ${T.glassBorder}`,
      background: T.glass,
      color: T.gray,
      cursor: "pointer",
      fontSize: 11,
      fontFamily: TECH_FONT,
      fontWeight: 600,
      letterSpacing: 1,
      transition: "all 0.15s",
      touchAction: "manipulation",
      WebkitTapHighlightColor: "transparent",
      minHeight: 48,
    }}
    onTouchStart={(e) => { e.currentTarget.style.opacity = "0.6"; }}
    onTouchEnd={(e) => { e.currentTarget.style.opacity = "1"; }}
    onMouseDown={(e) => { e.currentTarget.style.opacity = "0.7"; }}
    onMouseUp={(e) => { e.currentTarget.style.opacity = "1"; }}
    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
  >
    RESET
  </button>
);

export const SimCanvas = ({ canvasRef, width, height, maxWidth, label = "Simulation visualization" }) => (
  <div
    role="img"
    aria-label={label}
    style={{
    position: "relative",
    margin: "0 auto 14px",
    width: "100%",
    maxWidth: maxWidth ?? width,
  }}>
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "auto",
        background: "radial-gradient(circle at center, #0D1B2A, #050B14)",
        borderRadius: 12,
        border: `1px solid ${T.glassBorder}`,
        display: "block",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3)",
        touchAction: "none",
      }}
    />
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: "none",
      borderRadius: 12,
      boxShadow: `inset 0 0 20px ${T.accent}10`,
      border: `1px solid ${T.accent}15`,
      animation: "radarPulse 4s infinite ease-in-out",
    }} />
  </div>
);
