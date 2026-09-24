/* Wealth Builder journey — seven stages. Each stage: explanation, 2–4 lessons (Academy
   lesson ids where written, otherwise titles marked coming), one tool, one scenario.
   Nothing here implies everyone must invest or that investing guarantees wealth. */
import type { Drill } from "./drills";

export type Stage = {
  id: string; name: string; tag: string; explain: string;
  lessons: { title: string; lessonId?: string }[];
  tool: string; // tool id from calcs.ts
  scenario: Drill;
};

export const JOURNEY: Stage[] = [
  { id: "earn", name: "Earn", tag: "Income is the engine", explain: "Everything starts with what comes in — wages, a side income, a business. Understanding your income honestly, including how steady it is, is the first act of stewardship.",
    lessons: [{ title: "Income, spending and the gap between them", lessonId: "t1-m1-l1" }, { title: "Why saving is a rate, not an amount", lessonId: "t1-m1-l2" }, { title: "Risking time before money", lessonId: "t4-m1-l1" }],
    tool: "savings",
    scenario: { id: "j-earn", title: "A pay rise arrives", body: "Your income goes up by £200 a month. What's the stewardship move?", options: [
      { text: "Let spending rise to meet it", why: "Lifestyle creep quietly absorbs every rise. Nothing wrong with enjoying it — but decide first." },
      { text: "Decide the split before it lands: some to savings, some to living", why: "Right. A rise is the easiest money you'll ever save, because you never got used to spending it." },
      { text: "Put it all into a trading account", why: "Skipping the reserve to trade is the classic order-of-operations mistake." }], best: 1 } },
  { id: "manage", name: "Manage", tag: "Know where it goes", explain: "A budget is not a punishment; it's a map. Managing money means knowing what leaves, when, and why — so decisions are made once, calmly, not fifty times a month.",
    lessons: [{ title: "Good debt, bad debt and the honest test", lessonId: "t1-m2-l1" }, { title: "What interest costs over time", lessonId: "t1-m2-l2" }],
    tool: "loan",
    scenario: { id: "j-manage", title: "The card balance", body: "A credit card is at £1,800 on 24.9% APR and you're paying the minimum. A friend suggests a 0% balance-transfer card. You?", options: [
      { text: "Ignore it — the minimum is fine", why: "Minimums are designed to keep you paying. At 24.9% the interest alone is roughly £37 a month." },
      { text: "Check the transfer fee and the 0% period, then plan to clear it before the rate ends", why: "Right. A 0% transfer helps only with a plan to finish before it expires — and no new spending on the old card." },
      { text: "Take a bigger loan to pay it and have money left over", why: "Borrowing more to 'have money left over' grows the debt, not the plan." }], best: 1 } },
  { id: "save", name: "Save", tag: "Pay the future first", explain: "Saving is a rate you set, not what's left at the end. Automate it on payday and the future stops competing with the present.",
    lessons: [{ title: "The arithmetic of patience", lessonId: "t1-m3-l1" }, { title: "Inflation, the quiet tax", lessonId: "t1-m3-l2" }],
    tool: "compound",
    scenario: { id: "j-save", title: "Saving what's left", body: "You save whatever remains at month end. Some months £300, some months nothing. Better approach?", options: [
      { text: "Keep going — it averages out", why: "It rarely does. 'What's left' shrinks to fit the month." },
      { text: "Move a fixed amount on payday, even if smaller", why: "Right. A fixed transfer on payday makes saving the first bill, not the last hope." },
      { text: "Stop saving until income is higher", why: "Waiting for 'more' is how years pass. The habit matters more than the amount." }], best: 1 } },
  { id: "protect", name: "Protect", tag: "Reserve before risk", explain: "Joseph stored a fifth in the good years. An emergency reserve — three to six months of essentials — is what makes every later decision calm instead of forced.",
    lessons: [{ title: "The Economics of Joseph (Wisdom)", }, { title: "Reading a promise for what it is", lessonId: "t3-m3-l1" }],
    tool: "emergency",
    scenario: { id: "j-protect", title: "The boiler breaks", body: "A £900 repair, no reserve, and a 'guaranteed 15% a month' opportunity in your inbox the same week. You?", options: [
      { text: "Use the opportunity to make the £900 back fast", why: "Guaranteed monthly returns are the signature of a scam. This is how emergencies become disasters." },
      { text: "Pay the repair, then start a reserve — even £50 a month", why: "Right. Deal with reality, then build the buffer so next time isn't a crisis." },
      { text: "Put it on the card and forget it", why: "Debt for emergencies is sometimes unavoidable — but 'forget it' is how it compounds." }], best: 1 } },
  { id: "invest", name: "Invest", tag: "Understand it first", explain: "Investing is putting money to work over years, accepting risk you understand. It is not required of everyone, it guarantees nothing, and it comes after a reserve — never instead of one.",
    lessons: [{ title: "Bid, ask and the spread", lessonId: "t2-m1-l1" }, { title: "Who is on the other side of your trade", lessonId: "t2-m1-l2" }, { title: "Stocks, bonds and funds", lessonId: "t2-m2-l1" }],
    tool: "growth",
    scenario: { id: "j-invest", title: "First £1,000", body: "You have a reserve and £1,000 you won't need for years. A colleague is up 60% on a single coin and says it's a sure thing. You?", options: [
      { text: "Follow the colleague — they're clearly right", why: "Past gains, one asset, 'sure thing': three warning signs in one sentence." },
      { text: "Learn what you'd be buying, spread the risk, and only invest what you can leave alone", why: "Right. Understanding, diversification and time horizon — none of them exciting, all of them the point." },
      { text: "Borrow to invest more since it's a sure thing", why: "Leverage on a 'sure thing' is how people lose money they never had." }], best: 1 } },
  { id: "build", name: "Build", tag: "Create something", explain: "Building is enterprise: a business, a property, a skill that earns. It's the parable's servant trading with what he was given — small bets, real customers, patience.",
    lessons: [{ title: "Risking time before money", lessonId: "t4-m1-l1" }, { title: "Selling before building", lessonId: "t4-m2-l1" }],
    tool: "networth",
    scenario: { id: "j-build", title: "The business idea", body: "You want to start a product business and have £5,000 saved beyond your reserve. Where does the first pound go?", options: [
      { text: "A logo, a website and 500 units of stock", why: "Spending before selling. Most of the £5,000 goes on things customers didn't ask for." },
      { text: "Ten conversations and a small pre-sale to real customers", why: "Right. Sell before you build; let customers fund the stock." },
      { text: "A course promising a six-figure launch", why: "Courses that promise outcomes are selling the dream, not the business." }], best: 1 } },
  { id: "give", name: "Give", tag: "Wealth that builds more than wealth", explain: "Generosity is the end of the journey and the reason for it. Giving — of money, time and talent — is stewardship's proof that the money was never the point.",
    lessons: [{ title: "The Parable of the Talents (Wisdom)" }, { title: "The Widow's Oil (Wisdom)" }],
    tool: "savings",
    scenario: { id: "j-give", title: "The giving question", body: "Income is steady, the reserve is built, debts are managed. How does giving fit?", options: [
      { text: "Give whatever is left at year end", why: "Like saving, 'what's left' tends to be nothing. Generosity planned is generosity that happens." },
      { text: "Decide a percentage and give it first, like the saving rate", why: "Right. A decided percentage makes giving a habit rather than a mood." },
      { text: "Wait until wealthy to start", why: "Generosity is a practice, not a threshold. Those who give little give more later." }], best: 1 } },
];
