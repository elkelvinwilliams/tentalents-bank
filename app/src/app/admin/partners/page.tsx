import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listFirms, nextActions } from "@/lib/partners-data";
import PartnersOverview from "@/components/admin/PartnersOverview";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  if (!(await isAdmin())) redirect("/admin");
  const [firms, actions] = await Promise.all([listFirms(), nextActions()]);
  return (
    <div className="adminshell wide">
      <div className="adminbar">
        <Link href="/admin">Admin</Link><Link href="/admin/content">Tracks &amp; lessons</Link>
        <Link href="/admin/glossary">Glossary</Link><Link href="/admin/members">Members</Link><Link href="/admin/partners" className="on">Affiliate partnerships</Link>
      </div>
      <h1>Affiliate partnerships</h1>
      <p className="sub">Internal operations. Five prospective programmes; nothing here is customer-facing, and nothing here moves money.</p>
      <PartnersOverview firms={firms} actions={actions} />
    </div>
  );
}
