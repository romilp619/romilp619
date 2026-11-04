import React from "react";
import { Composition } from "remotion";
import { Banner } from "./Banner";
import { Whoami, WHOAMI_W, WHOAMI_H } from "./Whoami";
import { Stack, STACK_W, STACK_H } from "./Stack";
import { Stats, STATS_W, STATS_H } from "./Stats";
import sample from "./data/stats.sample.json";
import type { StatsData } from "./statsTypes";
import { FPS, DURATION, WIDTH, HEIGHT } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Banner" component={Banner} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      <Composition id="Whoami" component={Whoami} durationInFrames={DURATION} fps={FPS} width={WHOAMI_W} height={WHOAMI_H} />
      <Composition id="Stack" component={Stack} durationInFrames={DURATION} fps={FPS} width={STACK_W} height={STACK_H} />
      {/* Real data arrives via --props from scripts/fetch-stats.mjs; the sample is for the studio. */}
      <Composition
        id="Stats"
        component={Stats}
        durationInFrames={DURATION}
        fps={FPS}
        width={STATS_W}
        height={STATS_H}
        defaultProps={sample as { data: StatsData }}
      />
    </>
  );
};
