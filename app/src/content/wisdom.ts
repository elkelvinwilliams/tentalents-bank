/* Wisdom library — Biblical Mysteries and Biblical Wealth.
   Interpretive study: theological views are perspectives, not uncontested fact.
   Nothing here claims scripture predicts prices. Admin editing comes later. */

export type Study = { n: string; title: string; blurb: string; open: boolean; parts: [string, string][] };

const PLACEHOLDER: [string, string][] = [
  ["Scripture", "Full passage in the complete study."],
  ["Context", "Historical and literary context."],
  ["Interpretation", "Perspectives, shown as perspectives."],
  ["Financial principle", "A careful modern lesson."],
  ["Reflection", "Questions for the learner."],
];

export const MYSTERIES: Study[] = [
  {
    n: "01", title: "The Economics of Joseph", open: true,
    blurb: "Seven years of plenty, seven of famine — the first macro-stabilisation policy.",
    parts: [
      ["Scripture", "“Let Pharaoh take a fifth of the produce of Egypt during the seven plentiful years… as a reserve against the seven years of famine.” — Genesis 41"],
      ["Context", "Joseph reads Pharaoh's dreams as a forecast: seven years of abundance, seven of famine. He doesn't stop at prediction — he proposes policy. Egypt stores 20% of the surplus centrally, then redistributes. Arguably the earliest recorded counter-cyclical fiscal policy."],
      ["Interpretation", "Read variously as providence, as wise governance, and more critically as the origin of a grain monopoly that concentrated land and power under Pharaoh. Careful readers hold both: the policy that saved lives also centralised power."],
      ["Financial principle", "The durable idea is the reserve: in surplus years, store against scarcity. Personally, an emergency fund; in a portfolio, deliberate liquidity through the cycle. The discipline is setting it aside while times are good — exactly when it feels least necessary."],
      ["Reflection", "• What is your 20% reserve, and do you set it aside in good months?\n• Joseph acted on a forecast he couldn't prove. How do you prepare for downturns you can't time?\n• When does preparation tip into hoarding, or into concentrating power?"],
    ],
  },
  { n: "02", title: "The Mystery of the Talents", open: false, blurb: "Capital entrusted, stewardship measured, accountability demanded.", parts: PLACEHOLDER },
  { n: "03", title: "The Widow's Oil", open: false, blurb: "Scarcity, one asset, and the mathematics of multiplication.", parts: PLACEHOLDER },
  { n: "04", title: "Jubilee", open: false, blurb: "Debt, land and ownership reset on a 50-year cycle.", parts: PLACEHOLDER },
  { n: "05", title: "Solomon's Economy", open: false, blurb: "Wisdom, trade, taxation and the price of concentrated wealth.", parts: PLACEHOLDER },
  { n: "06", title: "The Rich Fool", open: false, blurb: "Accumulation meets mortality — the parable that prices time.", parts: PLACEHOLDER },
];

export const WEALTH_PRINCIPLES = ["Stewardship", "Diligence", "Saving", "Generosity", "Debt", "Preparation"];
