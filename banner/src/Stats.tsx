import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "./parts/Backdrop";
import { TypeLine } from "./parts/TypeLine";
import { MONO } from "./fonts";
import { theme } from "./theme";
import type { StatsData } from "./statsTypes";

export const STATS_W = 1000;
export const STATS_H = 668;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const ramp = (f: number, a: number, b: number) => easeOut(interpolate(f, [a, b], [0, 1], clamp));

const PANEL_BORDER = "#30363d";
const TRACK = "#21262d";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00Z");
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const Panel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  at: number;
  children: React.ReactNode;
}> = ({ x, y, w, h, label, at, children }) => {
  const f = useCurrentFrame();
  const o = ramp(f, at, at + 12);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 10,
        background: "rgba(22,27,34,.62)",
        // Inset shadow, not border: Chromium draws translucent borders with diagonal seams.
        boxShadow: `inset 0 0 0 1px ${PANEL_BORDER}`,
        opacity: o,
        transform: `translateY(${(1 - o) * 10}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 18,
          fontSize: 11,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: theme.faint,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
};

/* ---------- Contributions wave ---------- */

const CHART_W = 560;
const CHART_H = 118;
const DRAW_START = 24;
const DRAW_END = 82;
const PULSE_PERIOD = 48;

/** Catmull-Rom through the weekly totals, sampled densely so the reveal and pulse can walk it. */
const sampleCurve = (values: number[], max: number) => {
  const pts = values.map((v, i) => ({
    x: (i / Math.max(1, values.length - 1)) * CHART_W,
    y: CHART_H - (v / max) * CHART_H * 0.92,
  }));
  const out: { x: number; y: number }[] = [];
  const STEPS = 12;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < STEPS; s++) {
      const t = s / STEPS;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      // Catmull-Rom can overshoot below zero between low weeks; clamp to the baseline.
      out.push({ x, y: Math.min(CHART_H, Math.max(0, y)) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

const toPath = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("");

const ContributionWave: React.FC<{ data: StatsData }> = ({ data }) => {
  const f = useCurrentFrame();
  const values = data.weekly.map((w) => w.count);
  const max = Math.max(1, ...values);
  const curve = React.useMemo(() => sampleCurve(values, max), [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const p = ramp(f, DRAW_START, DRAW_END);
  const visible = curve.filter((pt) => pt.x <= p * CHART_W + 0.01);
  const head = visible[visible.length - 1] ?? curve[0];
  const line = toPath(visible);
  const area = visible.length > 1 ? `${line}L${head.x.toFixed(1)},${CHART_H}L0,${CHART_H}Z` : "";

  // The travelling pulse: a bright band that rides the drawn line, twice per loop.
  const pulseOn = f >= DRAW_END;
  const q = pulseOn ? ((f - DRAW_END) % PULSE_PERIOD) / PULSE_PERIOD : 0;
  const qIdx = Math.round(easeInOut(q) * (curve.length - 1));
  const band = curve.slice(Math.max(0, qIdx - 22), qIdx + 1);
  const pulseFade = pulseOn ? Math.sin(Math.PI * q) : 0;
  const breathe = pulseOn ? 0.85 + 0.15 * Math.sin((f / PULSE_PERIOD) * Math.PI * 2) : 1;

  const monthTicks: { x: number; label: string }[] = [];
  let lastX = -999;
  data.weekly.forEach((w, i) => {
    const d = new Date(w.start + "T00:00:00Z");
    const prev = i ? new Date(data.weekly[i - 1].start + "T00:00:00Z") : null;
    if (prev && prev.getUTCMonth() !== d.getUTCMonth()) {
      const x = (i / Math.max(1, data.weekly.length - 1)) * CHART_W;
      if (x - lastX > 38 && x < CHART_W - 14) {
        monthTicks.push({ x, label: MONTHS[d.getUTCMonth()] });
        lastX = x;
      }
    }
  });

  const total = Math.round(data.totalContributions * ramp(f, DRAW_START, DRAW_END - 10));

  return (
    <>
      <div style={{ position: "absolute", left: 20, top: 40, display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: theme.text, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {total}
        </span>
        <span style={{ fontSize: 12, color: theme.dim }}>contributions in the last 12 months</span>
      </div>
      <svg style={{ position: "absolute", left: 20, top: 96, overflow: "visible" }} width={CHART_W} height={CHART_H + 24}>
        <defs>
          <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={theme.accent} stopOpacity={0.55 * breathe} />
            <stop offset="0.55" stopColor={theme.accent} stopOpacity={0.16 * breathe} />
            <stop offset="1" stopColor={theme.accent} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="pulseStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#aff5b4" stopOpacity={0} />
            <stop offset="1" stopColor="#aff5b4" stopOpacity={1} />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g) => (
          <line key={g} x1={0} x2={CHART_W} y1={CHART_H - g * CHART_H * 0.92} y2={CHART_H - g * CHART_H * 0.92} stroke={TRACK} strokeDasharray="3 5" />
        ))}
        {[0, 0.5, 1].map((g) => (
          <text key={`t${g}`} x={CHART_W + 8} y={CHART_H - g * CHART_H * 0.92 + 3.5} fontSize={10} fill={theme.faint} fontFamily={MONO}>
            {Math.round(g * max)}
          </text>
        ))}
        {area ? <path d={area} fill="url(#waveFill)" /> : null}
        {visible.length > 1 ? <path d={line} fill="none" stroke={theme.accent} strokeWidth={2.2} strokeLinejoin="round" /> : null}
        {pulseOn && band.length > 1 ? (
          <path d={toPath(band)} fill="none" stroke="url(#pulseStroke)" strokeWidth={3.4} strokeLinecap="round" opacity={pulseFade} />
        ) : null}
        {pulseOn ? (
          <>
            <line x1={curve[qIdx].x} x2={curve[qIdx].x} y1={curve[qIdx].y} y2={CHART_H} stroke="#aff5b4" strokeOpacity={0.22 * pulseFade} />
            <circle cx={curve[qIdx].x} cy={curve[qIdx].y} r={9} fill={theme.accent} opacity={0.18 * pulseFade} />
            <circle cx={curve[qIdx].x} cy={curve[qIdx].y} r={3.6} fill="#e6ffe9" opacity={pulseFade} />
          </>
        ) : p > 0 && p < 1 ? (
          <circle cx={head.x} cy={head.y} r={3.6} fill="#e6ffe9" />
        ) : null}
        {monthTicks.map((m) => (
          <text
            key={m.label + m.x}
            x={m.x}
            y={CHART_H + 18}
            fontSize={10}
            fill={theme.faint}
            fontFamily={MONO}
            textAnchor="middle"
            opacity={ramp(f, DRAW_START + (m.x / CHART_W) * (DRAW_END - DRAW_START), DRAW_START + (m.x / CHART_W) * (DRAW_END - DRAW_START) + 8)}
          >
            {m.label}
          </text>
        ))}
      </svg>
    </>
  );
};

/* ---------- Streak ring ---------- */

const ORBIT_PERIOD = 96; // divides the 192-frame loop, so the comet loops cleanly

const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0.toFixed(2)},${y0.toFixed(2)}A${r},${r} 0 ${large} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
};

const StreakRing: React.FC<{ data: StatsData }> = ({ data }) => {
  const f = useCurrentFrame();
  const cx = 146;
  const cy = 132;
  const r = 66;
  const ratio = data.longestStreak > 0 ? Math.min(1, data.currentStreak / data.longestStreak) : 0;
  const fill = ratio * ramp(f, 34, 80);
  const shown = Math.round(data.currentStreak * ramp(f, 34, 70));

  const orbitIn = ramp(f, 30, 44);
  const a = ((f % ORBIT_PERIOD) / ORBIT_PERIOD) * Math.PI * 2;
  const TAIL = 1.1;
  const tailSegs = 14;

  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={292} height={250}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={TRACK} strokeWidth={9} />
        <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke={TRACK} strokeWidth={1} strokeDasharray="2 6" opacity={0.9} />
        {fill > 0.001 ? (
          <path d={arcPath(cx, cy, r, 0, Math.min(fill, 0.9999) * Math.PI * 2)} fill="none" stroke={theme.accent} strokeWidth={9} strokeLinecap="round" />
        ) : null}
        {Array.from({ length: tailSegs }, (_, k) => {
          const a1 = a - (k / tailSegs) * TAIL;
          const a0 = a - ((k + 1) / tailSegs) * TAIL;
          return (
            <path
              key={k}
              d={arcPath(cx, cy, r + 14, a0, a1)}
              fill="none"
              stroke={theme.accent}
              strokeWidth={2.4}
              strokeLinecap="round"
              opacity={orbitIn * 0.75 * (1 - k / tailSegs)}
            />
          );
        })}
        <circle cx={cx + (r + 14) * Math.sin(a)} cy={cy - (r + 14) * Math.cos(a)} r={4.2} fill="#e6ffe9" opacity={orbitIn} />
        <circle cx={cx + (r + 14) * Math.sin(a)} cy={cy - (r + 14) * Math.cos(a)} r={9} fill={theme.accent} opacity={orbitIn * 0.2} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: cx - 60,
          top: cy - 30,
          width: 120,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, color: theme.text, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{shown}</div>
        <div style={{ fontSize: 10.5, color: theme.dim, letterSpacing: 1.4, textTransform: "uppercase", marginTop: 7 }}>
          day streak
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 292,
          top: 224,
          textAlign: "center",
          fontSize: 11,
          color: theme.dim,
          letterSpacing: 0.6,
          opacity: ramp(f, 60, 72),
        }}
      >
        longest in 12 months <span style={{ color: theme.text }}>{data.longestStreak} days</span>
      </div>
    </>
  );
};

/* ---------- Language donut ---------- */

const DONUT_START = 40;
const DONUT_END = 96;

const LanguageDonut: React.FC<{ data: StatsData }> = ({ data }) => {
  const f = useCurrentFrame();
  const cx = 92;
  const cy = 154;
  const r = 58;
  const GAP = 0.035;
  const drawn = ramp(f, DONUT_START, DONUT_END);
  const spin = f > DONUT_END ? ((f - DONUT_END) * 0.55 * Math.PI) / 180 : 0;

  let acc = 0;
  const segs = data.languages.map((l) => {
    const a0 = acc * Math.PI * 2;
    acc += l.share;
    return { ...l, a0, a1: acc * Math.PI * 2 };
  });
  const top = data.languages[0];

  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={356} height={280}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={TRACK} strokeWidth={16} />
        <g transform={`rotate(${(spin * 180) / Math.PI} ${cx} ${cy})`}>
          {segs.map((s) => {
            const limit = drawn * Math.PI * 2;
            const a1 = Math.min(s.a1 - GAP, limit);
            if (a1 <= s.a0) return null;
            return <path key={s.name} d={arcPath(cx, cy, r, s.a0, a1)} fill="none" stroke={s.color} strokeWidth={16} />;
          })}
        </g>
      </svg>
      {top ? (
        <div style={{ position: "absolute", left: cx - 50, top: cy - 20, width: 100, textAlign: "center", opacity: ramp(f, 70, 84) }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: theme.text, lineHeight: 1 }}>{(top.share * 100).toFixed(0)}%</div>
          <div style={{ fontSize: 10, color: theme.dim, marginTop: 6 }}>{top.name}</div>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 186, top: 72, width: 150, display: "flex", flexDirection: "column", gap: 11 }}>
        {data.languages.map((l, k) => (
          <div
            key={l.name}
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 12,
              opacity: ramp(f, 52 + k * 5, 62 + k * 5),
              transform: `translateX(${(1 - ramp(f, 52 + k * 5, 62 + k * 5)) * 8}px)`,
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 3, background: l.color, marginRight: 9, flexShrink: 0 }} />
            <span style={{ color: theme.text, flex: 1 }}>{l.name}</span>
            <span style={{ color: theme.dim, fontVariantNumeric: "tabular-nums" }}>{(l.share * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </>
  );
};

/* ---------- Activity counters and weekday bars ---------- */

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Activity: React.FC<{ data: StatsData }> = ({ data }) => {
  const f = useCurrentFrame();
  const avg = data.activeDays ? data.totalContributions / data.activeDays : 0;
  const counters: { label: string; value: number; decimals?: number }[] = [
    { label: "commits", value: data.commits },
    { label: "active days", value: data.activeDays },
    { label: "public repos", value: data.publicRepos },
    { label: "best day", value: data.bestDay },
    { label: "best week", value: data.bestWeek },
    { label: "per active day", value: avg, decimals: 1 },
  ];

  const byDay = WEEK_ORDER.map((d) => data.weekday[d] ?? 0);
  const maxDay = Math.max(1, ...byDay);
  const busiest = byDay.indexOf(Math.max(...byDay));
  const BAR_W = 52;
  const BAR_GAP = 18;
  const BAR_H = 56;
  const BAR_TOP = 192;

  return (
    <>
      {counters.map((c, k) => {
        const col = k % 3;
        const row = Math.floor(k / 3);
        const at = 46 + k * 5;
        const t = ramp(f, at, at + 30);
        const v = c.value * t;
        return (
          <div
            key={c.label}
            style={{ position: "absolute", left: 20 + col * 172, top: 44 + row * 62, opacity: ramp(f, at - 4, at + 4) }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: theme.text, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {c.decimals ? v.toFixed(c.decimals) : Math.round(v)}
            </div>
            <div style={{ fontSize: 10.5, color: theme.dim, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 7 }}>{c.label}</div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 170,
          fontSize: 11,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: theme.faint,
          opacity: ramp(f, 66, 76),
        }}
      >
        by weekday
      </div>
      <svg style={{ position: "absolute", left: 20, top: BAR_TOP }} width={7 * BAR_W + 6 * BAR_GAP} height={BAR_H + 24}>
        {byDay.map((v, k) => {
          const grow = ramp(f, 70 + k * 4, 86 + k * 4);
          const h = Math.max(3, (v / maxDay) * BAR_H) * grow;
          // A brightness wave rolls across the bars once they've landed; the heights never move.
          const wave = f > 100 ? 0.5 + 0.5 * Math.sin((f - 100) / 6 - k * 0.9) : 0;
          const isBest = k === busiest;
          const x = k * (BAR_W + BAR_GAP);
          return (
            <g key={k}>
              <rect x={x} y={0} width={BAR_W} height={BAR_H} rx={4} fill={TRACK} opacity={0.55} />
              <rect
                x={x}
                y={BAR_H - h}
                width={BAR_W}
                height={h}
                rx={4}
                fill={isBest ? theme.accent : theme.accentSoft}
                opacity={(isBest ? 0.95 : 0.55) + wave * 0.3 * (isBest ? 0.15 : 1)}
              />
              <text x={x + BAR_W / 2} y={BAR_H + 16} textAnchor="middle" fontSize={10} fill={isBest ? theme.text : theme.faint} fontFamily={MONO}>
                {DAY_LABELS[k]}
              </text>
            </g>
          );
        })}
      </svg>
    </>
  );
};

/* ---------- Composition ---------- */

export const Stats: React.FC<{ data: StatsData }> = ({ data }) => {
  const f = useCurrentFrame();
  const fade =
    interpolate(f, [0, 9], [0, 1], { extrapolateRight: "clamp" }) *
    interpolate(f, [181, 192], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: theme.bgDeep }}>
      <AbsoluteFill style={{ opacity: fade, fontFamily: MONO }}>
        <Backdrop />
        <div style={{ position: "absolute", left: 44, top: 26 }}>
          <TypeLine prompt="romil@github:~$" command=" gh stats --live" startAt={4} charsPerFrame={1.2} fontSize={15} />
        </div>
        <div
          style={{
            position: "absolute",
            right: 44,
            top: 36,
            fontSize: 11,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: theme.faint,
            opacity: ramp(f, 14, 26),
          }}
        >
          updated {fmtDate(data.updated)}
        </div>

        <Panel x={44} y={78} w={600} h={250} label="contributions" at={8}>
          <ContributionWave data={data} />
        </Panel>
        <Panel x={664} y={78} w={292} h={250} label="streak" at={14}>
          <StreakRing data={data} />
        </Panel>
        <Panel x={44} y={348} w={356} h={280} label="languages · by code" at={20}>
          <LanguageDonut data={data} />
        </Panel>
        <Panel x={420} y={348} w={536} h={280} label="activity" at={26}>
          <Activity data={data} />
        </Panel>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
