export const metadata = { title: "Offline · Ten Talents Academy" };

export default function Offline() {
  return (
    <div className="shell"><div className="splash" style={{ justifyContent: "center", textAlign: "center", padding: "0 28px" }}>
      <div className="mark"><img src="/logo-hand-gold.png" alt="" style={{ height: 64 }} /></div>
      <div className="eyebrow" style={{ marginTop: 16 }}>Ten Talents Academy</div>
      <h1 style={{ color: "#fff", marginTop: 12 }}>You&rsquo;re offline</h1>
      <p className="sub" style={{ marginTop: 10 }}>Your progress is safe on your account. Reconnect and pull down to refresh, or tap below.</p>
      <a className="btn" style={{ marginTop: 22 }} href="/">Try again</a>
    </div></div>
  );
}
