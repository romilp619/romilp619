import React from "react";
import { useCurrentFrame } from "remotion";
import { theme } from "../theme";

type Props = {
  prompt: string;
  command: string;
  startAt: number;
  charsPerFrame?: number;
  fontSize?: number;
  showCursor?: boolean;
  /** Frame at which this line releases the cursor to the next line. */
  hideCursorAfter?: number;
};

/** A shell prompt that types a command out one character at a time. */
export const TypeLine: React.FC<Props> = ({
  prompt,
  command,
  startAt,
  charsPerFrame = 0.9,
  fontSize = 17,
  showCursor = true,
  hideCursorAfter,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startAt;

  if (elapsed < 0) {
    return <div style={{ height: fontSize * 1.6 }} />;
  }

  const shown = Math.min(
    command.length,
    Math.floor(elapsed * charsPerFrame)
  );
  const typing = shown < command.length;
  const released = hideCursorAfter !== undefined && frame >= hideCursorAfter;
  const cursorOn =
    !released && (typing || Math.floor(frame / 8) % 2 === 0);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        height: fontSize * 1.6,
        fontSize,
        letterSpacing: 0.2,
        whiteSpace: "pre",
      }}
    >
      <span style={{ color: theme.accentSoft }}>{prompt}</span>
      <span style={{ color: theme.dim }}>{command.slice(0, shown)}</span>
      {showCursor && cursorOn ? (
        <span
          style={{
            display: "inline-block",
            width: fontSize * 0.54,
            height: fontSize * 1.05,
            background: theme.accent,
            opacity: 0.85,
            transform: "translateY(2px)",
          }}
        />
      ) : null}
    </div>
  );
};
