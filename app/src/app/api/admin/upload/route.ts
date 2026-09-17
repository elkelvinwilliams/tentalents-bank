import { NextRequest, NextResponse } from "next/server";
import { isAdmin, nid } from "@/lib/auth";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/** Image upload for the lesson editor.
 *  Production (BLOB_READ_WRITE_TOKEN set): Vercel Blob.
 *  Local dev: saved under public/uploads/. */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file." }, { status: 400 });
  if (!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(file.type)) return NextResponse.json({ error: "Images only." }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Max 4 MB." }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const name = `${nid(10)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`lessons/${name}`, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
