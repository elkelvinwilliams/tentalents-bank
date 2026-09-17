import { currentUser } from "@/lib/auth";
import { getEntitlement, SIGNALS_ENABLED } from "@/lib/entitlements";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Private access page for the Signals add-on. Server-gated: active members
 *  with the add-on only. The product itself ships dark until SIGNALS_ENABLED
 *  is set (legal sign-off filed in 04_COMPLIANCE first). */
export default async function SignalsPage() {
  const user = await currentUser();
  if (!user) redirect("/");
  const ent = await getEntitlement(user.id);
  if (!SIGNALS_ENABLED || !ent.signals) redirect("/");

  const invite = process.env.SIGNALS_TELEGRAM_INVITE ?? "";

  return (
    <div className="shell">
      <div className="topbar">
        <a className="iconbtn" href="/" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 5l-7 7 7 7" /></svg>
        </a>
        <div className="mark"><img className="logo" src="/logo-hand-gold.png" alt="" /><span className="wordmark">Ten Talents</span></div>
        <span style={{ width: 34 }} />
      </div>
      <div className="view">
        <div className="pad"><div className="eyebrow">Members · Signals access</div><h1>Your signals channel</h1></div>
        <div className="notice">
          <b>Read this first.</b> Everything posted in the channel is educational commentary only — it is not
          advice, not a recommendation, and not an instruction to trade. Past performance does not indicate
          future results. Whether you act on anything, and with how much, is entirely your decision and your risk.
        </div>
        <div className="card">
          <h3>Join the private Telegram channel</h3>
          <p>The invite link below is personal to your membership. Don&rsquo;t share it — access is checked against your subscription.</p>
          {invite ? (
            <a className="btn" style={{ marginTop: 14, textDecoration: "none" }} href={invite} rel="noopener noreferrer">Open Telegram invite</a>
          ) : (
            <p style={{ marginTop: 14, color: "var(--gold)" }}>Your invite link appears here shortly after your access is confirmed.</p>
          )}
        </div>
        <div className="card">
          <h3>How access works</h3>
          <p>Keep the add-on active and you stay in the channel. If you remove it or a payment fails past its
            grace period, the invite stops working — your Academy progress is never affected.</p>
        </div>
        <div className="footnote">
          Ten Talents is an education and community business. Nothing here is financial advice, an investment
          recommendation, or an inducement to trade. Investing puts your capital at risk; never risk money you
          cannot afford to lose. For advice about your own circumstances, consult a financial adviser authorised
          by the Financial Conduct Authority.
        </div>
      </div>
    </div>
  );
}
