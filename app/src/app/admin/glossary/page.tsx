import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, tables } from "@/db";
import { asc } from "drizzle-orm";
import Link from "next/link";
import GlossaryEditor from "@/components/admin/GlossaryEditor";

export const dynamic = "force-dynamic";

export default async function AdminGlossary() {
  if (!(await isAdmin())) redirect("/admin");
  const terms = await db.select().from(tables.glossaryTerms).orderBy(asc(tables.glossaryTerms.position));
  return (
    <div className="adminshell">
      <div className="adminbar">
        <Link href="/admin">Admin</Link><Link href="/admin/content">Tracks &amp; lessons</Link>
        <Link href="/admin/glossary" className="on">Glossary</Link><Link href="/admin/members">Members</Link>
      </div>
      <h1>Glossary</h1>
      <GlossaryEditor terms={terms} />
    </div>
  );
}
