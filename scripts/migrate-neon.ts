/**
 * Applique les migrations SQL (supabase/migrations/*.sql) sur une base Neon,
 * pour un usage dev/staging uniquement.
 *
 * Supabase reste l'unique provider en production : ce script ne remplace pas
 * Supabase Auth/Storage/RLS, qui dépendent du schéma `auth` fourni par la
 * plateforme Supabase et n'existent pas sur un Postgres Neon nu. Les
 * migrations qui référencent `auth.users`/`auth.uid()` échoueront tant que
 * ce schéma n'est pas répliqué manuellement sur la base Neon cible.
 *
 * Usage : DATABASE_PROVIDER=neon npm run db:migrate:neon
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

const MIGRATIONS_DIR = resolve(process.cwd(), "supabase/migrations");

async function main() {
  if (process.env.DATABASE_PROVIDER !== "neon") {
    console.error(
      "[migrate-neon] DATABASE_PROVIDER doit valoir \"neon\" pour lancer ce script " +
        "(garde-fou contre une exécution accidentelle sur la base de production Supabase)."
    );
    process.exit(1);
  }

  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    console.error("[migrate-neon] NEON_DATABASE_URL est requis (voir .env.example).");
    process.exit(1);
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("[migrate-neon] Aucune migration trouvée dans supabase/migrations/.");
    return;
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: true } });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _neon_migrations (
        filename    TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows: appliedRows } = await client.query<{ filename: string }>(
      "SELECT filename FROM _neon_migrations"
    );
    const applied = new Set(appliedRows.map((r) => r.filename));

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate-neon] skip (déjà appliquée) — ${file}`);
        continue;
      }

      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
      console.log(`[migrate-neon] applying — ${file}`);

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _neon_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[migrate-neon] ÉCHEC sur ${file}: ${message}`);
        console.error(
          "[migrate-neon] Si l'erreur mentionne le schéma \"auth\" (auth.users, auth.uid()...), " +
            "c'est attendu : ces objets sont fournis par Supabase Auth et n'existent pas sur Neon. " +
            "Voir la section \"Base de données\" du README."
        );
        process.exitCode = 1;
        return;
      }
    }

    console.log("[migrate-neon] Terminé.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[migrate-neon] Erreur inattendue:", err);
  process.exit(1);
});
