/* Ten Talents — site config.
   TT_APP_URL: where "Open the Academy" goes. Until the app is deployed it is the
   single-file prototype at academy/. After deploying to Vercel, set it to the app URL,
   e.g. "https://ten-talents-academy.vercel.app/" — every Academy link and the old
   prototype's redirect follow this one line. */
window.TT_APP_URL = "https://tentalents-bank.vercel.app/";

/* Broker partners shown in the homepage Partnerships section: firms Ten Talents has affiliate agreements with
   (founder-confirmed, 24 Oct 2026). A name-only entry shows the broker's name. Add `url` (the referral link the broker
   has approved) and `risk` (the broker's required risk warning) only once the broker has approved them; the name then
   becomes a link marked as an affiliate link. Use logos only from a broker's approved marketing materials.
   { name: "Broker", url: "https://approved-referral-link", risk: "Required risk warning from the broker" } */
window.TT_BROKERS = [
  { name: "Vantage" },
  { name: "Exness" },
  { name: "Axi" },
  { name: "Pepperstone" },
  { name: "XM" }
];

