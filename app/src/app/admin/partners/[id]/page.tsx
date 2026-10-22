import { isAdmin } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { loadWorkspace } from "@/lib/partners-data";
import PartnerWorkspace from "@/components/admin/PartnerWorkspace";

export const dynamic = "force-dynamic";

export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const ws = await loadWorkspace(id);
  if (!ws) notFound();
  return (
    <div className="adminshell wide">
      <div className="adminbar">
        <Link href="/admin">Admin</Link><Link href="/admin/partners">Affiliate partnerships</Link><span style={{ color: "var(--faint)" }}>/</span><span style={{ color: "var(--ink)", fontWeight: 600 }}>{ws.firm.name}</span>
      </div>
      <PartnerWorkspace ws={ws} />
    </div>
  );
}
