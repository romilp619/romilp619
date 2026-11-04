#!/usr/bin/env bash
# Render a composition at 2x, then downscale, quantise and optimise into a README GIF.
# Usage: scripts/export-gif.sh <CompositionId> <output.gif> [max_colors] [lossy] [palette_stats] [bayer_scale]
#   palette_stats: diff (palette from moving pixels, for scenes that keep moving)
#                  full (palette from whole frames, for mostly static brand colours)
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
npx remotion render "$ID" "$FRAMES" --sequence --scale=2 --log=error

# Native size from the first frame, halved (frames are rendered at 2x for clean edges).
read -r W H < <(python3 -c "from PIL import Image; im=Image.open('$FRAMES/element-000.png'); print(im.size[0]//2, im.size[1]//2)")

ffmpeg -loglevel error -y -framerate 24 -i "$FRAMES/element-%03d.png" \
  -vf "fps=16,scale=${W}:${H}:flags=lanczos,split[a][b];[a]palettegen=max_colors=${COLORS}:stats_mode=${STATS}[p];[b][p]paletteuse=dither=bayer:bayer_scale=${BAYER}:diff_mode=rectangle" \
  -loop 0 "out/$ID-raw.gif"

"$GIFSICLE" -O3 --lossy="$LOSSY" "out/$ID-raw.gif" -o "$OUT"
echo "$OUT  ${W}x${H}  $(du -h "$OUT" | cut -f1)"
