/* Vercel build: when DATABASE_URL is set (Neon), apply migrations + seed content first
   (idempotent: the _migrations table and upsert-by-id seed make repeats harmless),
   then build. Without DATABASE_URL it just builds. */
import { execSync } from "node:child_process";
const run = (cmd) => execSync(cmd, { stdio: "inherit" });
if (process.env.DATABASE_URL) { console.log("vercel-build: DATABASE_URL set → applying migrations + seed"); run("npm run db:setup"); }
else console.log("vercel-build: no DATABASE_URL → skipping db:setup");
run("npx next build");
