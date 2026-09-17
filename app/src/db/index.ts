import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";

/**
 * DATABASE_URL set (Neon/production) -> node-postgres.
 * Otherwise -> embedded PGlite (same Postgres dialect) persisted in .pglite/,
 * used for local development and CI. One schema, two drivers.
 */

type DB = ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

declare global {
  var __ttdb: DB | undefined;
}

function make(): DB {
  if (process.env.DATABASE_URL) {
    return drizzlePg(process.env.DATABASE_URL, { schema });
  }
  return drizzlePglite(process.env.PGLITE_DIR ?? ".pglite", { schema });
}

export const db: DB = globalThis.__ttdb ?? (globalThis.__ttdb = make());
export * as tables from "./schema";
