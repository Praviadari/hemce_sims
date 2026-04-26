import { useState, useEffect } from "react";
import { T, TECH_FONT, FONT } from "../utils";
import { HEMCE_SCHEDULE, EVENT_COLORS } from "../data/hemceSchedule";

export default function SchedulePanel({ onOpenSim }) {
  const [activeDay, setActiveDay] = useState(1);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const today = now.toISOString().split("T")[0];
    const match = HEMCE_SCHEDULE.find((d) => d.date === today);
    if (match) setActiveDay(match.day);
  }, [now]);

  const dayData = HEMCE_SCHEDULE.find((d) => d.day === activeDay);

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const isConferenceDay = dayData?.date === now.toISOString().split("T")[0];

  return (
    <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
      <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: `1px solid ${T.glassBorder}` }}>
        {HEMCE_SCHEDULE.map((d) => (
          <button
            key={d.day}
            onClick={() => setActiveDay(d.day)}
            style={{
              flex: 1,
              padding: "8px 0",
              border: "none",
              background: "transparent",
              borderBottom: activeDay === d.day ? `2px solid ${T.accent}` : "2px solid transparent",
              color: activeDay === d.day ? T.accent : T.gray,
              fontFamily: TECH_FONT,
              fontSize: 9,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Day {d.day}
            <br />
            <span style={{ fontSize: 8, fontWeight: 400 }}>{d.date.slice(5)}</span>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: T.white, fontFamily: TECH_FONT, marginBottom: 8 }}>
        {dayData?.title}
      </div>

      {dayData?.events.map((ev, i) => {
        const evStart = parseInt(ev.time.split(":")[0]) * 60 + parseInt(ev.time.split(":")[1]);
        const evEnd = parseInt(ev.end.split(":")[0]) * 60 + parseInt(ev.end.split(":")[1]);
        const isCurrent = isConferenceDay && currentTime >= evStart && currentTime < evEnd;
        const isPast = isConferenceDay && currentTime >= evEnd;
        const isNext =
          isConferenceDay &&
          !isCurrent &&
          !isPast &&
          (i === 0 ||
            parseInt(dayData.events[i - 1].end.split(":")[0]) * 60 +
              parseInt(dayData.events[i - 1].end.split(":")[1]) <=
              currentTime);

        return (
          <div
            key={i}
            style={{
              padding: "8px 10px",
              marginBottom: 4,
              borderRadius: 8,
              border: isCurrent ? `2px solid ${T.accent}` : `1px solid ${T.glassBorder}`,
              background: isCurrent ? `${T.accent}15` : isPast ? `${T.glass}80` : T.glass,
              opacity: isPast ? 0.5 : 1,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontFamily: TECH_FONT, fontWeight: 700, color: T.accent }}>
                {ev.time} - {ev.end}
              </span>
              <span
                style={{
                  fontSize: 7,
                  fontFamily: TECH_FONT,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 8,
                  background: `${EVENT_COLORS[ev.type]}30`,
                  color: EVENT_COLORS[ev.type],
                  textTransform: "uppercase",
                }}
              >
                {ev.type}
              </span>
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: T.white, fontFamily: FONT }}>{ev.title}</div>

            {ev.speaker && <div style={{ fontSize: 9, color: T.dimText, marginTop: 2 }}>{ev.speaker}</div>}

            {ev.halls && <div style={{ fontSize: 8, color: T.dimText, marginTop: 2 }}>{ev.halls}</div>}

            {isCurrent && (
              <div style={{ fontSize: 8, fontWeight: 700, color: T.green, marginTop: 4, fontFamily: TECH_FONT }}>
                ▶ HAPPENING NOW
              </div>
            )}
            {isNext && (
              <div style={{ fontSize: 8, fontWeight: 700, color: T.gold, marginTop: 4, fontFamily: TECH_FONT }}>
                ⏭ UP NEXT
              </div>
            )}

            {ev.simId && (
              <button
                onClick={() => onOpenSim(ev.simId)}
                style={{
                  marginTop: 4,
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: `1px solid ${T.accent}30`,
                  background: `${T.accent}10`,
                  color: T.accent,
                  fontSize: 9,
                  fontFamily: TECH_FONT,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {ev.simLabel || `Open ${ev.simId} sim →`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
