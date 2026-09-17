import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/db";
import { and, eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { CertificatePdf } from "@/lib/pdf/certificate";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ trackId: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Signed out." }, { status: 401 });
  const { trackId } = await ctx.params;
  const cert = (await db.select().from(tables.certificates)
    .where(and(eq(tables.certificates.userId, user.id), eq(tables.certificates.trackId, trackId))))[0];
  if (!cert) return NextResponse.json({ error: "Finish every lesson in the track first." }, { status: 404 });
  const track = (await db.select().from(tables.tracks).where(eq(tables.tracks.id, trackId)))[0];
  if (!track) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const name = (user.name || cert.nameOnCert || "").trim() || "Ten Talents learner";
  const buffer = await renderToBuffer(
    CertificatePdf({ name, trackName: track.name, issuedAt: cert.issuedAt })
  );
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Ten-Talents-${track.name.replace(/[^A-Za-z0-9]+/g, "-")}-Certificate.pdf"`,
    },
  });
}
