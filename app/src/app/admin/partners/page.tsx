import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listFirms, nextActions, logoAttribution } from "@/lib/partners-data";
import { rankFirms } from "@/lib/partners-rank";
import PartnersOverview from "@/components/admin/PartnersOverview";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  if (!(await isAdmin())) redirect("/admin");
  const firms = await listFirms(); const actions = await nextActions(); const ranking = await rankFirms(firms);
  return (
    <div className="adminshell wide">
      <div className="adminbar">
        <Link href="/admin">Admin</Link><Link href="/admin/content">Tracks &amp; lessons</Link>
        <Link href="/admin/glossary">Glossary</Link><Link href="/admin/members">Members</Link><Link href="/admin/partners" className="on">Affiliate partnerships</Link>
      </div>
      <h1>Affiliate partnerships</h1>
      <p className="sub">Internal operations. Prospective programmes; nothing here is customer-facing, and nothing here moves money.</p>
      <PartnersOverview firms={firms} actions={actions} ranking={ranking} />
      {logoAttribution() && <p className="faint" style={{ fontSize: 12, marginTop: 24 }}>Logos provided by <a href="https://logo.dev" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Logo.dev</a>.</p>}
    </div>
  );
}
