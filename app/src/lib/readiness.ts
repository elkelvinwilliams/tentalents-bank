/* Readiness — computed from the 10-question Academy assessment.
   A guide to where to start, not a verdict and not advice. Client and server share it. */

export type Readiness = { score: number; label: string; blurb: string; track: string; trackName: string; reason: string; next: string[] };

const TRACK_NAMES: Record<string, string> = { t1: "Money Foundations", t2: "How Markets Work", t3: "Understanding Risk", t4: "Building Something" };

export function readiness(a: Record<string, number>): Readiness {
  const q = (i: number) => a[String(i)] ?? -1;
  let score = 20;
  score += [0, 10, 14][q(0)] ?? 0;                 // where you are
  score += [4, 8, 12][q(1)] ?? 0;                  // time each week
  score += [10, 12, 6, 8][q(4)] ?? 0;              // real money history
  score += q(5) === 2 ? -4 : q(5) >= 0 ? 4 : 0;    // "I keep breaking my own rules"
  score += [10, 12, 6, 4][q(7)] ?? 0;              // risk tolerance
  score += [8, 10, 6, 8][q(8)] ?? 0;               // what success looks like
  score = Math.max(5, Math.min(95, score));

  let track = "t2", reason = "You know a little already — see how a price is actually made before going further.";
  if (q(0) === 0 || q(5) === 0) { track = "t1"; reason = "You told us you're starting out. Money first, then markets — that order is the point."; }
  else if (q(4) === 2 || q(4) === 3 || q(5) === 2 || q(7) === 2) { track = "t3"; reason = "You've traded real money, or you break your own rules. Risk comes before anything else."; }
  else if (q(2) === 2 && q(0) >= 1) { track = "t4"; reason = "You're here to build a skill — start where entrepreneurship is treated as a talent."; }

  const label = score < 40 ? "Foundations first" : score < 65 ? "Building readiness" : "Ready to practise";
  const blurb = score < 40
    ? "Nothing wrong with that — most people are never taught this. Start slow, finish lessons, and let the simulator wait."
    : score < 65
    ? "You have some of the pieces. The Academy fills the gaps in order; the simulator is for practising what you've learned, not guessing."
    : "You're ready to practise what you learn — in the simulator, with demo money, and with a journal that shows you your own behaviour.";
  const next = [
    `Start with ${TRACK_NAMES[track]}`,
    q(1) === 0 ? "Aim for one short lesson a day — streaks matter more than sessions" : "Set a daily goal and keep the streak alive",
    q(4) >= 2 ? "Log past trades in the journal — planned or impulse — before the next one" : "Try the simulator only after Understanding Risk",
  ];
  return { score, label, blurb, track, trackName: TRACK_NAMES[track], reason, next };
}
