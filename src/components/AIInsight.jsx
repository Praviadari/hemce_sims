import { useState } from "react";
import { T, TECH_FONT, haptics } from "../utils";

export function AIInsight({ buildPrompt, color = T.accent }) {
  const [copied, setCopied] = useState(false);

  const query = () => {
    haptics.medium();
    const prompt = buildPrompt();
    
    // Fallback or explicit intent to use web app without API key
    if (navigator.clipboard) {
      navigator.clipboard.writeText(prompt).catch(() => {});
    }
    
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    
    window.open("https://gemini.google.com/app", "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={query}
        style={{
          width: "100%",
          padding: "11px 0",
          borderRadius: 12,
          border: `1px solid ${color}40`,
          background: `linear-gradient(135deg, ${color}18, ${color}08)`,
          color: color,
          fontFamily: TECH_FONT,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 2,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "all 0.2s",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          boxShadow: `0 0 20px ${color}15`,
        }}
        onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
        onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {copied ? "✦ PROMPT COPIED! OPENING..." : "✦ ASK GEMINI AI"}
      </button>
      
      {copied && (
        <div style={{
          marginTop: 8,
          fontSize: 10,
          color: T.dimText,
          textAlign: "center"
        }}>
          Copied to clipboard. Paste it directly into Gemini.
        </div>
      )}
    </div>
  );
}
