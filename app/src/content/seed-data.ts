/* ============================================================
   Seed content — ported VERBATIM from /academy/index.html
   (the prototype is the contract; do not edit copy here without
   showing the founder a diff first)
   ============================================================ */

export const QUESTIONS: [string, string[]][] = [
  ["What best describes you right now?", ["Complete beginner", "I know a little", "I've tried trading before"]],
  ["How much time can you give to learning each week?", ["Under 1 hour", "1 to 3 hours", "More than 3 hours"]],
  ["What draws you to the markets?", ["Extra income", "Financial freedom", "Learning a new skill", "Understanding how markets work"]],
  ["Which markets interest you most?", ["Forex", "Gold and commodities", "Indices", "Stocks", "I'm not sure yet"]],
  ["Have you traded with real money before?", ["Never", "A little, on a demo", "Yes, and I lost money", "Yes, and I'm still going"]],
  ["What gets in your way most?", ["I don't know where to start", "I can't read charts", "I keep breaking my own rules", "I don't have much time"]],
  ["How do you learn best?", ["Reading at my own pace", "Short lessons with quizzes", "Worked examples", "Watching, then doing"]],
  ["How would you describe your risk tolerance?", ["Cautious", "Balanced", "Comfortable with swings", "I don't know yet"]],
  ["What would make the next six months a success?", ["Understanding the basics properly", "Building a repeatable routine", "Passing an evaluation", "Losing less than I do now"]],
  ["How did you hear about Ten Talents?", ["A friend", "Telegram", "Social media", "Search", "Somewhere else"]],
];

// [iconKey, title, body]
export const TOUR: [string, string, string][] = [
  ["seed", "Ten Talents Academy", "Four tracks, built in order: money first, then markets, then risk, then building something of your own. Worked through, not skimmed."],
  ["stack", "Four tracks, in order", "Money Foundations first. Each track builds on the one before it, so nothing arrives before you're ready for it."],
  ["book", "Lessons that stay with you", "Short reads with worked examples and a takeaways box at the end of every lesson. Learn on the train, not at a desk."],
  ["check", "Quizzes that teach", "Every answer comes with an explanation of why it's right. Pass at 70%. Retake as often as you like."],
  ["cap", "Earn your certificates", "Finish a track and take away a certificate in your name."],
  ["chart", "See your progress", "Your place is saved. Pick up where you stopped, and watch the tracks fill in."],
  ["sim", "A simulator is coming", "Practise on a simulated account with no real money at stake. Not in this version — we're building the teaching first."],
  ["shield", "One thing before you start", "This is education, not advice. Nothing here tells you what to buy or sell, and nobody here manages money for you."],
];

export const GLOSSARY: [string, string][] = [
  ["Ask", "The price you pay to buy. Always the higher of the two prices quoted."],
  ["Bid", "The price you receive when you sell. Always the lower of the two."],
  ["Spread", "The gap between bid and ask. It is the cost of entering a position, and you pay it the moment you open."],
  ["Pip", "The standard smallest price move in a currency pair. On most pairs it is the fourth decimal place."],
  ["Leverage", "Borrowed exposure. It multiplies the size of your position relative to your own money, and multiplies losses just as fast as gains."],
  ["Margin", "The money set aside to hold a leveraged position open. It is not a fee; it is collateral."],
  ["Margin call", "A demand for more collateral when losses eat into your margin. Ignore it and positions get closed for you."],
  ["Stop loss", "An instruction to close a position once it has moved against you by a set amount. It defines your loss before you take the trade."],
  ["Take profit", "An instruction to close a position once it has moved in your favour by a set amount."],
  ["R multiple", "A way of measuring a result in units of risk. Risking £100 and making £300 is a 3R win."],
  ["Drawdown", "The fall from a peak in account value to the following trough, usually stated as a percentage."],
  ["Liquidity", "How easily something can be bought or sold without moving its price. Thin liquidity means wider spreads and sharper moves."],
  ["Slippage", "The difference between the price you expected and the price you got. Most common around news and at the open."],
  ["Volatility", "How much a price moves over a period. High volatility means bigger moves in both directions, not just up."],
  ["Support", "A price area where buying has previously been strong enough to stop a fall."],
  ["Resistance", "A price area where selling has previously been strong enough to stop a rise."],
  ["Position size", "How much you buy or sell. The single biggest lever you have over risk."],
  ["Long", "A position that gains value if the price rises."],
  ["Short", "A position that gains value if the price falls."],
];

export const L1 = `
<p>Every market quotes two prices at once, not one. If you have only ever seen a single number on a news ticker, this is the first thing to unlearn.</p>
<p>Say gold is quoted at <b>2,412.30 / 2,412.60</b>. The lower number is the <b>bid</b>: what you get if you sell right now. The higher number is the <b>ask</b>: what you pay if you buy right now. The gap between them, thirty cents here, is the <b>spread</b>.</p>
<figure>
  <div class="spreadbar"><div class="b">bid<br>2,412.30</div><div class="s">spread<br>0.30</div><div class="a">ask<br>2,412.60</div></div>
  <figcaption>You sell at the left edge and buy at the right edge. You never trade at the middle.</figcaption>
</figure>
<h2>Why this matters on your very first trade</h2>
<p>Buy gold at 2,412.60 and the position is immediately worth 2,412.30, because that is what you would get for selling it back. You are down the spread the instant you open. The price has to move in your favour by thirty cents just to get you level.</p>
<p>That sounds trivial on one trade. Take twenty trades a week and the spread becomes one of the largest, quietest costs in your account. It is also why a strategy that takes small profits repeatedly is far harder to run than it looks on paper: the cost stays the same while the target shrinks.</p>
<h2>What moves the spread</h2>
<p>Spreads are not fixed. They widen when fewer people are willing to trade, which is exactly when most beginners are most active: around major news, at the daily open and close, and on thinly traded instruments. A pair that costs you half a pip at midday in London can cost several pips in the seconds after an interest rate decision.</p>
<p>So the practical habit is simple. Before you take a position, look at the spread as it is right now, not as it usually is. If it has widened, whatever edge you thought you had may already have been spent.</p>
<div class="takeaways"><h3>Take away</h3><ul>
<li>Bid is what you sell at, ask is what you buy at, and the gap is the spread.</li>
<li>You pay the spread on entry, so every position starts slightly negative.</li>
<li>Spreads widen when liquidity thins out, especially around news.</li>
<li>The more often you trade, the more the spread decides your results.</li>
</ul></div>`;

export const L2 = `
<p>A trade needs two sides. When you buy, somebody sells. It is worth knowing who that somebody usually is, because it explains a great deal about why prices behave as they do.</p>
<h2>Four groups, four motives</h2>
<p><b>Hedgers</b> are not trying to profit from the price at all. An airline buying fuel forward and a manufacturer locking in a currency rate both want certainty rather than gain. They will happily accept a worse price for a known outcome, and they trade on a schedule rather than on a chart.</p>
<p><b>Institutions</b> move size that cannot be executed in one go. A fund unwinding a large position will work it over hours or days, which is why strong moves often continue further than seems reasonable, and why prices sometimes grind steadily in one direction with no news attached.</p>
<p><b>Market makers</b> quote both sides continuously and earn the spread. They are not betting on direction; they are managing inventory. They want volume, and they widen their quotes when uncertainty makes holding inventory dangerous.</p>
<p><b>Retail traders</b> are the smallest group by volume and the least coordinated. That is the group you are in.</p>
<h2>What follows from this</h2>
<p>Two things. First, the market is not a single opponent with a plan. It is a crowd with conflicting motives, some of whom are not even trying to win in the way you are. The idea that price is hunting you personally is a story people tell themselves after a loss.</p>
<p>Second, your edge cannot come from size, speed, or information: institutions beat you on all three. If you have an edge at all, it comes from discipline and patience, because you are free to wait and they often are not. That is a real advantage, and it is the only one this course can help you build.</p>
<div class="takeaways"><h3>Take away</h3><ul>
<li>Your counterparty is often a hedger or a market maker with no view on direction.</li>
<li>Large orders get worked over time, which is why trends persist.</li>
<li>You cannot compete on size, speed or information.</li>
<li>Being free to do nothing is the retail trader's one structural advantage.</li>
</ul></div>`;

export const QUIZ1: { q: string; options: string[]; correct: number; why: string }[] = [
  {
    q: "Gold is quoted at 2,412.30 / 2,412.60. You want to buy. Which price do you pay?",
    options: ["2,412.30", "2,412.60", "The midpoint, 2,412.45", "Whichever is closer to the last traded price"],
    correct: 1,
    why: "You always buy at the higher price, the ask. The bid is what you would receive if you were selling instead. Nobody trades at the midpoint.",
  },
  {
    q: "You open a position and the price has not moved at all. Why is the position showing a small loss?",
    options: ["A commission has been charged", "The broker has repriced the trade", "You bought at the ask and it is valued at the bid", "Overnight financing has been applied"],
    correct: 2,
    why: "You entered at the ask and the position is marked at the bid, so it starts down by the spread. The price has to move in your favour by that much before you break even.",
  },
  {
    q: "When would you most expect the spread to widen?",
    options: ["Mid-morning in London on a quiet day", "Immediately after a central bank rate decision", "When a price has been flat for an hour", "At the start of a long-term trend"],
    correct: 1,
    why: "Spreads widen when liquidity thins and uncertainty rises. A rate decision does both at once, which is why costs are at their worst in the moments that feel most exciting.",
  },
  {
    q: "Why does taking many small profits make the spread more important?",
    options: ["Brokers charge more on small trades", "The cost stays the same while the target shrinks", "Small trades are filled more slowly", "Spreads are wider on small positions"],
    correct: 1,
    why: "The spread is roughly constant per trade. As your profit target gets smaller, that fixed cost eats a larger share of it, so a high-frequency approach needs a much better strike rate to survive.",
  },
  {
    q: "Which is the retail trader's genuine structural advantage over an institution?",
    options: ["Faster execution", "Better information", "Lower costs per trade", "No obligation to trade at all"],
    correct: 3,
    why: "Funds often must deploy or unwind capital on a timetable. You can sit out for weeks with no consequence. Patience is the one edge that size cannot take from you.",
  },
];

export type SeedLesson = { id: string; title: string; mins: number; body?: string; free?: boolean };
export type SeedModule = { id: string; name: string; lessons: SeedLesson[]; quiz: typeof QUIZ1 | null };
export type SeedTrack = { id: string; name: string; blurb: string; modules: SeedModule[] };

export const TRACKS: SeedTrack[] = [
  {
    id: "t1", name: "Money Foundations",
    blurb: "Income, spending, saving, debt, compounding, inflation. The machinery underneath everything else.",
    modules: [
      { id: "m1", name: "Where money goes", lessons: [{ id: "l1", title: "Income, spending and the gap between them", mins: 0 }, { id: "l2", title: "Why saving is a rate, not an amount", mins: 0 }], quiz: null },
      { id: "m2", name: "Debt", lessons: [{ id: "l1", title: "Good debt, bad debt and the honest test", mins: 0 }, { id: "l2", title: "What interest costs over time", mins: 0 }], quiz: null },
      { id: "m3", name: "Compounding and inflation", lessons: [{ id: "l1", title: "The arithmetic of patience", mins: 0 }, { id: "l2", title: "Inflation, the quiet tax", mins: 0 }], quiz: null },
    ],
  },
  {
    id: "t2", name: "How Markets Work",
    blurb: "What is actually being bought and sold, who the players are, and why prices move.",
    modules: [
      { id: "m1", name: "How a price is made", lessons: [{ id: "l1", title: "Bid, ask and the spread", mins: 6, body: L1, free: true }, { id: "l2", title: "Who is on the other side of your trade", mins: 7, body: L2 }], quiz: QUIZ1 },
      { id: "m2", name: "The instruments", lessons: [{ id: "l1", title: "Stocks, bonds and funds", mins: 0 }, { id: "l2", title: "Currencies and commodities", mins: 0 }], quiz: null },
      { id: "m3", name: "Sessions and liquidity", lessons: [{ id: "l1", title: "The three trading sessions", mins: 0 }], quiz: null },
    ],
  },
  {
    id: "t3", name: "Understanding Risk",
    blurb: "Why most short-term traders lose, what leverage really does, and how to recognise when you are being sold to.",
    modules: [
      { id: "m1", name: "Leverage and margin", lessons: [{ id: "l1", title: "What leverage really borrows", mins: 0 }, { id: "l2", title: "Margin, and how it gets called", mins: 0 }], quiz: null },
      { id: "m2", name: "Position sizing", lessons: [{ id: "l1", title: "Sizing from the stop, not the balance", mins: 0 }], quiz: null },
      { id: "m3", name: "Being sold to", lessons: [{ id: "l1", title: "Reading a promise for what it is", mins: 0 }], quiz: null },
    ],
  },
  {
    id: "t4", name: "Building Something",
    blurb: "Entrepreneurship as a talent developed: skills, small bets, first customers, and the fundamentals that compound.",
    modules: [
      { id: "m1", name: "Small bets", lessons: [{ id: "l1", title: "Risking time before money", mins: 0 }], quiz: null },
      { id: "m2", name: "First customers", lessons: [{ id: "l1", title: "Selling before building", mins: 0 }], quiz: null },
    ],
  },
];
