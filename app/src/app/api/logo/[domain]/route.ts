import type { NextRequest } from "next/server";

/* Public logo endpoint for the static website (GitHub Pages).
   Fetches a broker's logo from Logo.dev with the publishable key held in Vercel (LOGO_DEV_KEY) and serves it from
   this app, cached at the edge for a week. Only the broker domains shown on the website are allowed, so this is not
   an open image proxy. When a broker is added to TT_BROKERS in the website's assets/js/config.js with a `domain`,
   add that domain here too. */
const ALLOWED = new Set(["vantagemarkets.com", "exness.com", "pepperstone.com", "xm.com"]);

const notFound = () => new Response("Not found", { status: 404, headers: { "cache-control": "public, max-age=300" } });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const key = process.env.LOGO_DEV_KEY;
  if (!key || !ALLOWED.has(domain)) return notFound();
  let upstream: Response;
  try {
    upstream = await fetch(`https://img.logo.dev/${domain}?token=${encodeURIComponent(key)}&size=128&format=png&retina=true`, { cache: "no-store" });
  } catch {
    return notFound();
  }
  const type = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !type.startsWith("image/")) return notFound();
  return new Response(upstream.body, {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
