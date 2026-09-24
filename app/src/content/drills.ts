/* Scenario drills — practise judgement, not prediction. The "best" answer
   rewards discipline; XP is awarded server-side, once per scenario. */
export type Drill = { id: string; title: string; body: string; options: { text: string; why: string }[]; best: number };

export const DRILLS: Drill[] = [
  {
    id: "rate-shock", title: "An unexpected rate decision",
    body: "A central bank surprises mid-session. Volatility spikes, spreads widen. You hold two positions. Best response?",
    options: [
      { text: "Panic-close everything", why: "Reacting to volatility often means selling at the worst moment, when spreads are widest." },
      { text: "Check exposure, let stops work", why: "Right. Stops set when calm are what protect you when volatility spikes." },
      { text: "Add leverage for the swing", why: "Adding risk into a spike is how accounts blow up. The visible move has already partly happened." },
    ], best: 1,
  },
  {
    id: "five-losses", title: "Five losses in a row",
    body: "Five consecutive losers, risk rules intact. You feel the urge to trade bigger to recover. Now?",
    options: [
      { text: "Double the next trade", why: "Revenge trading. A streak within your plan is normal variance; sizing up turns it serious." },
      { text: "Stop, review, keep risk fixed", why: "Right. Streaks happen even with an edge. Protect the account first." },
      { text: "Switch strategy immediately", why: "Abandoning a plan after normal variance means you never learn if it worked." },
    ], best: 1,
  },
  {
    id: "hot-tip", title: "A tip from a group chat",
    body: "Someone in a group posts a ‘guaranteed’ setup with a screenshot of gains. Twenty people are piling in. You?",
    options: [
      { text: "Follow it — twenty people can't be wrong", why: "They can. Screenshots aren't audited and crowds are how pumps work." },
      { text: "Ignore the tip; check it against your own plan", why: "Right. If it isn't in your plan, it isn't your trade. Signals are not education." },
      { text: "Take a small position to see", why: "‘Small’ positions on tips become habits. The problem is the process, not the size." },
    ], best: 1,
  },
];

export const MARKETS = [
  { s: "XAUUSD", n: "Gold", p: 2412.6, c: -0.31 },
  { s: "UKX", n: "FTSE 100", p: 8214.3, c: 0.42 },
  { s: "SPX", n: "S&P 500", p: 5431.8, c: 0.18 },
  { s: "BTCUSD", n: "Bitcoin", p: 63180, c: 2.44 },
  { s: "GBPUSD", n: "GBP/USD", p: 1.2734, c: 0.05 },
  { s: "BRENT", n: "Brent", p: 82.14, c: -1.21 },
];
