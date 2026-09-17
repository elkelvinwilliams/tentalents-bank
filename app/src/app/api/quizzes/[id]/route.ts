import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { currentUser, nid } from "@/lib/auth";
import { getEntitlement } from "@/lib/entitlements";

/* Quiz play, server-authoritative:
   GET    -> questions with options only (correct answers never leave the server)
   POST { i, n }            -> per-question verdict + explanation
   POST { finish: number[] }-> server recomputes the score, stores the attempt,
                               best score is whatever the max attempt is        */

async function loadQuiz(id: string) {
  const q = (await db.select().from(tables.quizzes).where(eq(tables.quizzes.id, id)))[0];
  return q && q.published ? q : null;
}

async function gate() {
  const user = await currentUser();
  if (!user) return { err: NextResponse.json({ error: "Signed out." }, { status: 401 }) };
  const ent = await getEntitlement(user.id);
  if (!ent.member) return { err: NextResponse.json({ error: "membership_required" }, { status: 402 }) };
  return { user };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await gate();
  if (g.err) return g.err;
  const { id } = await ctx.params;
  const quiz = await loadQuiz(id);
  if (!quiz) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({
    passPct: quiz.passPct,
    questions: quiz.questions.map((q) => ({ q: q.q, options: q.options })),
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await gate();
  if (g.err) return g.err;
  const { id } = await ctx.params;
  const quiz = await loadQuiz(id);
  if (!quiz) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const body = await req.json().catch(() => ({}));

  if (Array.isArray(body.finish)) {
    const choices: number[] = body.finish;
    let correct = 0;
    quiz.questions.forEach((q, i) => { if (choices[i] === q.correct) correct++; });
    const scorePct = Math.round((correct / quiz.questions.length) * 100);
    await db.insert(tables.quizAttempts).values({ id: nid(), userId: g.user.id, quizId: id, scorePct });
    return NextResponse.json({ scorePct, pass: scorePct >= quiz.passPct });
  }

  const i = Number(body.i), n = Number(body.n);
  const q = quiz.questions[i];
  if (!q || !(n >= 0 && n < q.options.length)) return NextResponse.json({ error: "Bad answer." }, { status: 400 });
  return NextResponse.json({ correct: n === q.correct, correctIndex: q.correct, why: q.why });
}
