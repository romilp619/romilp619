import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop } from "./parts/Backdrop";
import { TypeLine } from "./parts/TypeLine";
import { MONO } from "./fonts";
import { Logo, STACK_ROWS, TILE_BG } from "./logos";
import { theme } from "./theme";

export const STACK_W = 1000;
export const STACK_H = 520;

/** One fixed grid for every row, so columns line up exactly across categories. */
const LABEL_W = 136;
const TILE_W = 102;
const TILE_H = 88;
const GAP = 10;
const ROW_GAP = 14;
const COLS = 7;
const GRID_W = LABEL_W + GAP + COLS * TILE_W + (COLS - 1) * GAP;
const GRID_X = (STACK_W - GRID_W) / 2;
const GRID_Y = 88;

const MARK = 34;
const IDLE_BORDER = "#30363d";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const appearAt = (r: number, c: number) => 22 + r * 14 + c * 3;

/** Scan pass across the columns after everything has landed. */
const SWEEP_START = 112;
const SWEEP_END = 158;

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [x, y] = [ch(pa), ch(pb)];
  const m = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `#${m.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

const Mark: React.FC<{ logo: Logo; lit: number }> = ({ logo, lit }) => {
  if (logo.kind === "file") {
    return (
      <Img
        src={logo.src}
        style={{
          maxWidth: 48,
          height: logo.size ?? MARK,
          objectFit: "contain",
          filter: `grayscale(${1 - lit}) brightness(${0.55 + 0.45 * lit})`,
        }}
      />
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={MARK} height={MARK} aria-hidden>
      <path d={logo.path} fill={mixHex(theme.faint, logo.color, lit)} />
    </svg>
  );
};

const accentOf = (logo: Logo) => (logo.kind === "path" ? logo.color : logo.accent);

const Tile: React.FC<{ logo: Logo; r: number; c: number }> = ({ logo, r, c }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = appearAt(r, c);
  const s = spring({ frame: f - at, fps, config: { damping: 200, mass: 0.55 } });
  const lit = interpolate(f, [at + 3, at + 13], [0, 1], clamp);
  const flash = interpolate(f, [at + 6, at + 26], [1, 0], clamp) * (f >= at + 6 ? 1 : 0);

  const colCenter = (c + 0.5) / COLS;
  const sweepPos = interpolate(f, [SWEEP_START, SWEEP_END], [-0.15, 1.15], clamp);
  const sweep = Math.max(0, 1 - Math.abs(sweepPos - colCenter) / 0.11);

  const highlight = Math.max(flash, sweep * 0.85);
  const accent = accentOf(logo);
  const border = mixHex(IDLE_BORDER, accent, highlight * 0.9);

  return (
    <div
      style={{
        width: TILE_W,
        height: TILE_H,
        borderRadius: 8,
        background: TILE_BG,
        // Inset shadow, not border: Chromium draws translucent borders with diagonal seams.
        boxShadow: `inset 0 0 0 1px ${border}, 0 0 ${16 * highlight}px ${accent}${Math.round(highlight * 70)
          .toString(16)
          .padStart(2, "0")}`,
        opacity: s,
        transform: `translateY(${(1 - s) * 8 - sweep * 2}px) scale(${0.92 + 0.08 * s})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      <div style={{ height: MARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Mark logo={logo} lit={lit} />
      </div>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.2,
          color: mixHex(theme.faint, "#c9d1d9", lit),
          whiteSpace: "nowrap",
        }}
      >
        {logo.name}
      </div>
    </div>
  );
};

const RowLabel: React.FC<{ index: number; label: string; count: number }> = ({ index, label, count }) => {
  const f = useCurrentFrame();
  const at = appearAt(index, 0) - 6;
  const o = interpolate(f, [at, at + 10], [0, 1], clamp);
  return (
    <div
      style={{
        width: LABEL_W,
        height: TILE_H,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 7,
        opacity: o,
        transform: `translateX(${(1 - o) * -10}px)`,
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase" }}>
        <span style={{ color: theme.accent }}>{String(index + 1).padStart(2, "0")}</span>
        <span style={{ color: theme.faint }}> / </span>
        <span style={{ color: theme.text }}>{label}</span>
      </div>
      <div style={{ fontSize: 11, letterSpacing: 1.2, color: theme.faint, textTransform: "uppercase" }}>
        {count} tools
      </div>
    </div>
  );
};

export const Stack: React.FC = () => {
  const f = useCurrentFrame();
  const fade =
    interpolate(f, [0, 9], [0, 1], { extrapolateRight: "clamp" }) *
    interpolate(f, [181, 192], [1, 0], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: theme.bgDeep }}>
      <AbsoluteFill style={{ opacity: fade, fontFamily: MONO }}>
        <Backdrop />
        <div style={{ position: "absolute", left: GRID_X, top: 34 }}>
          <TypeLine prompt="romil@github:~$" command=" ls --color ~/stack" startAt={4} charsPerFrame={1.3} fontSize={15} />
        </div>
        <div
          style={{
            position: "absolute",
            left: GRID_X,
            top: GRID_Y,
            display: "flex",
            flexDirection: "column",
            gap: ROW_GAP,
          }}
        >
          {STACK_ROWS.map((row, r) => (
            <div key={row.label} style={{ display: "flex", gap: GAP, alignItems: "center" }}>
              <RowLabel index={r} label={row.label} count={row.items.length} />
              {row.items.map((logo, c) => (
                <Tile key={logo.name} logo={logo} r={r} c={c} />
              ))}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
