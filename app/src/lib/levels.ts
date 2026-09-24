/* Level maths shared by server and client. Learning XP only — nothing here
   ever rewards trading activity. */
export const LEVEL_XP = 1500;
export const LEVEL_TITLES = ["Seedling", "Saver", "Apprentice", "Steward", "Strategist", "Custodian", "Sage"];
export const DAILY_GOAL_XP = 50;

export const levelOf = (xp: number) => Math.min(Math.floor(xp / LEVEL_XP) + 1, LEVEL_TITLES.length);
export const levelTitle = (xp: number) => LEVEL_TITLES[levelOf(xp) - 1];
export function levelProgress(xp: number) {
  const l = levelOf(xp);
  const base = (l - 1) * LEVEL_XP;
  return { level: l, cur: xp - base, need: LEVEL_XP, pct: Math.min(((xp - base) / LEVEL_XP) * 100, 100) };
}

/* XP schedule — one place, so the client copy and the server truth agree. */
export const XP = {
  lesson_done: 40,
  quiz_pass: 100,
  assessment: 60,
  knowledge: 20,
  goal_set: 30,
  goal_add: 10,
  goal_ms: 25,
  goal_done: 100,
  drill: 25,
} as const;

export type BadgeDef = { id: string; name: string; icon: string; how: string };
export const BADGES: BadgeDef[] = [
  { id: "first_steps", name: "First Steps", icon: "bolt", how: "Complete your first lesson" },
  { id: "streak_7", name: "7-Day Streak", icon: "flame", how: "Learn seven days in a row" },
  { id: "quiz_ace", name: "Quiz Ace", icon: "star", how: "Pass a module quiz" },
  { id: "steward", name: "Steward", icon: "target", how: "Complete a savings goal" },
  { id: "risk_aware", name: "Risk Aware", icon: "wisdom", how: "Finish the Understanding Risk track" },
  { id: "judgement", name: "Good Judgement", icon: "trade", how: "Answer every scenario drill well" },
  { id: "sage", name: "Sage", icon: "spark", how: "Reach Level 7" },
];
