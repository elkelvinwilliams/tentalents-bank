/* Ten Talents — site config.
   TT_APP_URL: where "Open the Academy" goes. Until the app is deployed it is the
   single-file prototype at academy/. After deploying to Vercel, set it to the app URL,
   e.g. "https://ten-talents-academy.vercel.app/" — every Academy link and the old
   prototype's redirect follow this one line. */
window.TT_APP_URL = "https://tentalents-bank.vercel.app/";

/* Broker partners shown in the homepage Partnerships section: firms Ten Talents has affiliate agreements with
   (founder-confirmed, 24 Oct 2026). Axi is not listed: its application is still awaiting approval (founder,
   25 Oct); add { name: "Axi", logo: "assets/img/brokers/axi.png" } back once Axi approves.
   A name-only entry shows the broker's name. Add `url` (the referral link the broker
   has approved) and `risk` (the broker's required risk warning) only once the broker has approved them; the name then
   becomes a link marked as an affiliate link. Use logos only from a broker's approved marketing materials.
   { name: "Broker", url: "https://approved-referral-link", risk: "Required risk warning from the broker" }
   Logos: `logo` is a file in assets/img/brokers/ (use the broker's approved file when you have it); otherwise `domain`
   is fetched through the Ten Talents app from Logo.dev (key held in Vercel; the app must allow that domain). A logo
   that fails to load is removed and the name shows on its own. */
window.TT_LOGO_ENDPOINT = window.TT_APP_URL.replace(/\/?$/, "/") + "api/logo/";
window.TT_BROKERS = [
  { name: "Vantage", domain: "vantagemarkets.com" },
  { name: "Exness", domain: "exness.com" },
  { name: "Pepperstone", domain: "pepperstone.com" },
  { name: "XM", domain: "xm.com" }
];

