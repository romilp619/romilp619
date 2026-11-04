export type StatsData = {
  login: string;
  updated: string;
  rangeStart: string;
  rangeEnd: string;
  totalContributions: number;
  commits: number;
  publicRepos: number;
  activeDays: number;
  bestDay: number;
  bestWeek: number;
  currentStreak: number;
  longestStreak: number;
  weekly: { start: string; count: number }[];
  /** Sunday-first, as JavaScript's getUTCDay. */
  weekday: number[];
  languages: { name: string; color: string; share: number }[];
};
