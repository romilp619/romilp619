import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { theme } from "../theme";

const SCRAMBLE = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&@/\\<>";

type Props = {
  text: string;
  startAt: number;
  fontSize?: number;
};

/**
 * Resolves the name character by character out of a scrambling cipher,
 * the way a cracker tool settles on a value.
 */
export const DecodeName: React.FC<Props> = ({
  text,
  startAt,
  fontSize = 56,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startAt;

  const chars = text.split("");

  return (
    <div
      style={{
        display: "flex",
        fontSize,
        fontWeight: 700,
        letterSpacing: 1.5,
        lineHeight: 1.08,
        height: fontSize * 1.18,
        alignItems: "center",
      }}
    >
      {chars.map((ch, i) => {
        if (ch === " ") {
          return (
            <span key={i} style={{ width: fontSize * 0.34 }}>
              {" "}
            </span>
          );
        }

        const settleAt = i * 2.6 + 9;
        const locked = elapsed >= settleAt;
        const visible = elapsed >= i * 2.6;

        if (!visible) {
          return (
            <span key={i} style={{ opacity: 0 }}>
              {ch}
            </span>
          );
        }

        if (locked) {
          const glowFade = interpolate(
            elapsed - settleAt,
            [0, 10],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <span
              key={i}
              style={{
                color: theme.text,
                textShadow: `0 0 ${14 * glowFade}px rgba(57,211,83,${
                  0.85 * glowFade
                })`,
              }}
            >
              {ch}
            </span>
          );
        }

        const tick = Math.floor(elapsed / 2);
        const pick = Math.floor(random(`${i}-${tick}`) * SCRAMBLE.length);
        return (
          <span key={i} style={{ color: theme.accentSoft, opacity: 0.9 }}>
            {SCRAMBLE[pick]}
          </span>
        );
      })}
    </div>
  );
};
