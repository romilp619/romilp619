# Profile banner

The animated banner at the top of the profile README. Rendered from React with
[Remotion](https://www.remotion.dev), not a template or a generator.

## What it renders

A 1000x280, 8 second loop at 24fps:

1. A shell prompt types `whoami`.
2. `ROMIL PATEL` resolves character by character out of a scrambling cipher.
3. The subtitle fades in.
4. A second prompt types `cat stack.txt` and the stack chips stagger in.
5. A contribution style heatmap fills column by column on the right, then breathes.

It fades from and to black at the loop boundary so the exported GIF has no visible seam.

## Layout

```
src/
  index.ts          registerRoot entry
  Root.tsx          composition registration
  Banner.tsx        scene composition and timing
  theme.ts          palette and canvas constants
  parts/
    Backdrop.tsx    gradient, engineering grid, scan sweep, scanlines
    TypeLine.tsx    prompt that types a command, with cursor handoff
    DecodeName.tsx  per character cipher resolve
    Chips.tsx       spring staggered stack chips
    Heatmap.tsx     contribution style grid
```

## Develop

```bash
cd banner
npm install
npm run studio
```

## Export

Render the frame sequence at 2x, then downscale and quantise.

```bash
npx remotion render Banner out/frames --sequence --scale=2
```

```bash
ffmpeg -y -framerate 24 -i out/frames/element-%03d.png \
  -vf "fps=16,scale=1000:280:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  -loop 0 out/banner16.gif
```

```bash
node_modules/gifsicle/vendor/gifsicle -O3 --lossy=70 out/banner16.gif -o ../assets/banner.gif
```

## Notes

- GitHub strips `<video>` from README markdown, so the deliverable has to be an
  animated image. GIF beat animated WebP here: at comparable file size the WebP
  encoder banded badly on the dark gradient background.
- Chip outlines use an inset `box-shadow` rather than `border`. Chromium paints a
  semi transparent border as four trapezoids, which left visible diagonal seams
  across each chip.
- `assets/banner.mp4` is the same render as H.264, for use outside GitHub.
