import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth";
import { loadWorkspace, firmById, audit } from "@/lib/partners-data";

/** Logo upload for a partner firm. Small images only; stored on the firm row as a data URL so no
 *  blob storage is needed. Overrides any derived (Logo.dev) image. Admin only; audited. */
const bad = (m: string, status = 400) => NextResponse.json({ error: m }, { status });
const MAX = 200 * 1024;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return bad("Admin sign-in required.", 401);
  const { id } = await params;
  const firm = (await firmById(id)) ?? (await loadWorkspace(id))?.firm ?? null;
  if (!firm) return bad("Not found.", 404);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return bad("No file.");
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return bad("PNG, JPEG, WebP or SVG only.");
  if (file.size > MAX) return bad("Max 200 KB. Logos should be small.");
  const dataUrl = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
  await db.update(tables.partnerFirms).set({ logoUrl: dataUrl }).where(eq(tables.partnerFirms.id, firm.id));
  await audit(firm.id, "firm", firm.id, "logoUrl", firm.logoUrl?.startsWith("data:") ? "(uploaded image)" : firm.logoUrl ?? null, `(uploaded ${file.type}, ${Math.max(1, Math.round(file.size / 1024))} KB)`);
  return NextResponse.json({ ok: true });
}
