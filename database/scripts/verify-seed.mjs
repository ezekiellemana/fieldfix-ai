import pg from "pg";
import fs from "node:fs/promises";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

const counts = await client.query(`
  SELECT
    (SELECT count(*) FROM organizations) AS organizations,
    (SELECT count(*) FROM users) AS users,
    (SELECT count(*) FROM sites) AS sites,
    (SELECT count(*) FROM assets) AS assets,
    (SELECT count(*) FROM incidents) AS incidents,
    (SELECT count(*) FROM repair_actions) AS repair_actions,
    (SELECT count(*) FROM outcomes) AS outcomes,
    (SELECT count(*) FROM memory_episodes) AS memory_episodes
`);

console.log("\n=== Database counts ===");
console.table(counts.rows);

const patterns = await client.query(`
  SELECT
    title,
    count(*)::INT AS incidents
  FROM incidents
  GROUP BY title
  ORDER BY title
`);

console.log("\n=== Incident pattern distribution ===");
console.table(patterns.rows);

const recurrence = await client.query(`
  SELECT
    recurrence_detected,
    count(*)::INT AS outcomes
  FROM outcomes
  GROUP BY recurrence_detected
  ORDER BY recurrence_detected
`);

console.log("\n=== Outcome recurrence ===");
console.table(recurrence.rows);

const candidates = JSON.parse(
  await fs.readFile(
    "database/seeds/memory-candidates.json",
    "utf8"
  )
);

console.log("\nMemory candidates JSON:", candidates.length);

await client.end();
