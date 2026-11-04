import React from "react";
import { Composition } from "remotion";
import { Banner } from "./Banner";
import { FPS, DURATION, WIDTH, HEIGHT } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Banner"
      component={Banner}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
