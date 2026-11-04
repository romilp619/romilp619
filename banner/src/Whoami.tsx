import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "./parts/Backdrop";
import { TypeLine } from "./parts/TypeLine";
import { MONO } from "./fonts";
import { theme } from "./theme";

export const WHOAMI_W = 1000;
export const WHOAMI_H = 420;

const PAD = 44;
const ROW_TOP = 92;
const ROW_H = 32;
const KEY_W = 96;
const DIVIDER_X = 626;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Platform names render in their own brand colour, as on the site's nav badges. */
const BRAND: Record<string, string> = {
  HackerOne: "#f0f6fc",
  Bugcrowd: "#F26822",
  "Hack The Box": "#9FEF00",
  TryHackMe: "#e8443a",
  PentesterLab: "#c7ff41",
  "Kernel Kittens": "#5b82f7",
};

type Part = string | { t: string; c: string };
const SEP: Part = { t: " · ", c: theme.accent };
const b = (name: string): Part => ({ t: name, c: BRAND[name] });

const ROWS: { key: string; value: Part[] }[] = [
  { key: "name", value: ["Romil Patel"] },
  { key: "role", value: ["Security Researcher", SEP, "Bug Bounty Hunter"] },
  { key: "hunting", value: [b("HackerOne"), SEP, b("Bugcrowd")] },
  { key: "training", value: [b("Hack The Box"), SEP, b("TryHackMe"), SEP, b("PentesterLab")] },
  { key: "team", value: [b("Kernel Kittens"), SEP, "CTF"] },
  { key: "focus", value: ["web", SEP, "cloud", SEP, "smart contracts"] },
  { key: "building", value: ["agentic security tooling", SEP, "recon automation"] },
  { key: "status", value: [{ t: "open to collaboration", c: theme.accent }] },
];

const rowAt = (k: number) => 28 + k * 8;
const CHARS_PER_FRAME = 3.2;

/** Types a row's value, keeping each segment's colour. */
const TypedValue: React.FC<{ parts: Part[]; start: number }> = ({ parts, start }) => {
  const f = useCurrentFrame();
  let budget = Math.max(0, Math.floor((f - start) * CHARS_PER_FRAME));
  return (
    <span style={{ whiteSpace: "pre" }}>
      {parts.map((p, i) => {
        const text = typeof p === "string" ? p : p.t;
        const color = typeof p === "string" ? theme.text : p.c;
        const shown = text.slice(0, budget);
        budget = Math.max(0, budget - text.length);
        return (
          <span key={i} style={{ color }}>
            {shown}
          </span>
        );
      })}
    </span>
  );
};

const Row: React.FC<{ k: number }> = ({ k }) => {
  const f = useCurrentFrame();
  const at = rowAt(k);
  const o = interpolate(f, [at, at + 5], [0, 1], clamp);
  const row = ROWS[k];
  const isStatus = row.key === "status";
  const pulse = 0.55 + 0.45 * Math.sin(f / 5);
  return (
    <div
      style={{
        position: "absolute",
        left: PAD,
        top: ROW_TOP + k * ROW_H,
        height: ROW_H,
        display: "flex",
        alignItems: "center",
        fontSize: 15.5,
        opacity: o,
      }}
    >
      <span style={{ width: KEY_W, color: theme.faint }}>{row.key}</span>
      {isStatus ? (
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 9,
            background: theme.accent,
            marginRight: 10,
            opacity: f >= at + 2 ? pulse : 0,
            boxShadow: `0 0 ${8 * pulse}px rgba(57,211,83,.7)`,
          }}
        />
      ) : null}
      <TypedValue parts={row.value} start={at + 2} />
    </div>
  );
};

/** Proof points, copied from the proof strip on romilp619.github.io. */
const STATS: { value: number; suffix: string; label: string; format?: (n: number) => string }[] = [
  { value: 20, suffix: "+", label: "professional credentials" },
  { value: 274, suffix: "", label: "PortSwigger lab patterns mapped" },
  { value: 80, suffix: "+", label: "secret and exposure patterns" },
  {
    value: 6722,
    suffix: "",
    label: "cybersecurity community",
    format: (n) => (n < 1000 ? String(n) : `${(n / 1000).toFixed(1)}K`),
  },
];

const Stat: React.FC<{ k: number }> = ({ k }) => {
  const f = useCurrentFrame();
  const s = STATS[k];
  const at = 36 + k * 10;
  const t = interpolate(f, [at, at + 32], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const o = interpolate(f, [at - 4, at + 4], [0, 1], clamp);
  const n = Math.round(s.value * t);
  const shown = s.format ? s.format(n) : String(n);
  const done = t >= 1;
  return (
    <div
      style={{
        position: "absolute",
        left: DIVIDER_X + 32,
        top: 84 + k * 74,
        opacity: o,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 34,
          fontWeight: 700,
          color: theme.text,
          letterSpacing: -0.5,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {shown}
        <span style={{ color: theme.accent, opacity: done ? 1 : 0 }}>{s.suffix}</span>
      </div>
      <div style={{ fontSize: 11.5, color: theme.dim, letterSpacing: 1.2, textTransform: "uppercase" }}>
        {s.label}
      </div>
    </div>
  );
};

export const Whoami: React.FC = () => {
  const f = useCurrentFrame();
  const fade =
    interpolate(f, [0, 9], [0, 1], { extrapolateRight: "clamp" }) *
    interpolate(f, [181, 192], [1, 0], { extrapolateLeft: "clamp" });
  const lastRow = rowAt(ROWS.length - 1);
  const dividerH = interpolate(f, [10, 40], [0, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 3) });
  const headerO = interpolate(f, [24, 36], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: theme.bgDeep }}>
      <AbsoluteFill style={{ opacity: fade, fontFamily: MONO }}>
        <Backdrop />

        <div style={{ position: "absolute", left: PAD, top: 40 }}>
          <TypeLine
            prompt="romil@github:~$"
            command=" whoami --verbose"
            startAt={6}
            charsPerFrame={1.1}
            fontSize={15.5}
            hideCursorAfter={lastRow + 14}
          />
        </div>

        {ROWS.map((_, k) => (
          <Row key={k} k={k} />
        ))}

        <div style={{ position: "absolute", left: PAD, top: ROW_TOP + ROWS.length * ROW_H + 6 }}>
          <TypeLine prompt="romil@github:~$" command="" startAt={lastRow + 14} fontSize={15.5} />
        </div>

        <div
          style={{
            position: "absolute",
            left: DIVIDER_X,
            top: 44,
            width: 1,
            height: (WHOAMI_H - 88) * dividerH,
            background: "#30363d",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: DIVIDER_X + 32,
            top: 46,
            fontSize: 11,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: theme.faint,
            opacity: headerO,
          }}
        >
          proof points
        </div>

        {STATS.map((_, k) => (
          <Stat key={k} k={k} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
