import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, tables } from "@/db";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminMembers() {
  if (!(await isAdmin())) redirect("/admin");
  const rows = await db.select({
    email: tables.users.email,
    name: tables.users.name,
    createdAt: tables.users.createdAt,
    verified: tables.users.emailVerifiedAt,
    status: tables.entitlements.status,
    signals: tables.entitlements.signalsStatus,
    cancelAtPeriodEnd: tables.entitlements.cancelAtPeriodEnd,
    periodEnd: tables.entitlements.currentPeriodEnd,
    lessons: sql<number>`(select count(*) from lesson_progress lp where lp.user_id = ${tables.users.id})`,
  }).from(tables.users)
    .leftJoin(tables.entitlements, eq(tables.entitlements.userId, tables.users.id))
    .orderBy(desc(tables.users.createdAt));

  const label = (s: string | null, cape: boolean) =>
    !s || s === "none" ? "Free" :
    s === "active" || s === "trialing" ? (cape ? "Active · cancels at period end" : "Active") :
    s === "past_due" ? "Past due (grace)" : "Canceled";

  return (
    <div className="adminshell">
      <div className="adminbar">
        <Link href="/admin">Admin</Link><Link href="/admin/content">Tracks &amp; lessons</Link>
        <Link href="/admin/glossary">Glossary</Link><Link href="/admin/members" className="on">Members</Link>
      </div>
      <h1>Members</h1>
      <p className="sub">{rows.length} accounts. Plan status comes from Stripe webhooks — this page never edits it.</p>
      <table className="atable" style={{ marginTop: 16 }}>
        <thead><tr><th>Email</th><th>Name</th><th>Plan</th><th>Signals</th><th>Lessons</th><th>Joined</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.email}>
              <td>{r.email}{!r.verified && <span style={{ color: "var(--risk)", fontSize: 12 }}> · unverified</span>}</td>
              <td>{r.name || "—"}</td>
              <td>{label(r.status, !!r.cancelAtPeriodEnd)}{r.periodEnd && r.cancelAtPeriodEnd ? ` (${r.periodEnd.toLocaleDateString("en-GB")})` : ""}</td>
              <td>{label(r.signals, false)}</td>
              <td>{r.lessons}</td>
              <td>{r.createdAt.toLocaleDateString("en-GB")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
