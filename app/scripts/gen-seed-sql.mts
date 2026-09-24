// Emits a single self-contained SQL file: schema (migration) + all seed content.
// Paste into Neon's SQL editor and Run. Fully idempotent — safe to run repeatedly.
import { readFileSync, writeFileSync } from "node:fs";
import { TRACKS, GLOSSARY } from "../src/content/seed-data";

const q = (s: string) => "'" + String(s).replace(/'/g, "''") + "'";

import { readdirSync } from "node:fs";
const migrationFiles = readdirSync("drizzle").filter(f => f.endsWith(".sql")).sort();
const readMigration = (f: string) => readFileSync("drizzle/" + f, "utf8")
  .split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean).join("\n\n");
let migration = migrationFiles.map(f => `-- migration ${f}\n${readMigration(f)}`).join("\n\n");

// Upgrade file for databases that already ran the first setup: later migrations only.
const later = migrationFiles.slice(1);
if (later.length) {
  writeFileSync("../ten-talents-academy-neon-upgrade.sql",
    `-- Ten Talents Academy — UPGRADE (run only if you already ran ten-talents-academy-neon-setup.sql before ${later[0].slice(0, 4)})\n-- Adds: ${later.join(", ")}. Generated ${new Date().toISOString().slice(0, 10)}.\n\n` +
    later.map(f => `-- migration ${f}\n${readMigration(f)}`).join("\n\n") + "\n");
  console.log("wrote ten-talents-academy-neon-upgrade.sql");
}


let out = `-- Ten Talents Academy — full database build (schema + seed)
-- Paste this whole file into the Neon SQL editor and press Run.
-- Run once on your new (empty) Neon database. (The content INSERTs are re-runnable;
-- the table creation is not — if you ever need a clean slate, drop the tables first.)
-- Generated ${new Date().toISOString().slice(0,10)}.

${migration}

-- ============ seed content (from the prototype) ============
`;

TRACKS.forEach((t, ti) => {
  out += `\nINSERT INTO tracks (id,name,blurb,position,published) VALUES (${q(t.id)},${q(t.name)},${q(t.blurb)},${ti},true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,blurb=EXCLUDED.blurb,position=EXCLUDED.position;\n`;
  t.modules.forEach((m, mi) => {
    const mid = `${t.id}-${m.id}`;
    out += `INSERT INTO modules (id,track_id,name,kind,position,published) VALUES (${q(mid)},${q(t.id)},${q(m.name)},'lessons',${mi},true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,position=EXCLUDED.position;\n`;
    m.lessons.forEach((l, li) => {
      const lid = `${mid}-${l.id}`;
      out += `INSERT INTO lessons (id,module_id,title,minutes,body_html,is_free_preview,position,published) VALUES (${q(lid)},${q(mid)},${q(l.title)},${l.mins},${q(l.body ?? "")},${!!l.free},${li},true) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,minutes=EXCLUDED.minutes,body_html=EXCLUDED.body_html,is_free_preview=EXCLUDED.is_free_preview,position=EXCLUDED.position;\n`;
    });
    if (m.quiz) {
      const questions = m.quiz.map(x => ({ q: x.q, options: x.options, correct: x.correct, why: x.why }));
      out += `INSERT INTO quizzes (id,module_id,pass_pct,questions,published) VALUES (${q(mid+"-quiz")},${q(mid)},70,${q(JSON.stringify(questions))}::jsonb,true) ON CONFLICT (module_id) DO UPDATE SET questions=EXCLUDED.questions;\n`;
    }
  });
});
GLOSSARY.forEach(([term, def], gi) => {
  out += `INSERT INTO glossary_terms (id,term,definition,position) VALUES (${q("g"+gi)},${q(term)},${q(def)},${gi}) ON CONFLICT (id) DO UPDATE SET term=EXCLUDED.term,definition=EXCLUDED.definition,position=EXCLUDED.position;\n`;
});

out += `\n-- Done. To verify, run:  SELECT count(*) FROM lessons;  -- expect 17\n`;
writeFileSync("../ten-talents-academy-neon-setup.sql", out);
console.log("wrote ten-talents-academy-neon-setup.sql");
