import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

type Props = {
  items: string[];
  startAt: number;
};

export const Chips: React.FC<Props> = ({ items, startAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        maxWidth: 580,
      }}
    >
      {items.map((label, i) => {
        const delay = startAt + i * 3;
        const s = spring({
          frame: frame - delay,
          fps,
          config: { damping: 200, mass: 0.5 },
        });
        const opacity = interpolate(s, [0, 1], [0, 1]);
        return (
          <div
            key={label}
            style={{
              opacity,
              transform: `translateY(${(1 - s) * 7}px)`,
              boxShadow: `inset 0 0 0 1px ${theme.chipBorder}`,
              background: theme.chipBg,
              color: theme.text,
              borderRadius: 5,
              padding: "4px 10px",
              fontSize: 13.5,
              letterSpacing: 0.3,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};
