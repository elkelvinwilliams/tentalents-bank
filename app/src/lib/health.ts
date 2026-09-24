/* Financial health — a non-judgemental check. Seven dimensions, 1–5 each, answered by the
   user. Output is "your next priorities", never a grade. Educational guidance, not advice. */

export const HEALTH_DIMENSIONS: { id: string; name: string; q: string; low: string; high: string }[] = [
  { id: "saving", name: "Saving", q: "How regularly do you set money aside?", low: "Rarely", high: "Every payday, automatically" },
  { id: "spending", name: "Spending", q: "How well do you know where your money goes each month?", low: "Not really", high: "To the pound" },
  { id: "debt", name: "Debt", q: "How manageable is any debt you carry?", low: "It worries me", high: "None, or fully planned" },
  { id: "emergency", name: "Emergency preparedness", q: "If income stopped, how many months could you cover?", low: "Under one", high: "Six or more" },
  { id: "knowledge", name: "Financial knowledge", q: "How confident are you explaining interest, inflation and budgeting?", low: "Not confident", high: "Could teach it" },
  { id: "investing", name: "Investing knowledge", q: "How well do you understand what you'd be buying if you invested?", low: "Not at all", high: "Clearly, including the risks" },
  { id: "goals", name: "Goal clarity", q: "How clear are your financial goals and dates?", low: "Vague", high: "Written, dated, tracked" },
];

export type Priority = { title: string; why: string; go: "goals" | "tools" | "learn" | "wealth" | "jubilee" | "journey" };

export function priorities(a: Record<string, number>): Priority[] {
  const v = (k: string) => a[k] ?? 3;
  const out: Priority[] = [];
  if (v("emergency") <= 2) out.push({ title: "Build emergency savings", why: "A reserve is what turns emergencies into inconveniences. Start with one month of essentials.", go: "tools" });
  if (v("debt") <= 2) out.push({ title: "Review high-cost debt", why: "Anything above about 10% APR is quietly expensive. The Jubilee planner shows a payoff order and date.", go: "jubilee" });
  if (v("spending") <= 2) out.push({ title: "Map a month of spending", why: "You can't steer what you can't see. One month of honest tracking changes the conversation.", go: "journey" });
  if (v("saving") <= 3) out.push({ title: "Automate a saving rate", why: "A fixed transfer on payday — even small — beats saving what's left.", go: "goals" });
  if (v("goals") <= 2) out.push({ title: "Write one dated goal", why: "A target, an amount and a date turn a wish into a plan.", go: "goals" });
  if (v("knowledge") <= 3) out.push({ title: "Continue Money Foundations", why: "Interest, inflation and compounding are the machinery under everything else.", go: "learn" });
  if (v("investing") <= 3) out.push({ title: "Continue learning about diversification", why: "Understand what you'd be buying, and why one asset is a bet, before any money moves.", go: "learn" });
  if (!out.length) out.push({ title: "Keep the rhythm", why: "Your answers suggest strong habits. Review quarterly, keep learning, and consider the Give stage of the journey.", go: "journey" });
  return out.slice(0, 3);
}
