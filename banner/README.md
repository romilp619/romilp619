# Profile motion

The three animations in the profile README, rendered from React with
[Remotion](https://www.remotion.dev), not templates or generators:

| Composition | Output | Size |
|:--|:--|:--|
| `Banner` | `assets/banner.gif` | 1000x280 |
| `Whoami` | `assets/whoami.gif` | 1000x420 |
| `Stack` | `assets/stack.gif` | 1000x520 |
| `Stats` | `stats` branch, `stats.gif`, re-rendered daily | 1000x668 |

All three are 8 s loops at 24fps that fade from and to black, so the GIFs loop without a seam.

## Banner


1. A shell prompt types `whoami`.
2. `ROMIL PATEL` resolves character by character out of a scrambling cipher.
3. The subtitle fades in.
4. A second prompt types `cat stack.txt` and the stack chips stagger in.
5. A contribution style heatmap fills column by column on the right, then breathes.


## Whoami

A terminal types `whoami --verbose` and prints a profile row by row, platform names
in their own brand colours. A proof-points column counts up beside it; the figures
are the ones on the proof strip of romilp619.github.io.

## Stack

Every tool on one fixed grid, so columns line up across categories. Tiles land grey
and light into their brand colour, then a scan pass picks out each column.

Logo sourcing, in `src/logos.ts`:

- Marks and brand hex from [simple-icons](https://simpleicons.org) (CC0), pinned to 16.35.0.
- If a brand colour fails a 2.5:1 contrast check against the tile, the mark renders
  white, which is what those brands (HackerOne, Rust, Solidity, Next.js) ship for dark
  backgrounds. Every other mark keeps its exact brand hex.
- From [devicon](https://devicon.dev) (MIT), pinned to 2.17.0, in `public/logos`: AWS
  and Azure, which simple-icons removed for trademark reasons, and Python, Google Cloud
  and Firebase, whose multicolour marks lose their identity in one colour. The AWS
  lettering is recoloured white, as in AWS's own dark-background logo.

## Stats

Four panels from live GitHub data for the last 12 months:

- **Contributions:** weekly totals as a smooth wave that draws in, then a light pulse
  travels along it.
- **Streak:** a ring filled to current streak over longest, with a comet orbiting it.
- **Languages:** share of code by bytes across public, non-fork repos, top five plus
  Other, in GitHub's own language colours. The donut sweeps in and slowly turns.
- **Activity:** commits, active days, public repos, best day, best week, contributions
  per active day, and a bar per weekday with the busiest one highlighted.

The data never animates: counters count up to the real value and stay there, and bar
heights and curve points are fixed. Only the presentation moves.

`scripts/fetch-stats.mjs` fetches the data and writes it as Remotion props.
`.github/workflows/stats.yml` runs it every day at 02:23 UTC (and on pushes that touch
`banner/`), renders the GIF and force-pushes it with its JSON to the orphan `stats`
branch as a single commit. Bot commits on a non-default branch keep main's history
clean and don't count toward the contribution graph.

To render it locally:

```bash
GH_TOKEN=<token> node scripts/fetch-stats.mjs romilp619 out/stats.json
```

```bash
PROPS=out/stats.json scripts/export-gif.sh Stats out/stats.gif 128 60 full 5
```

## Layout

```
src/
  index.ts          registerRoot entry
  Root.tsx          composition registration
  Banner.tsx        banner scene and timing
  Whoami.tsx        whoami terminal and proof points
  Stack.tsx         stack grid
  Stats.tsx         stats panels
  statsTypes.ts     stats data shape
  data/             sample stats props for the studio
  logos.ts          stack data, brand colours, contrast rule
  fonts.ts          shared JetBrains Mono
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

`scripts/export-gif.sh` renders a composition at 2x, downscales, quantises and runs
gifsicle. These are the exact commands for the committed GIFs:

```bash
scripts/export-gif.sh Banner ../assets/banner.gif 64 70 diff 4
```

```bash
scripts/export-gif.sh Whoami ../assets/whoami.gif 128 60 full 5
```

```bash
scripts/export-gif.sh Stack ../assets/stack.gif 256 60 full 5
```

The palette mode matters. `diff` builds the palette from pixels that change between
frames, which suits the banner's moving sweep. Whoami and Stack are mostly static
brand colour, and under `diff` those colours got too few palette slots (Bugcrowd's
orange drifted brown, Google Cloud's blue went grey), so they use `full`.

## Notes

- GitHub strips `<video>` from README markdown, so the deliverable has to be an
  animated image. GIF beat animated WebP here: at comparable file size the WebP
  encoder banded badly on the dark gradient background.
- Chip outlines use an inset `box-shadow` rather than `border`. Chromium paints a
  semi transparent border as four trapezoids, which left visible diagonal seams
  across each chip.
- `assets/banner.mp4` is the same render as H.264, for use outside GitHub.
