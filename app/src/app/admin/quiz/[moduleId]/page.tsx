import { isAdmin } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import QuizBuilder from "@/components/admin/QuizBuilder";

export const dynamic = "force-dynamic";

export default async function AdminQuiz({ params }: { params: Promise<{ moduleId: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { moduleId } = await params;
  const mod = (await db.select().from(tables.modules).where(eq(tables.modules.id, moduleId)))[0];
  if (!mod) notFound();
  const quiz = (await db.select().from(tables.quizzes).where(eq(tables.quizzes.moduleId, moduleId)))[0];
  return (
    <div className="adminshell">
      <div className="adminbar">
        <Link href="/admin">Admin</Link><Link href="/admin/content" className="on">Tracks &amp; lessons</Link>
        <Link href="/admin/glossary">Glossary</Link><Link href="/admin/members">Members</Link>
      </div>
      <h1>Quiz · {mod.name}</h1>
      <p className="sub">Pass mark is 70%. Every answer needs an explanation — the explanations are the lesson.</p>
      <QuizBuilder moduleId={moduleId} initial={quiz?.questions ?? []} />
    </div>
  );
}
