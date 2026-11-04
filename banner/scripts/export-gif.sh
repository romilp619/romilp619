#!/usr/bin/env bash
# Render a composition at 2x, then downscale, quantise and optimise into a README GIF.
# Usage: scripts/export-gif.sh <CompositionId> <output.gif> [max_colors] [lossy] [palette_stats] [bayer_scale]
#   palette_stats: diff (palette from moving pixels, for scenes that keep moving)
#                  full (palette from whole frames, for mostly static brand colours)
# Env: PROPS=<file.json> passes input props to the composition (used by Stats).
set -euo pipefail
cd "$(dirname "$0")/.."

ID="$1"
OUT="$2"
COLORS="${3:-64}"
LOSSY="${4:-70}"
STATS="${5:-diff}"
BAYER="${6:-4}"
FRAMES="out/frames-$ID"
GIFSICLE="node_modules/gifsicle/vendor/gifsicle"

rm -rf "$FRAMES"
PROPS_ARGS=()
if [ -n "${PROPS:-}" ]; then PROPS_ARGS=(--props="$PROPS"); fi
npx remotion render "$ID" "$FRAMES" --sequence --scale=2 --log=error "${PROPS_ARGS[@]}"

# Native size from the first frame, halved (frames are rendered at 2x for clean edges).
read -r W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$FRAMES/element-000.png" | awk -Fx '{print int($1/2), int($2/2)}')

ffmpeg -loglevel error -y -framerate 24 -i "$FRAMES/element-%03d.png" \
  -vf "fps=16,scale=${W}:${H}:flags=lanczos,split[a][b];[a]palettegen=max_colors=${COLORS}:stats_mode=${STATS}[p];[b][p]paletteuse=dither=bayer:bayer_scale=${BAYER}:diff_mode=rectangle" \
  -loop 0 "out/$ID-raw.gif"

"$GIFSICLE" -O3 --lossy="$LOSSY" "out/$ID-raw.gif" -o "$OUT"
echo "$OUT  ${W}x${H}  $(du -h "$OUT" | cut -f1)"
