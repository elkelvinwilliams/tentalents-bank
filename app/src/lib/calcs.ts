/* Financial tools — pure functions. Inputs → calculation → result → "what this means".
   Educational and neutral: no recommendations, no promises. Money in pounds (numbers). */

export type Field = { key: string; label: string; unit?: "£" | "%" | "yrs" | "mo" | "x" | "pts"; def: number; min?: number; max?: number; step?: number };
export type Result = { rows: [string, string][]; meaning: string; caution?: string; series?: number[] };
export type Tool = { id: string; name: string; blurb: string; fields: Field[]; run: (v: Record<string, number>) => Result };

const gbp = (n: number, d = 0) => (n < 0 ? "−£" : "£") + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (n: number, d = 1) => n.toFixed(d) + "%";

/** Future value with monthly contributions; annual rate r%, compounding monthly. */
export function fv(principal: number, monthly: number, ratePct: number, years: number) {
  const i = ratePct / 100 / 12, n = Math.round(years * 12);
  if (i === 0) return principal + monthly * n;
  return principal * Math.pow(1 + i, n) + monthly * ((Math.pow(1 + i, n) - 1) / i);
}
export function fvSeries(principal: number, monthly: number, ratePct: number, years: number) {
  return Array.from({ length: years + 1 }, (_, y) => fv(principal, monthly, ratePct, y));
}
/** Monthly payment on an amortising loan. */
export function pmt(principal: number, ratePct: number, years: number) {
  const i = ratePct / 100 / 12, n = Math.round(years * 12);
  if (n === 0) return principal;
  if (i === 0) return principal / n;
  return (principal * i) / (1 - Math.pow(1 + i, -n));
}
/** Months to clear a balance at a fixed payment (null if payment doesn't cover interest). */
export function monthsToClear(balance: number, aprPct: number, payment: number) {
  const i = aprPct / 100 / 12;
  if (payment <= 0) return null;
  if (i === 0) return Math.ceil(balance / payment);
  if (payment <= balance * i) return null;
  return Math.ceil(-Math.log(1 - (balance * i) / payment) / Math.log(1 + i));
}

export const TOOLS: Tool[] = [
  { id: "compound", name: "Compound interest", blurb: "How money grows when returns earn returns.",
    fields: [{ key: "p", label: "Starting amount", unit: "£", def: 1000, min: 0 }, { key: "m", label: "Monthly contribution", unit: "£", def: 100, min: 0 }, { key: "r", label: "Annual rate", unit: "%", def: 5, min: 0, max: 30, step: 0.5 }, { key: "y", label: "Years", unit: "yrs", def: 10, min: 1, max: 50 }],
    run: (v) => { const end = fv(v.p, v.m, v.r, v.y), put = v.p + v.m * 12 * v.y; return { rows: [["Contributed", gbp(put)], ["Growth", gbp(end - put)], ["Final amount", gbp(end)]], series: fvSeries(v.p, v.m, v.r, v.y), meaning: `Of the ${gbp(end)}, ${gbp(end - put)} is growth — returns earning returns. Time does more of the work than the rate: the last few years add the most.`, caution: "The rate is an assumption, not a promise. Real returns vary and can be negative in any given year." } } },
  { id: "savings", name: "Savings goal", blurb: "What to set aside each month to reach a target.",
    fields: [{ key: "t", label: "Target", unit: "£", def: 5000, min: 1 }, { key: "s", label: "Saved so far", unit: "£", def: 500, min: 0 }, { key: "mo", label: "Months to go", unit: "mo", def: 18, min: 1, max: 600 }, { key: "r", label: "Interest on savings", unit: "%", def: 3, min: 0, max: 15, step: 0.25 }],
    run: (v) => { const i = v.r / 100 / 12, n = v.mo, gap = Math.max(0, v.t - v.s * Math.pow(1 + i, n)); const m = i === 0 ? gap / n : gap / ((Math.pow(1 + i, n) - 1) / i); return { rows: [["Still to save", gbp(Math.max(0, v.t - v.s))], ["Monthly needed", gbp(m, 2)], ["Per week", gbp(m * 12 / 52, 2)]], meaning: `About ${gbp(m, 0)} a month reaches ${gbp(v.t)} in ${n} months. Set it up as a transfer on payday and the goal stops depending on willpower.`, caution: "If the monthly figure feels impossible, the honest fix is more months, not a riskier place for the money." } } },
  { id: "emergency", name: "Emergency fund", blurb: "Your reserve — the personal version of Joseph's fifth.",
    fields: [{ key: "e", label: "Essential monthly costs", unit: "£", def: 1600, min: 0 }, { key: "mths", label: "Months of cover", unit: "mo", def: 3, min: 1, max: 12 }, { key: "s", label: "Reserve so far", unit: "£", def: 400, min: 0 }, { key: "m", label: "You can set aside monthly", unit: "£", def: 120, min: 1 }],
    run: (v) => { const target = v.e * v.mths, gap = Math.max(0, target - v.s), months = Math.ceil(gap / v.m); return { rows: [["Reserve target", gbp(target)], ["Gap", gbp(gap)], ["Months to get there", String(months)]], meaning: `${v.mths} months of essentials is ${gbp(target)}. At ${gbp(v.m)} a month you're there in ${months} months — and every later money decision gets calmer.`, caution: "Essentials means rent, food, bills, transport — not the whole budget. Three months is a start; six is comfortable." } } },
  { id: "inflation", name: "Inflation", blurb: "What today's money buys later.",
    fields: [{ key: "a", label: "Amount today", unit: "£", def: 10000, min: 0 }, { key: "r", label: "Inflation rate", unit: "%", def: 3, min: 0, max: 20, step: 0.5 }, { key: "y", label: "Years", unit: "yrs", def: 10, min: 1, max: 50 }],
    run: (v) => { const real = v.a / Math.pow(1 + v.r / 100, v.y); return { rows: [["Buying power later", gbp(real)], ["Lost to inflation", gbp(v.a - real)], ["Needed to match today", gbp(v.a * Math.pow(1 + v.r / 100, v.y))]], meaning: `At ${pct(v.r, 1)} inflation, ${gbp(v.a)} buys what ${gbp(real)} buys today after ${v.y} years. Cash that earns less than inflation quietly shrinks.`, caution: "Inflation is the reason a reserve is kept in cash but long-term money often isn't — and neither choice is advice." } } },
  { id: "loan", name: "Loan repayment", blurb: "The real monthly cost — and the interest hidden in it.",
    fields: [{ key: "p", label: "Amount borrowed", unit: "£", def: 8000, min: 1 }, { key: "r", label: "APR", unit: "%", def: 9.9, min: 0, max: 60, step: 0.1 }, { key: "y", label: "Years", unit: "yrs", def: 4, min: 1, max: 35 }],
    run: (v) => { const m = pmt(v.p, v.r, v.y), total = m * v.y * 12; return { rows: [["Monthly payment", gbp(m, 2)], ["Total repaid", gbp(total)], ["Total interest", gbp(total - v.p)]], meaning: `You repay ${gbp(total)} for ${gbp(v.p)} borrowed — ${gbp(total - v.p)} is the price of borrowing. A shorter term costs more per month and far less overall.`, caution: "The honest debt test: does the loan buy something that lasts longer than the payments?" } } },
  { id: "growth", name: "Investment growth", blurb: "Three assumptions side by side — because nobody knows which one happens.",
    fields: [{ key: "p", label: "Starting amount", unit: "£", def: 2000, min: 0 }, { key: "m", label: "Monthly", unit: "£", def: 150, min: 0 }, { key: "y", label: "Years", unit: "yrs", def: 15, min: 1, max: 50 }, { key: "r", label: "Assumed annual return", unit: "%", def: 6, min: -10, max: 20, step: 0.5 }],
    run: (v) => { const lo = fv(v.p, v.m, Math.min(v.r, 2), v.y), mid = fv(v.p, v.m, v.r, v.y), hi = fv(v.p, v.m, v.r + 3, v.y); return { rows: [[`Cautious (${pct(Math.min(v.r, 2), 0)})`, gbp(lo)], [`Assumed (${pct(v.r, 0)})`, gbp(mid)], [`Optimistic (${pct(v.r + 3, 0)})`, gbp(hi)]], series: fvSeries(v.p, v.m, v.r, v.y), meaning: `The spread between ${gbp(lo)} and ${gbp(hi)} is the point: the outcome depends on a return nobody can promise. What you control is the contribution and the time.`, caution: "Investing can lose money, including all of it in concentrated bets. This is arithmetic, not a forecast." } } },
  { id: "networth", name: "Net worth", blurb: "What you own minus what you owe.",
    fields: [{ key: "a", label: "Assets (cash, savings, property, business…)", unit: "£", def: 42000, min: 0 }, { key: "l", label: "Liabilities (mortgage, loans, cards)", unit: "£", def: 18500, min: 0 }],
    run: (v) => { const nw = v.a - v.l; return { rows: [["Assets", gbp(v.a)], ["Liabilities", gbp(v.l)], ["Net worth", gbp(nw)]], meaning: nw >= 0 ? `Net worth ${gbp(nw)}. The number matters less than its direction — check it quarterly and watch the trend, not the day.` : `Net worth ${gbp(nw)} — negative is common early on (student loans, a new mortgage). Direction over time is what to watch.`, caution: "Your snapshot, your figures. Ten Talents holds no money and this is not a valuation or advice." } } },
  { id: "position", name: "Position size", blurb: "Size from the stop, not the balance.",
    fields: [{ key: "acc", label: "Account", unit: "£", def: 10000, min: 1 }, { key: "risk", label: "Risk per trade", unit: "%", def: 1, min: 0.1, max: 5, step: 0.1 }, { key: "stop", label: "Stop distance", unit: "pts", def: 50, min: 0.01, step: 0.5 }],
    run: (v) => { const money = v.acc * v.risk / 100, per = money / v.stop; return { rows: [["Money at risk", gbp(money, 2)], ["Size per point", gbp(per, 2)], ["Ten losses in a row", gbp(money * 10)]], meaning: `Risking ${pct(v.risk, 1)} means ${gbp(money, 0)} on the line, so size is ${gbp(per, 2)} per point for a ${v.stop}-point stop. Ten straight losses would cost ${gbp(money * 10, 0)} — survivable, which is the whole idea.`, caution: "Educational. Demo simulator only; nothing here says whether to trade." } } },
  { id: "rr", name: "Risk / reward", blurb: "What a trade needs to win to break even.",
    fields: [{ key: "risk", label: "Risk (stop distance)", unit: "pts", def: 40, min: 0.01 }, { key: "reward", label: "Reward (target distance)", unit: "pts", def: 80, min: 0.01 }],
    run: (v) => { const rr = v.reward / v.risk, be = 100 / (1 + rr); return { rows: [["Risk : reward", `1 : ${rr.toFixed(2)}`], ["Break-even win rate", pct(be, 1)], ["At 50% wins, per 10 trades", `${(5 * v.reward - 5 * v.risk).toFixed(0)} pts`]], meaning: `At 1:${rr.toFixed(1)} you need to win ${pct(be, 0)} of trades just to break even before costs. Higher reward-to-risk buys tolerance for being wrong.`, caution: "Win rate and reward trade off against each other — no ratio is 'good' on its own." } } },
  { id: "leverage", name: "Leverage", blurb: "What a small move does to your money.",
    fields: [{ key: "cap", label: "Your money", unit: "£", def: 1000, min: 1 }, { key: "lev", label: "Leverage", unit: "x", def: 10, min: 1, max: 500 }, { key: "move", label: "Market move against you", unit: "%", def: 5, min: 0, max: 100, step: 0.5 }],
    run: (v) => { const exp = v.cap * v.lev, loss = exp * v.move / 100, wipe = 100 / v.lev; return { rows: [["Exposure", gbp(exp)], [`Loss on a ${pct(v.move, 1)} move`, gbp(loss)], ["Move that wipes you out", pct(wipe, 2)]], meaning: `£${v.cap.toLocaleString()} at ${v.lev}x controls ${gbp(exp)}. A ${pct(v.move, 1)} move against you costs ${gbp(loss)} — ${pct(loss / v.cap * 100, 0)} of your money. A ${pct(wipe, 2)} move takes all of it.`, caution: "Leverage multiplies risk, not skill. Most retail leveraged accounts lose money." } } },
];

/* ---------- Jubilee debt-freedom planner ---------- */
export type DebtIn = { id: string; name: string; balance: number; apr: number; minPayment: number }; // pounds, %
export type JubileeOut = { months: number; totalInterest: number; order: { id: string; name: string; month: number }[]; series: number[]; stuck: boolean };

/** Simulate paying minimums on all debts plus `extra` directed at one (snowball = smallest balance first, avalanche = highest APR first). */
export function jubilee(debts: DebtIn[], extra: number, method: "snowball" | "avalanche"): JubileeOut {
  const ds = debts.filter((d) => d.balance > 0).map((d) => ({ ...d, bal: d.balance }));
  const order: JubileeOut["order"] = []; const series: number[] = [ds.reduce((a, d) => a + d.bal, 0)];
  let month = 0, totalInterest = 0, stuck = false;
  while (ds.some((d) => d.bal > 0.005) && month < 600) {
    month++;
    let pool = extra;
    // freed minimums roll into the pool
    for (const d of ds) if (d.bal <= 0.005) pool += d.minPayment;
    for (const d of ds) if (d.bal > 0.005) { const i = d.bal * (d.apr / 100 / 12); d.bal += i; totalInterest += i; }
    for (const d of ds) if (d.bal > 0.005) { const pay = Math.min(d.bal, d.minPayment); d.bal -= pay; }
    const live = ds.filter((d) => d.bal > 0.005).sort((a, b) => (method === "snowball" ? a.bal - b.bal : b.apr - a.apr));
    for (const d of live) { if (pool <= 0) break; const pay = Math.min(d.bal, pool); d.bal -= pay; pool -= pay; }
    for (const d of ds) if (d.bal <= 0.005 && !order.some((o) => o.id === d.id)) order.push({ id: d.id, name: d.name, month });
    series.push(ds.reduce((a, d) => a + Math.max(0, d.bal), 0));
    if (month > 12 && series[month] >= series[month - 12]) { stuck = true; break; }
  }
  return { months: month, totalInterest, order, series, stuck: stuck || month >= 600 };
}
