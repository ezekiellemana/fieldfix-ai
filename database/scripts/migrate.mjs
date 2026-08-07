import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

const migrationsDir = path.resolve("database", "migrations");

const client = new Client({
  connectionString,
});

async function main() {
  await client.connect();

  console.log("Connected to CockroachDB.");

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version STRING(32) PRIMARY KEY,
      description STRING(255) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = file.split("_")[0];

    const alreadyApplied = await client.query(
      `
        SELECT version
        FROM schema_migrations
        WHERE version = $1
      `,
      [version]
    );

    if (alreadyApplied.rowCount > 0) {
      console.log(`Skipping ${file} — already applied.`);
      continue;
    }

    console.log(`Applying ${file}...`);

    const sql = await fs.readFile(
      path.join(migrationsDir, file),
      "utf8"
    );

    await client.query(sql);

    console.log(`Applied ${file}.`);
  }

  const result = await client.query(`
    SELECT version, description, applied_at
    FROM schema_migrations
    ORDER BY version
  `);

  console.log("\nApplied migrations:");
  console.table(result.rows);
}

main()
  .catch((error) => {
    console.error("\nMigration failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
