// Fetches the stats panel's data from the GitHub GraphQL API and writes it as
// Remotion input props ({ data }). Node 18+, no dependencies.
// Usage: GITHUB_TOKEN=... node scripts/fetch-stats.mjs <login> <out.json>
import { writeFileSync } from "node:fs";

const [login = "romilp619", out = "out/stats.json"] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) throw new Error("Set GITHUB_TOKEN or GH_TOKEN");

const query = `query($login: String!) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100) {
      totalCount
      nodes { languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } } }
    }
    contributionsCollection {
      totalCommitContributions
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-stats" },
  body: JSON.stringify({ query, variables: { login } }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json));
const user = json.data.user;
const cc = user.contributionsCollection;
const weeks = cc.contributionCalendar.weeks;
const days = weeks.flatMap((w) => w.contributionDays);

// Streaks. Today having no contributions yet doesn't break the current streak.
let current = 0;
let i = days.length - 1;
if (days[i].contributionCount === 0) i--;
while (i >= 0 && days[i].contributionCount > 0) { current++; i--; }
let longest = 0;
let run = 0;
for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }

const weekly = weeks.map((w) => ({
  start: w.contributionDays[0].date,
  count: w.contributionDays.reduce((s, d) => s + d.contributionCount, 0),
}));

const weekday = [0, 0, 0, 0, 0, 0, 0];
for (const d of days) weekday[new Date(d.date + "T00:00:00Z").getUTCDay()] += d.contributionCount;

// Language share by bytes across public, non-fork repos; top five, rest folded into Other.
const bytes = new Map();
for (const repo of user.repositories.nodes) {
  for (const e of repo.languages.edges) {
    const cur = bytes.get(e.node.name) ?? { size: 0, color: e.node.color ?? "#8b949e" };
    cur.size += e.size;
    bytes.set(e.node.name, cur);
  }
}
const total = [...bytes.values()].reduce((s, v) => s + v.size, 0) || 1;
const ranked = [...bytes.entries()].sort((a, b) => b[1].size - a[1].size);
const languages = ranked.slice(0, 5).map(([name, v]) => ({ name, color: v.color, share: v.size / total }));
const rest = ranked.slice(5).reduce((s, [, v]) => s + v.size, 0) / total;
if (rest > 0) languages.push({ name: "Other", color: "#6e7681", share: rest });

const stats = {
  login,
  updated: new Date().toISOString().slice(0, 10),
  rangeStart: days[0].date,
  rangeEnd: days[days.length - 1].date,
  totalContributions: cc.contributionCalendar.totalContributions,
  commits: cc.totalCommitContributions,
  publicRepos: user.repositories.totalCount,
  activeDays: days.filter((d) => d.contributionCount > 0).length,
  bestDay: Math.max(...days.map((d) => d.contributionCount)),
  bestWeek: Math.max(...weekly.map((w) => w.count)),
  currentStreak: current,
  longestStreak: longest,
  weekly,
  weekday,
  languages,
};
writeFileSync(out, JSON.stringify({ data: stats }, null, 2));
console.log(`wrote ${out}: ${stats.totalContributions} contributions, streak ${current}/${longest}, ${languages.length} languages`);
