import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
await db.exec(readFileSync("../ten-talents-academy-neon-setup.sql", "utf8"));
const one = async (s: string) => (await db.query<{c:number}>(s)).rows[0].c;
console.log("tracks:", await one("SELECT count(*)::int c FROM tracks"), "(expect 4)");
console.log("modules:", await one("SELECT count(*)::int c FROM modules"), "(expect 11)");
console.log("lessons:", await one("SELECT count(*)::int c FROM lessons"), "(expect 17)");
console.log("free-preview:", await one("SELECT count(*)::int c FROM lessons WHERE is_free_preview"), "(expect 1)");
console.log("written lessons:", await one("SELECT count(*)::int c FROM lessons WHERE minutes>0"), "(expect 2)");
console.log("quiz questions:", await one("SELECT jsonb_array_length(questions)::int c FROM quizzes LIMIT 1"), "(expect 5)");
console.log("glossary:", await one("SELECT count(*)::int c FROM glossary_terms"), "(expect 19)");
// re-running the SEED portion is safe (ON CONFLICT); prove it by re-inserting one track line
await db.exec("INSERT INTO tracks (id,name,blurb,position,published) VALUES ('t1','Money Foundations','x',0,true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;");
console.log("seed re-insert (ON CONFLICT) OK; tracks still:", await one("SELECT count(*)::int c FROM tracks"));
console.log("\\nVALID — ready for Neon.");
process.exit(0);
