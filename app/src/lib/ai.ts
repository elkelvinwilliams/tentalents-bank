/* Ten Talents AI — rules-based tutor. Three modes: LEARN (explain concepts), REFLECT (patterns in
   your own learning and simulated behaviour), UNDERSTAND (charts, calculations, jargon in plain
   language). Hard boundary: no buy/sell, no what-to-buy, no how-much, no predictions, no
   personalised recommendations, no leverage encouragement, never an adviser.
   A live model can replace `answer()` later behind the same screen and the same boundary. */

export type AiMode = "learn" | "reflect" | "understand";
export type AiContext = { lessonsDone: number; totalLessons: number; streak: number; xp: number; journal: { planned: boolean; pnlPence: number; emotionBefore: string }[]; drillsRight: number; goals: number; weakTrack?: string };
export type AiReply = { text: string; table?: { head: string[]; rows: string[][] }; boundary?: boolean; suggest?: string[] };

const BOUNDARY = /\b(should i (buy|sell|invest|trade)|what (stock|coin|share|asset|pair)|which (stock|coin|share|asset|fund|broker)|buy|sell|price target|will .* (go up|go down|rise|fall|moon|crash)|predict|forecast|signal|how much should i (invest|put|risk|deposit)|guaranteed|best (stock|coin|investment)|tip|recommend (a|an|me)|entry|take profit)\b/i;
export const BOUNDARY_TEXT = "I can't do that one — I don't give buy or sell recommendations, name assets, suggest amounts, predict prices or act as an adviser. That's the line that keeps this educational. I can explain how the thing works, walk through the maths, or reflect on your own learning patterns. For decisions about your money, a regulated adviser is the right person.";

type Entry = { k: RegExp; a: string; t?: AiReply["table"]; s?: string[] };
const KB: Entry[] = [
  { k: /\blever(age|aged)?\b|\bmargin\b/, a: "Leverage lets a little of your money control a much larger position. At 10x, £1,000 controls £10,000 — so a 1% market move becomes 10% on your money, up or down. Margin is the collateral you put up. Leverage multiplies risk, not skill; higher leverage shrinks the distance the market must travel to close you out.", t: { head: ["£1,000 at", "Exposure", "5% against you"], rows: [["2x", "£2,000", "−£100"], ["5x", "£5,000", "−£250"], ["10x", "£10,000", "−£500"], ["20x", "£20,000", "−£1,000"]] }, s: ["Try the Leverage tool", "Read: What leverage really borrows"] },
  { k: /position siz|how (big|large|much) (a )?position|\bsizing\b/, a: "Position sizing answers one question before every trade: if I'm wrong, how much do I lose? Decide the risk first — commonly 1% of the account — then size so hitting your stop costs exactly that. Size = money at risk ÷ stop distance. The stop defines the trade; the size scales it.", s: ["Try the Position size tool"] },
  { k: /\bspread\b|\bbid\b|\bask\b/, a: "Every market shows two prices: the bid (what you get if you sell now) and the ask (what you pay to buy now). The gap is the spread — a cost paid the instant you open, which is why a new position often shows a small loss before the price has moved. Spreads widen when fewer people are trading: around news, at the open, on thin markets.", s: ["Read: Bid, ask and the spread"] },
  { k: /stop[- ]?loss|\bstops?\b/, a: "A stop-loss closes a position once it moves against you by a set amount. It fixes your loss in advance, when you're calm. The discipline is leaving it where you put it — moving a stop further away to avoid a loss is how a small planned loss becomes a large unplanned one." },
  { k: /compound|compounding/, a: "Compounding is returns earning returns. £100 growing 5% becomes £105, then the 5% applies to £105. Small differences in rate or time create large differences later; the final years add the most. It works against you too — that's what credit-card interest is.", s: ["Try the Compound interest tool"] },
  { k: /inflation/, a: "Inflation is the rate at which prices rise, so each pound buys a little less. At 3% a year, £10,000 buys what about £7,400 buys today after ten years. Cash earning less than inflation quietly shrinks in buying power — which is why a reserve is kept in cash for safety, and long-term money is often not.", s: ["Try the Inflation tool"] },
  { k: /emergency fund|reserve|rainy day/, a: "An emergency fund is three to six months of essential costs kept somewhere safe and reachable. It's the personal version of Joseph storing a fifth in the good years: it turns emergencies into inconveniences and makes every later decision calm instead of forced.", s: ["Try the Emergency fund tool", "Read: The Economics of Joseph"] },
  { k: /diversif/, a: "Diversification means not depending on one thing. Spreading money across different assets, sectors or regions means one bad outcome doesn't take everything. It doesn't remove risk — markets can fall together — but it removes the risk of a single bet being the whole story." },
  { k: /\bapr\b|interest rate|annual percentage/, a: "APR is the yearly cost of borrowing including most fees, so you can compare loans fairly. A 24.9% APR card charges roughly 2% a month on the balance. Paying only the minimum keeps you paying interest for years — the Loan and Jubilee tools show the real numbers.", s: ["Try the Loan repayment tool"] },
  { k: /net worth/, a: "Net worth is what you own minus what you owe — assets minus liabilities. It's a snapshot, not a scorecard; negative is common early on (student loans, a new mortgage). What matters is the direction over quarters and years.", s: ["Open Wealth Overview"] },
  { k: /\bbudget/, a: "A budget is a map, not a punishment: what comes in, what goes out, when and why. The simplest version is three buckets — essentials, future (saving and debt), and living — decided once on payday rather than fifty times a month." },
  { k: /\bpip\b|\blot\b|\bpips\b/, a: "A pip is the smallest standard price move in a currency pair — usually the fourth decimal (0.0001), or the second for yen pairs. A lot is a standardised trade size (a standard lot is 100,000 units of the base currency; mini and micro lots are smaller). Together they define how much a move is worth in money." },
  { k: /candle|candlestick|chart/, a: "A candlestick shows four prices for a period: open, close, high and low. The body runs from open to close (filled or coloured one way if the close is lower, the other if higher); the thin wicks show the extremes. A chart is a record of what happened — it doesn't tell you what happens next, and anyone who says a pattern guarantees a move is selling something." },
  { k: /\bindex\b|indices|ftse|s&p/, a: "An index is a basket of shares tracked as one number — the FTSE 100 is the 100 largest UK-listed companies, the S&P 500 is 500 large US companies. You can't buy an index directly; funds that track them exist. An index tells you how a whole market did, not any one company." },
  { k: /\bbond|gilt/, a: "A bond is a loan you make to a government or company; they pay interest and return the principal at the end. UK government bonds are gilts. Bond prices fall when interest rates rise, and companies can default — so bonds carry risk too, just a different shape from shares." },
  { k: /\bfund\b|\betf\b|index fund|tracker/, a: "A fund pools many people's money to buy many things at once — shares, bonds or both. An index fund or ETF tracks a market index at low cost. Funds are how diversification becomes practical for ordinary amounts; they still rise and fall with what they hold." },
  { k: /\bfca\b|regulat|authoris/, a: "The FCA regulates financial services in the UK. Firms that give advice, arrange investments or hold client money must be authorised — you can check any firm on the FCA Register. Ten Talents is not authorised and gives no advice; it teaches how things work." },
  { k: /scam|ponzi|fraud|guarantee/, a: "The scam pattern is consistent: a guaranteed or fixed high return, urgency, a personal wallet or 'safe account', and pressure to keep the conversation private. Real investments carry risk and say so. Check the FCA Register, never send money to individuals, and report to Action Fraud.", s: ["Open Money Safety"] },
  { k: /\btalents?\b|parable/, a: "In the Parable of the Talents a master entrusts three servants with capital. Two put it to work and grow it; one buries his in fear and is rebuked. Read as stewardship: what you're given is meant to be developed responsibly. It's our origin story and a moral teaching — not market guidance.", s: ["Read: The Mystery of the Talents"] },
  { k: /joseph|famine|seven years/, a: "Joseph read a forecast of seven good years and seven of famine, and set aside a fifth of the surplus centrally — arguably the first counter-cyclical policy. The personal lesson is the reserve: store in surplus, precisely when it feels least necessary.", s: ["Read: The Economics of Joseph"] },
  { k: /jubilee|debt.?free/, a: "Jubilee was a fifty-year reset of debt, land and ownership. The practical modern version is a debt-freedom plan: list every debt, pay minimums on all, and direct every spare pound at one — smallest first (snowball) for momentum or highest rate first (avalanche) for cost. The Jubilee planner shows the payoff date.", s: ["Open the Jubilee planner"] },
  { k: /\brisk\b/, a: "Risk is the range of outcomes, including the bad ones. Managing it means deciding in advance how much you can lose (position sizing), where you'll accept being wrong (stops), and not concentrating everything in one place (diversification). Risk can be managed; it can't be removed." },
  { k: /streak|xp|level|badge/, a: "XP, levels, streaks and badges reward learning and discipline — lessons, quizzes, scenarios, saving goals, reflections. Nothing in Ten Talents rewards trading activity: no XP for trades, deposits, profit or leverage. Learning is gamified; trading never is." },
  { k: /steward|stewardship/, a: "Stewardship is treating money as something entrusted rather than owned outright — to be developed, protected and shared. In practice: a saving rate, a reserve, honest debt, patient investing you understand, and generosity decided in advance." },
];

export function answer(mode: AiMode, q: string, ctx: AiContext): AiReply {
  const text = q.trim();
  if (BOUNDARY.test(text)) return { text: BOUNDARY_TEXT, boundary: true, suggest: ["Explain leverage", "What is a spread?", "Reflect on my learning"] };

  if (mode === "reflect") {
    const j = ctx.journal; const planned = j.filter((e) => e.planned), impulse = j.filter((e) => !e.planned);
    const rate = (xs: typeof j) => (xs.length ? Math.round((xs.filter((e) => e.pnlPence > 0).length / xs.length) * 100) : null);
    const lines: string[] = [];
    lines.push(`You've completed ${ctx.lessonsDone} of ${ctx.totalLessons} written lessons and hold a ${ctx.streak}-day streak (${ctx.xp.toLocaleString()} XP).`);
    if (j.length >= 3) {
      const pr = rate(planned), ir = rate(impulse);
      if (pr !== null && ir !== null) lines.push(pr >= ir ? `In your journal, planned trades win ${pr}% and impulse trades ${ir}%. The pattern is the lesson: your plan is doing the work.` : `In your journal, impulse trades are winning more (${ir}% vs ${pr}%) — with ${j.length} entries that's more likely luck than edge. Keep logging and watch the trend.`);
      const fomo = j.filter((e) => /fomo|excit|greed|revenge|anx/i.test(e.emotionBefore)).length;
      if (fomo) lines.push(`${fomo} of your trades started from an emotional state you flagged (excitement, FOMO or anxiety). Noticing that before the next one is the whole point of the journal.`);
      if (impulse.length > planned.length) lines.push("More of your trades are impulse than planned — worth revisiting Position Sizing and setting a rule: no trade without a written reason.");
    } else lines.push("Your journal has fewer than three entries, so I can't see a pattern yet. Log trades — planned or impulse, and how you felt — and I'll reflect it back.");
    if (ctx.drillsRight < 3) lines.push("The scenario drills practise judgement under pressure — there are a few you haven't answered well yet.");
    if (ctx.weakTrack) lines.push(`Your least-complete track is ${ctx.weakTrack}. Continuing there is the highest-value next lesson.`);
    if (!ctx.goals) lines.push("You haven't set a savings goal yet. A reserve goal in Build is a good first one.");
    return { text: lines.join(" "), suggest: ["What does my planned-vs-impulse ratio mean?", "Explain position sizing", "Open my journal"] };
  }

  for (const e of KB) if (e.k.test(text)) return { text: mode === "understand" ? e.a + " If you want, I can walk through the numbers with a tool." : e.a, table: e.t, suggest: e.s };
  if (mode === "understand") return { text: "Tell me the chart, term or calculation you're looking at — a candlestick, an APR, a spread, a position size — and I'll explain it in plain language, with the maths if there is any. I won't say what it means for what you should do; that part is yours.", suggest: ["Explain a candlestick", "What is APR?", "How is position size calculated?"] };
  return { text: "I can explain financial, trading, banking and investment concepts, work examples with the tools, or reflect on your learning. Try leverage, spreads, compounding, inflation, diversification, net worth, APR, the parable — or switch to Reflect for a look at your own patterns. No buy/sell advice, ever.", suggest: ["What is leverage?", "Explain compounding", "How do I build an emergency fund?"] };
}
