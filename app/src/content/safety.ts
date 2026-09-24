/* Money Safety — topics and Spot-the-Scam scenarios. Completion earns learning XP only. */
import type { Drill } from "./drills";

export const SAFETY_TOPICS: { id: string; title: string; body: string; signs: string[] }[] = [
  { id: "phishing", title: "Phishing", body: "Messages that look like your bank, HMRC or a broker, designed to make you click or type a password.", signs: ["Urgency: 'act now or lose access'", "Links that don't match the real domain", "Requests for full passwords or codes — real firms never ask"] },
  { id: "scams", title: "Investment scams", body: "Offers of returns that are high, fixed and guaranteed. Real investments carry risk and say so.", signs: ["'Guaranteed' or 'risk-free' anything", "Monthly returns above a few percent", "Pressure to decide today"] },
  { id: "brokers", title: "Fake brokers", body: "Slick platforms that show profits you can never withdraw. Always check the FCA Register before sending a penny.", signs: ["Not on the FCA Register, or a cloned firm's details", "Withdrawal 'fees' and 'taxes' before you can take money out", "Account managers who push deposits"] },
  { id: "impersonation", title: "Impersonation", body: "Someone pretending to be Ten Talents, your bank or a known trader. Ten Talents will never ask you to send money to invest.", signs: ["New number or profile claiming to be someone you know", "Requests to move the conversation to a private channel", "Personal wallet or account details for 'investment'"] },
  { id: "ponzi", title: "Ponzi schemes", body: "Early investors are paid with new investors' money until it collapses. Returns look real right up to the end.", signs: ["Consistent returns regardless of markets", "Recruitment rewarded", "Vague or secret strategy"] },
  { id: "social", title: "Social-media investment scams", body: "Screenshots of gains, luxury lifestyles and DMs offering to 'manage your account'.", signs: ["Screenshots as proof — they're free to fake", "'Account management' by strangers", "Testimonials you can't verify"] },
  { id: "passwords", title: "Password security", body: "Long, unique passwords per account and a password manager beat clever ones you reuse.", signs: ["Same password on two sites", "Passwords shared in chat", "No two-factor authentication on money accounts"] },
  { id: "accounts", title: "Account security", body: "Two-factor authentication, login alerts and checking statements are the seatbelts of money.", signs: ["Unknown devices in your login history", "Small unexplained transactions", "Emails about changes you didn't make"] },
  { id: "personal", title: "Protecting personal information", body: "Date of birth, address, ID photos and account numbers are the raw material of fraud.", signs: ["Forms asking for more than the task needs", "ID photos sent over chat", "'Verification' requests out of the blue"] },
];

export const SCAM_SCENARIOS: Drill[] = [
  { id: "s-whatsapp", title: "The WhatsApp trader", body: "You receive a WhatsApp message from someone claiming to be a professional trader. They guarantee 20% monthly returns and ask you to send £2,000 to their personal crypto wallet.",
    options: [
      { text: "Send £500 to test it first", why: "A 'test' is exactly what the scam is built for: it pays out once so you send more. Guaranteed monthly returns do not exist." },
      { text: "Ask for proof of past results", why: "Screenshots are free to fake. Proof that would satisfy you is proof they can manufacture." },
      { text: "Don't send anything; check the FCA Register and report the number", why: "Safer. Guaranteed returns + personal wallet + urgency is the complete scam pattern. Report it to Action Fraud." },
      { text: "Send it — they seem professional", why: "Professional presentation is the product they're selling. The money is gone the moment it leaves." }], best: 2 },
  { id: "s-bank", title: "The bank call", body: "Someone calls from 'your bank's fraud team'. They know your name and last four digits, say your account is compromised, and ask you to move your money to a 'safe account' now.",
    options: [
      { text: "Move the money — they knew my details", why: "Partial details are easy to obtain. Banks never ask you to move money to a 'safe account'. Ever." },
      { text: "Hang up and call the bank on the number on your card", why: "Safer. Use a different phone if you can — scammers can hold the line open." },
      { text: "Give them the one-time code to 'verify' you", why: "The code authorises a payment. Giving it is giving them the money." }], best: 1 },
  { id: "s-platform", title: "The platform that won't pay", body: "A trading platform shows your £3,000 has grown to £9,400. When you try to withdraw, you're told to pay a £700 'tax' first.",
    options: [
      { text: "Pay the tax — it's a small price for £9,400", why: "There is no £9,400. The 'tax' is the second theft, and there will be a third." },
      { text: "Stop, don't pay, gather every message and report it", why: "Safer. Real brokers deduct fees from the balance; they never demand payment to release your own money." },
      { text: "Deposit more to reach a 'VIP tier' with free withdrawals", why: "Tiers, bonuses and unlocks are how fake brokers extract more." }], best: 1 },
  { id: "s-impersonation", title: "The message 'from Ten Talents'", body: "A new Instagram account with the Ten Talents logo messages you: 'Congratulations — you've been selected for our private investment pool. Minimum £1,000. Reply for wallet details.'",
    options: [
      { text: "Reply for details — it has the logo", why: "Logos are copied in seconds. Ten Talents never asks anyone to send money to invest; anyone who does is not us." },
      { text: "Report the account and check the real links on tentalents site", why: "Safer. Our only channels are listed on the website; we have no 'private investment pool'." },
      { text: "Ask them to prove it by sending a small amount first", why: "Any money that arrives is bait." }], best: 1 },
  { id: "s-friend", title: "The friend's screenshots", body: "A friend posts screenshots of a £12,000 gain in three weeks and says their 'mentor' will manage your account too for a share of profits.",
    options: [
      { text: "Join — my friend wouldn't lie", why: "Your friend may not be lying; they may be the next victim, or paid to recruit. Recruitment is a Ponzi tell." },
      { text: "Decline; if you want to learn, learn — nobody should manage your account from a DM", why: "Safer. 'Managed accounts' from strangers are unregulated at best and theft at worst." },
      { text: "Ask the mentor for a smaller share of profits", why: "Negotiating the terms of a scam still ends in a scam." }], best: 1 },
];
