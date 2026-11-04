import { staticFile } from "remotion";
import {
  siBugcrowd,
  siBurpsuite,
  siDocker,
  siGnubash,
  siHackerone,
  siHackthebox,
  siJavascript,
  siKalilinux,
  siKubernetes,
  siMetasploit,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siReact,
  siRust,
  siSolidity,
  siTypescript,
  siWireshark,
} from "simple-icons";

/** Tile surface the marks sit on. Contrast is measured against this. */
export const TILE_BG = "#161b22";
const DARK_MODE_MARK = "#f0f6fc";

const luminance = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * Exact brand hex, unless it fails contrast on the dark tile. Those brands
 * (Next.js, Rust, X, HackerOne...) ship a white mark for dark backgrounds, so
 * that's what they get, rather than a recoloured guess.
 */
export const markColor = (brandHex: string) =>
  contrast(`#${brandHex}`, TILE_BG) < 2.5 ? DARK_MODE_MARK : `#${brandHex}`;

export type Logo =
  | { name: string; kind: "path"; path: string; color: string }
  | { name: string; kind: "file"; src: string; accent: string; size?: number };

const si = (name: string, icon: { path: string; hex: string }): Logo => ({
  name,
  kind: "path",
  path: icon.path,
  color: markColor(icon.hex),
});

/**
 * From devicon (MIT), in /public/logos: marks simple-icons removed for trademark
 * reasons (AWS, Azure), and multicolour brands whose single-colour mark loses
 * their identity (Python, Google Cloud, Firebase).
 */
/** `size` compensates for marks drawn with built-in padding. */
const file = (name: string, src: string, accent: string, size?: number): Logo => ({
  name,
  kind: "file",
  src: staticFile(src),
  accent,
  size,
});

export type StackRow = { label: string; items: Logo[] };

export const STACK_ROWS: StackRow[] = [
  {
    label: "Offensive",
    items: [
      si("Burp Suite", siBurpsuite),
      si("Metasploit", siMetasploit),
      si("Wireshark", siWireshark),
      si("Kali Linux", siKalilinux),
      si("HackerOne", siHackerone),
      si("Bugcrowd", siBugcrowd),
      si("Hack The Box", siHackthebox),
    ],
  },
  {
    label: "Languages",
    items: [
      file("Python", "logos/python.svg", "#3776AB", 39),
      si("TypeScript", siTypescript),
      si("JavaScript", siJavascript),
      si("Rust", siRust),
      si("Solidity", siSolidity),
      si("Bash", siGnubash),
    ],
  },
  {
    label: "Build",
    items: [
      si("React", siReact),
      si("Node.js", siNodedotjs),
      si("Next.js", siNextdotjs),
      si("MongoDB", siMongodb),
      si("PostgreSQL", siPostgresql),
      si("Docker", siDocker),
      si("Kubernetes", siKubernetes),
    ],
  },
  {
    label: "Cloud",
    items: [
      file("AWS", "logos/aws.svg", "#FF9900"),
      file("Google Cloud", "logos/googlecloud.svg", "#4285F4"),
      file("Azure", "logos/azure.svg", "#0089D6"),
      file("Firebase", "logos/firebase.svg", "#FFA000"),
    ],
  },
];
