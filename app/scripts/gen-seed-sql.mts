// Emits a single self-contained SQL file: schema (migration) + all seed content.
// Paste into Neon's SQL editor and Run. Fully idempotent — safe to run repeatedly.
import { readFileSync, writeFileSync } from "node:fs";
import { TRACKS, GLOSSARY } from "../src/content/seed-data";
import { seedRows } from "../src/lib/partners-data";
import { RETIRED_SLUGS } from "../src/content/partners-seed";

const q = (s: string) => "'" + String(s).replace(/'/g, "''") + "'";

import { readdirSync } from "node:fs";
const migrationFiles = readdirSync("drizzle").filter(f => f.endsWith(".sql")).sort();
const readMigration = (f: string) => readFileSync("drizzle/" + f, "utf8")
  .split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean).join("\n\n");
let migration = migrationFiles.map(f => `-- migration ${f}\n${readMigration(f)}`).join("\n\n");



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

/* Affiliate partnerships — the PROSPECTS, provisional statuses only. Insert-if-missing so dashboard edits are never overwritten. */
const R = seedRows();
const v = (x: unknown) => (x === null || x === undefined ? "NULL" : typeof x === "boolean" ? String(x) : typeof x === "number" ? String(x) : typeof x === "object" ? q(JSON.stringify(x)) + "::jsonb" : q(String(x)));
let pt = "";
const ins = (table: string, rows: Record<string, unknown>[], cols: Record<string, string>) => rows.forEach((r) => { const ks = Object.keys(cols).filter((k) => r[k] !== undefined); pt += `INSERT INTO ${table} (${ks.map((k) => cols[k]).join(",")}) VALUES (${ks.map((k) => v(r[k])).join(",")}) ON CONFLICT DO NOTHING;\n`; });
pt += `\n-- Affiliate partnerships: prospects (provisional; nothing submitted, approved or confirmed). Insert-if-missing.\n`;
for (const slug of RETIRED_SLUGS) pt += `DELETE FROM partner_firms WHERE slug=${q(slug)}; -- retired by founder decision; cascades\n`;
ins("partner_firms", R.firms as Record<string, unknown>[], { id: "id", slug: "slug", name: "name", programmeUrl: "programme_url", applyUrl: "apply_url", requirementsUrl: "requirements_url", model: "model", applicationStatus: "application_status", termsStatus: "terms_status", complianceStatus: "compliance_status", countryEligibility: "country_eligibility", countryNote: "country_note", targetCountries: "target_countries", owner: "owner", nextAction: "next_action", nextActionDue: "next_action_due", lastResearchAt: "last_research_at", notes: "notes" });
ins("partner_research", R.research as Record<string, unknown>[], { id: "id", firmId: "firm_id", topic: "topic", claim: "claim", sourceUrl: "source_url", verification: "verification", verifiedAt: "verified_at", notes: "notes" });
ins("partner_applications", R.applications as Record<string, unknown>[], { id: "id", firmId: "firm_id", checklist: "checklist", documents: "documents" });
ins("partner_term_items", R.terms as Record<string, unknown>[], { id: "id", firmId: "firm_id", key: "key", status: "status", value: "value", currency: "currency", sourceUrl: "source_url", sourceNote: "source_note" });
ins("partner_compliance", R.compliance as Record<string, unknown>[], { id: "id", firmId: "firm_id", permittedToPromote: "permitted_to_promote", legalAdviceRequired: "legal_advice_required", restrictions: "restrictions", openQuestions: "open_questions" });
ins("partner_channel_approvals", R.channels as Record<string, unknown>[], { id: "id", firmId: "firm_id", channel: "channel", status: "status" });
ins("partner_tasks", R.tasks as Record<string, unknown>[], { id: "id", firmId: "firm_id", title: "title", owner: "owner", priority: "priority", dueAt: "due_at" });
ins("partner_audit", R.audit as Record<string, unknown>[], { id: "id", firmId: "firm_id", entity: "entity", entityId: "entity_id", field: "field", oldValue: "old_value", newValue: "new_value", actor: "actor" });

out += pt;
out += `\n-- Done. To verify, run:  SELECT count(*) FROM lessons;  -- expect 17.  SELECT count(*) FROM partner_firms;  -- expect 5\n`;
writeFileSync("../ten-talents-academy-neon-setup.sql", out);
console.log("wrote ten-talents-academy-neon-setup.sql");

// Upgrade file for databases that already ran the first setup: later migrations, plus the partner seed (insert-if-missing).
const later = migrationFiles.slice(1);
if (later.length) {
  writeFileSync("../ten-talents-academy-neon-upgrade.sql",
    `-- Ten Talents Academy — UPGRADE (run only if you already ran ten-talents-academy-neon-setup.sql before ${later[0].slice(0, 4)})\n-- Adds: ${later.join(", ")}. Generated ${new Date().toISOString().slice(0, 10)}.\n\n` +
    later.map(f => `-- migration ${f}\n${readMigration(f)}`).join("\n\n") + "\n" + pt + "\n");
  console.log("wrote ten-talents-academy-neon-upgrade.sql");
}

// The partner seed module opens the dev database on import; exit explicitly so the handle does not keep the process alive.
process.exit(0);
