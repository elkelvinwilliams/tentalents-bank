import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, tables } from "@/db";
import { asc } from "drizzle-orm";
import Link from "next/link";
import ContentTree from "@/components/admin/ContentTree";

export const dynamic = "force-dynamic";

export default async function AdminContent() {
  if (!(await isAdmin())) redirect("/admin");
  const [ts, ms, ls, qs] = await Promise.all([
    db.select().from(tables.tracks).orderBy(asc(tables.tracks.position)),
    db.select().from(tables.modules).orderBy(asc(tables.modules.position)),
    db.select({ id: tables.lessons.id, moduleId: tables.lessons.moduleId, title: tables.lessons.title, minutes: tables.lessons.minutes, isFreePreview: tables.lessons.isFreePreview, published: tables.lessons.published, position: tables.lessons.position }).from(tables.lessons).orderBy(asc(tables.lessons.position)),
    db.select({ id: tables.quizzes.id, moduleId: tables.quizzes.moduleId }).from(tables.quizzes),
  ]);
  const data = ts.map((t) => ({
    ...t,
    modules: ms.filter((m) => m.trackId === t.id).map((m) => ({
      ...m,
      lessons: ls.filter((l) => l.moduleId === m.id),
      hasQuiz: qs.some((q) => q.moduleId === m.id),
    })),
  }));
  return (
    <div className="adminshell">
      <div className="adminbar">
        <Link href="/admin">Admin</Link><Link href="/admin/content" className="on">Tracks &amp; lessons</Link>
        <Link href="/admin/glossary">Glossary</Link><Link href="/admin/members">Members</Link>
      </div>
      <h1>Tracks &amp; lessons</h1>
      <p className="sub">Order here is the order learners see. Unpublished items are hidden from the app instantly.</p>
      <ContentTree data={data} />
    </div>
  );
}
