import { useState, useCallback } from "react";
import { askGemini } from "../utils/gemini";
import { T, TECH_FONT, MONO_FONT } from "../utils/theme";

export function AIInsight({ buildPrompt, color = T.accent }) {
  const [phase, setPhase] = useState("idle"); // idle | loading | done | error
  const [text, setText] = useState("");

  const query = useCallback(async () => {
    setPhase("loading");
    setText("");
    try {
      const result = await askGemini(buildPrompt());
      setText(result);
      setPhase("done");
    } catch (e) {
      setText(e.message);
      setPhase("error");
    }
  }, [buildPrompt]);

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={query}
        disabled={phase === "loading"}
        style={{
          width: "100%",
          padding: "11px 0",
          borderRadius: 12,
          border: `1px solid ${color}40`,
          background: phase === "loading"
            ? `${color}10`
            : `linear-gradient(135deg, ${color}18, ${color}08)`,
          color: phase === "loading" ? T.gray : color,
          fontFamily: TECH_FONT,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 2,
          cursor: phase === "loading" ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.2s",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          boxShadow: phase === "loading" ? "none" : `0 0 20px ${color}15`,
        }}
        onTouchStart={(e) => { if (phase !== "loading") e.currentTarget.style.transform = "scale(0.98)"; }}
        onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        onMouseDown={(e) => { if (phase !== "loading") e.currentTarget.style.transform = "scale(0.98)"; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {phase === "loading" ? (
          <>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span>
            GEMINI ANALYZING...
          </>
        ) : (
          <>✦ ASK GEMINI AI</>
        )}
      </button>

      {(phase === "done" || phase === "error") && (
        <div
          style={{
            marginTop: 10,
            padding: "14px 16px",
            borderRadius: 12,
            background: phase === "error" ? `${T.red}10` : `${color}08`,
            border: `1px solid ${phase === "error" ? T.red : color}30`,
            borderLeft: `3px solid ${phase === "error" ? T.red : color}`,
            fontSize: 12.5,
            color: phase === "error" ? T.red : T.white,
            lineHeight: 1.65,
            fontFamily: "'Outfit', sans-serif",
            position: "relative",
          }}
        >
          <div style={{
            fontSize: 9,
            color,
            fontFamily: TECH_FONT,
            fontWeight: 800,
            letterSpacing: 2,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span>✦</span>
            {phase === "error" ? "ERROR" : "GEMINI AI INSIGHT"}
          </div>
          {text}
          {phase === "done" && (
            <div style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: `1px solid ${color}15`,
              fontSize: 9,
              color: T.dimText,
              fontFamily: MONO_FONT,
              display: "flex",
              justifyContent: "space-between",
            }}>
              <span>gemini-2.0-flash</span>
              <button
                onClick={query}
                style={{
                  background: "none",
                  border: "none",
                  color,
                  fontFamily: TECH_FONT,
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: 1,
                  padding: 0,
                  touchAction: "manipulation",
                }}
              >
                ↺ REFRESH
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
