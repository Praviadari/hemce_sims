import { useState } from "react";
import { T, TECH_FONT, MONO_FONT, FONT } from "../utils";
import { MISSILE_DB, MISSILE_CATEGORIES, ECOSYSTEM, MILESTONES_TIMELINE } from "../data/missileDB";

// ─── helpers ──────────────────────────────────────────────────────────────────

function statusColor(status = "") {
  const s = status.toLowerCase();
  if (s.includes("inducted") || s.includes("in service")) return T.green;
  if (s.includes("trials") || s.includes("testing")) return T.orange;
  return T.cyan;
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: TECH_FONT,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 2,
        color: T.dimText,
        textTransform: "uppercase",
        marginTop: 10,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function KV({ label, value, mono }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "flex-start" }}>
      <span
        style={{
          fontFamily: TECH_FONT,
          fontSize: 9,
          color: T.dimText,
          minWidth: 72,
          flexShrink: 0,
          paddingTop: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? MONO_FONT : FONT,
          fontSize: 10,
          color: T.gray,
          lineHeight: 1.4,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── MissileCard ──────────────────────────────────────────────────────────────

function MissileCard({ missile, onOpenSim }) {
  const [expanded, setExpanded] = useState(false);
  const sc = statusColor(missile.status);

  const cardStyle = {
    background: T.glass,
    border: `1px solid ${expanded ? T.accent + "30" : T.glassBorder}`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    cursor: "pointer",
    transition: "border-color 0.2s",
  };

  return (
    <div style={cardStyle} onClick={() => setExpanded((v) => !v)}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{missile.image_emoji}</span>
          <div>
            <div
              style={{
                fontFamily: TECH_FONT,
                fontSize: 13,
                fontWeight: 900,
                color: T.white,
                lineHeight: 1.2,
              }}
            >
              {missile.name}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 10, color: T.dimText, marginTop: 1 }}>
              {missile.type}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: TECH_FONT,
              fontSize: 8,
              fontWeight: 700,
              color: sc,
              background: `${sc}15`,
              border: `1px solid ${sc}30`,
              borderRadius: 20,
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}
          >
            {missile.status?.split(",")[0]}
          </span>
          <span style={{ fontFamily: TECH_FONT, fontSize: 10, color: T.dimText }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* ── Collapsed summary row ── */}
      {!expanded && (
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 8,
            flexWrap: "wrap",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {missile.performance?.range && (
            <span style={{ fontFamily: MONO_FONT, fontSize: 10, color: T.accent }}>
              📏 {missile.performance.range}
            </span>
          )}
          {missile.performance?.speed && (
            <span style={{ fontFamily: MONO_FONT, fontSize: 10, color: T.orange }}>
              ⚡ {missile.performance.speed}
            </span>
          )}
          {missile.propulsion?.stages && (
            <span style={{ fontFamily: MONO_FONT, fontSize: 10, color: T.dimText }}>
              🔩 {missile.propulsion.stages}
            </span>
          )}
        </div>
      )}

      {/* ── Expanded body ── */}
      {expanded && (
        <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 10 }}>
          {/* Propulsion */}
          {missile.propulsion && (
            <>
              <SectionLabel>⚙ Propulsion</SectionLabel>
              <KV label="Stages" value={missile.propulsion.stages} />
              <KV label="Propellant" value={missile.propulsion.propellant} />
              <KV label="Thrust" value={missile.propulsion.thrust} mono />
              <KV label="Isp" value={missile.propulsion.isp} mono />
              {missile.propulsion.motorNotes && (
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 10,
                    color: T.dimText,
                    lineHeight: 1.5,
                    background: `${T.accent}08`,
                    borderRadius: 6,
                    padding: "5px 7px",
                    marginTop: 4,
                    borderLeft: `2px solid ${T.accent}40`,
                  }}
                >
                  {missile.propulsion.motorNotes}
                </div>
              )}
            </>
          )}

          {/* Performance */}
          {missile.performance && (
            <>
              <SectionLabel>📊 Performance</SectionLabel>
              <KV label="Range" value={missile.performance.range} mono />
              <KV label="Speed" value={missile.performance.speed} mono />
              <KV label="Payload" value={missile.performance.payload} />
              <KV label="Accuracy" value={missile.performance.accuracy} />
              <KV label="Guidance" value={missile.performance.guidance} />
            </>
          )}

          {/* Special features */}
          {missile.specialFeatures?.length > 0 && (
            <>
              <SectionLabel>★ Special Features</SectionLabel>
              <ul style={{ margin: 0, paddingLeft: 16, listStyle: "none" }}>
                {missile.specialFeatures.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      fontFamily: FONT,
                      fontSize: 10,
                      color: T.gray,
                      marginBottom: 3,
                      lineHeight: 1.4,
                      paddingLeft: 0,
                    }}
                  >
                    <span style={{ color: T.accent, marginRight: 5 }}>▸</span>
                    {f}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Milestones */}
          {missile.milestones?.length > 0 && (
            <>
              <SectionLabel>📅 Milestones</SectionLabel>
              <div style={{ position: "relative", paddingLeft: 12 }}>
                <div
                  style={{
                    position: "absolute",
                    left: 4,
                    top: 2,
                    bottom: 2,
                    width: 1,
                    background: `${T.accent}30`,
                  }}
                />
                {missile.milestones.map((m, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: T.accent,
                        marginTop: 4,
                        flexShrink: 0,
                        boxShadow: `0 0 4px ${T.accent}80`,
                      }}
                    />
                    <div>
                      <span
                        style={{
                          fontFamily: MONO_FONT,
                          fontSize: 9,
                          color: T.accent,
                          fontWeight: 700,
                          marginRight: 6,
                        }}
                      >
                        {m.year}
                      </span>
                      <span style={{ fontFamily: FONT, fontSize: 10, color: T.gray }}>
                        {m.event}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Developer */}
          {missile.developer && (
            <div style={{ marginTop: 8 }}>
              <KV label="Developer" value={missile.developer} />
            </div>
          )}

          {/* Action row */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => onOpenSim?.(missile.relatedSimId)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: `1px solid ${T.accent}40`,
                background: `${T.accent}15`,
                color: T.accent,
                fontFamily: TECH_FONT,
                fontSize: 10,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 1,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              🔗 TRY SIMULATION
            </button>
          </div>

          {/* Sources */}
          {missile.sources?.length > 0 && (
            <>
              <SectionLabel>📎 Sources</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {missile.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: T.accent,
                      fontSize: 10,
                      textDecoration: "underline",
                      fontFamily: FONT,
                      lineHeight: 1.4,
                      wordBreak: "break-all",
                    }}
                  >
                    📎 {src.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── EcosystemSection ─────────────────────────────────────────────────────────

function EcosystemSection() {
  const [open, setOpen] = useState(false);

  const roleColors = {
    Research: T.cyan,
    Design: T.accent,
    Strategic: T.orange,
    Turbofan: T.gold,
    Private: T.green,
  };

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: T.glass,
          border: `1px solid ${T.glassBorder}`,
          borderRadius: 10,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{ fontFamily: TECH_FONT, fontSize: 12, fontWeight: 800, color: T.white }}>
          🏭 Manufacturing Ecosystem
        </span>
        <span style={{ fontFamily: TECH_FONT, fontSize: 10, color: T.dimText }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            background: T.glass,
            border: `1px solid ${T.glassBorder}`,
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            padding: "10px 14px",
          }}
        >
          {ECOSYSTEM.map((e, i) => {
            const c = roleColors[e.role] ?? T.cyan;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 10,
                  alignItems: "flex-start",
                  paddingBottom: 10,
                  borderBottom: i < ECOSYSTEM.length - 1 ? `1px solid ${T.glassBorder}` : "none",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: TECH_FONT,
                        fontSize: 11,
                        fontWeight: 800,
                        color: T.white,
                      }}
                    >
                      {e.name}
                    </span>
                    <span
                      style={{
                        fontFamily: TECH_FONT,
                        fontSize: 8,
                        fontWeight: 700,
                        color: c,
                        background: `${c}18`,
                        border: `1px solid ${c}30`,
                        borderRadius: 20,
                        padding: "1px 7px",
                      }}
                    >
                      {e.role}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: 10,
                      color: T.dimText,
                      marginTop: 2,
                      lineHeight: 1.4,
                    }}
                  >
                    {e.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TimelineSection ──────────────────────────────────────────────────────────

function TimelineSection() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: T.glass,
          border: `1px solid ${T.glassBorder}`,
          borderRadius: 10,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{ fontFamily: TECH_FONT, fontSize: 12, fontWeight: 800, color: T.white }}>
          📅 Key Milestones (1983–2026)
        </span>
        <span style={{ fontFamily: TECH_FONT, fontSize: 10, color: T.dimText }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            background: T.glass,
            border: `1px solid ${T.glassBorder}`,
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            padding: "14px 14px 10px",
          }}
        >
          <div style={{ position: "relative", paddingLeft: 28 }}>
            {/* Vertical spine */}
            <div
              style={{
                position: "absolute",
                left: 10,
                top: 4,
                bottom: 4,
                width: 2,
                background: `linear-gradient(to bottom, ${T.accent}80, ${T.pink}40)`,
                borderRadius: 2,
              }}
            />

            {MILESTONES_TIMELINE.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                {/* Dot */}
                <div
                  style={{
                    position: "absolute",
                    left: 6,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: T.accent,
                    border: `2px solid ${T.bg ?? "#040B16"}`,
                    marginTop: 2,
                    boxShadow: `0 0 6px ${T.accent}80`,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <span
                    style={{
                      fontFamily: MONO_FONT,
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.accent,
                      display: "block",
                      marginBottom: 2,
                    }}
                  >
                    {m.year}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT,
                      fontSize: 11,
                      color: T.gray,
                      lineHeight: 1.4,
                    }}
                  >
                    {m.event}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MissilePanel (main export) ───────────────────────────────────────────────

export default function MissilePanel({ onOpenSim }) {
  const [catFilter, setCatFilter] = useState("all");

  const filtered =
    catFilter === "all" ? MISSILE_DB : MISSILE_DB.filter((m) => m.category === catFilter);

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header */}
      <div
        style={{
          fontFamily: TECH_FONT,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 2,
          color: T.accent,
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        🛡 Indian Missile Systems — IGMDP &amp; Beyond
      </div>

      {/* Category pills */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 6,
          marginBottom: 12,
          flexWrap: "nowrap",
        }}
      >
        {MISSILE_CATEGORIES.map((c) => {
          const active = catFilter === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setCatFilter(c.id)}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                border: active ? `1px solid ${T.accent}` : `1px solid ${T.glassBorder}`,
                background: active ? `${T.accent}20` : T.glass,
                color: active ? T.accent : T.dimText,
                fontFamily: TECH_FONT,
                fontSize: 9,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                letterSpacing: 0.5,
                transition: "all 0.15s",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Count badge */}
      <div
        style={{
          fontFamily: MONO_FONT,
          fontSize: 9,
          color: T.dimText,
          marginBottom: 8,
        }}
      >
        {filtered.length} system{filtered.length !== 1 ? "s" : ""}
        {catFilter !== "all" ? ` · ${catFilter}` : ""}
      </div>

      {/* Scrollable missile card list */}
      <div
        style={{
          maxHeight: "70vh",
          overflowY: "auto",
          paddingRight: 2,
        }}
        className="no-scrollbar"
      >
        {filtered.map((missile) => (
          <MissileCard key={missile.id} missile={missile} onOpenSim={onOpenSim} />
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "32px 16px",
              color: T.dimText,
              fontFamily: FONT,
              fontSize: 11,
            }}
          >
            No systems in this category yet.
          </div>
        )}

        <EcosystemSection />
        <TimelineSection />

        {/* Footer note */}
        <div
          style={{
            marginTop: 16,
            padding: "10px 12px",
            borderRadius: 8,
            background: `${T.accent}08`,
            border: `1px solid ${T.accent}15`,
            fontFamily: FONT,
            fontSize: 9,
            color: T.dimText,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: T.accent }}>Data sources:</strong> PIB press releases, DRDO official
          announcements, Wikipedia (verified), The Diplomat, Naval News. Click 📎 links for primary
          source verification. Data current as of April 2026.
        </div>
      </div>
    </div>
  );
}
