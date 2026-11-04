import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme, WIDTH, HEIGHT, DURATION } from "../theme";

/**
 * Background: deep gradient, faint engineering grid, and a slow scan sweep.
 * Deliberately has no corner framing marks.
 */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();

  const gridOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Scan sweep crosses twice over the loop.
  const cycle = DURATION / 2;
  const t = (frame % cycle) / cycle;
  const sweepX = interpolate(t, [0, 1], [-220, WIDTH + 220]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(120% 160% at 18% 0%, #12181f 0%, ${theme.bg} 45%, ${theme.bgDeep} 100%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: gridOpacity * 0.5,
          backgroundImage: `linear-gradient(${theme.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(90% 120% at 30% 50%, black 10%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(90% 120% at 30% 50%, black 10%, transparent 78%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: sweepX,
          width: 220,
          height: HEIGHT,
          background:
            "linear-gradient(90deg, rgba(57,211,83,0) 0%, rgba(57,211,83,0.055) 48%, rgba(57,211,83,0.14) 50%, rgba(57,211,83,0.055) 52%, rgba(57,211,83,0) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.22,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.045) 0px, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 120px 30px rgba(0,0,0,0.65)",
        }}
      />
    </>
  );
};
