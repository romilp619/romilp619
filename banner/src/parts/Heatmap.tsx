import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { theme, DURATION } from "../theme";

const COLS = 19;
const ROWS = 7;
const CELL = 11;
const GAP = 3.5;

/**
 * A contribution-style heatmap that fills in column by column, then keeps
 * breathing. Lives in its own column so it never sits under the text.
 */
export const Heatmap: React.FC<{ startAt: number }> = ({ startAt }) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startAt;

  const cells: React.ReactNode[] = [];

  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const seed = `${c}:${r}`;
      const roll = random(seed);

      // Density rises toward the right, so the grid reads as recent momentum.
      const bias = 0.16 + (c / (COLS - 1)) * 0.84;
      let level = 0;
      if (roll < bias * 0.28) level = 4;
      else if (roll < bias * 0.52) level = 3;
      else if (roll < bias * 0.74) level = 2;
      else if (roll < bias * 0.92) level = 1;

      const appearAt = c * 2.1 + random(`${seed}-d`) * 3;
      const appear = interpolate(elapsed - appearAt, [0, 7], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

      // Slow, offset breathing on the live cells.
      const phase = random(`${seed}-p`) * Math.PI * 2;
      const pulse =
        level > 0
          ? 0.82 + 0.18 * Math.sin((frame / DURATION) * Math.PI * 4 + phase)
          : 1;

      cells.push(
        <div
          key={seed}
          style={{
            position: "absolute",
            left: c * (CELL + GAP),
            top: r * (CELL + GAP),
            width: CELL,
            height: CELL,
            borderRadius: 2.5,
            background: theme.cells[level],
            opacity: appear * (level === 0 ? 0.85 : pulse),
            boxShadow:
              level >= 3
                ? `0 0 ${6 * pulse}px rgba(57,211,83,${0.3 * pulse})`
                : "none",
          }}
        />
      );
    }
  }

  const width = COLS * (CELL + GAP) - GAP;
  const height = ROWS * (CELL + GAP) - GAP;

  const labelOpacity = interpolate(elapsed, [26, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", width }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 1.4,
          color: theme.faint,
          textTransform: "uppercase",
          marginBottom: 12,
          opacity: labelOpacity,
        }}
      >
        commit signal
      </div>
      <div style={{ position: "relative", width, height }}>{cells}</div>
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          letterSpacing: 1.4,
          color: theme.faint,
          opacity: labelOpacity,
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <span>less</span>
        {theme.cells.map((c) => (
          <span
            key={c}
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: c,
              display: "inline-block",
            }}
          />
        ))}
        <span>more</span>
      </div>
    </div>
  );
};
