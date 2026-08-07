import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const candidates = JSON.parse(
  await fs.readFile(
    "database/seeds/memory-candidates.json",
    "utf8"
  )
);

const orgId = candidates[0]?.org_id;

if (!orgId) {
  throw new Error("Unable to determine FIELDfix demo organization.");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

try {
  const result = await client.query(
    `
      DELETE FROM organizations
      WHERE id = $1
      RETURNING id, name
    `,
    [orgId]
  );

  console.log("FIELDfix demo dataset reset.");
  console.table(result.rows);
} finally {
  await client.end();
}
