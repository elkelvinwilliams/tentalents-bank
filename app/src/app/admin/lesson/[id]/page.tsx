import { isAdmin } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import LessonEditor from "@/components/admin/LessonEditor";

export const dynamic = "force-dynamic";

export default async function AdminLesson({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const lesson = (await db.select().from(tables.lessons).where(eq(tables.lessons.id, id)))[0];
  if (!lesson) notFound();
  return (
    <div className="adminshell">
      <div className="adminbar">
        <Link href="/admin">Admin</Link><Link href="/admin/content" className="on">Tracks &amp; lessons</Link>
        <Link href="/admin/glossary">Glossary</Link><Link href="/admin/members">Members</Link>
      </div>
      <h1>Edit lesson</h1>
      <LessonEditor lesson={{ id: lesson.id, title: lesson.title, minutes: lesson.minutes, bodyHtml: lesson.bodyHtml, isFreePreview: lesson.isFreePreview, published: lesson.published }} />
    </div>
  );
}
