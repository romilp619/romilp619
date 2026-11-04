import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { Backdrop } from "./parts/Backdrop";
import { TypeLine } from "./parts/TypeLine";
import { DecodeName } from "./parts/DecodeName";
import { Chips } from "./parts/Chips";
import { Heatmap } from "./parts/Heatmap";
import { theme, PAD } from "./theme";

const { fontFamily } = loadFont();
const MONO = `${fontFamily}, "DejaVu Sans Mono", "Liberation Mono", monospace`;

const PROMPT = "romil@github:~$";
const STACK = [
  "Bug Bounty",
  "CTF",
  "Python",
  "TypeScript",
  "Linux",
  "Solidity",
];

export const Banner: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade at both ends so the exported GIF loops without a visible seam.
  const fadeIn = interpolate(frame, [0, 9], [0, 1], {
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [181, 192], [1, 0], {
    extrapolateLeft: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [46, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: theme.bgDeep }}>
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut, fontFamily: MONO }}>
        <Backdrop />

        <AbsoluteFill
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `34px ${PAD}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 6,
              width: 580,
            }}
          >
            <TypeLine
              prompt={PROMPT}
              command=" whoami"
              startAt={6}
              hideCursorAfter={62}
            />

            <DecodeName text="ROMIL PATEL" startAt={16} fontSize={50} />

            <div
              style={{
                opacity: subtitleOpacity,
                color: theme.dim,
                fontSize: 15,
                letterSpacing: 0.4,
                height: 24,
                display: "flex",
                alignItems: "center",
              }}
            >
              Security Researcher
              <span style={{ color: theme.accent, margin: "0 8px" }}>·</span>
              Bug Bounty Hunter
              <span style={{ color: theme.accent, margin: "0 8px" }}>·</span>
              Builder
            </div>

            <TypeLine
              prompt={PROMPT}
              command=" cat stack.txt"
              startAt={62}
            />

            <Chips items={STACK} startAt={80} />
          </div>

          <Heatmap startAt={20} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
