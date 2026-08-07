import fs from "node:fs/promises";
import pg from "pg";
import { pipeline } from "@huggingface/transformers";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const QUERY =
  "Pump vibrates heavily and loses pressure after warming up for about twenty minutes.";

const candidates = JSON.parse(
  await fs.readFile(
    "database/seeds/memory-candidates.json",
    "utf8"
  )
);

const orgId = candidates[0].org_id;

console.log("Loading embedding model...");

const extractor = await pipeline(
  "feature-extraction",
  "Xenova/multilingual-e5-large",
  { dtype: "q8" }
);

const output = await extractor(
  `query: ${QUERY}`,
  {
    pooling: "mean",
    normalize: true,
  }
);

const embedding = output.tolist()[0];

if (embedding.length !== 1024) {
  throw new Error(`Unexpected dimensions: ${embedding.length}`);
}

const vectorLiteral = `[${embedding.join(",")}]`;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

const result = await client.query(
  `
    EXPLAIN
    SELECT
      id,
      title,
      root_cause
    FROM memory_episodes
    WHERE org_id = $1
    ORDER BY embedding <=> CAST($2 AS VECTOR(1024))
    LIMIT 8
  `,
  [orgId, vectorLiteral]
);

console.log("\n=== CockroachDB vector search plan ===\n");

for (const row of result.rows) {
  console.log(row.info);
}

const plan = result.rows
  .map((row) => row.info ?? "")
  .join("\n");

console.log("\n=== Verification ===");
console.log(
  "memory_embedding_idx referenced:",
  plan.includes("memory_embedding_idx")
);
console.log(
  "vector search operation:",
  /vector search/i.test(plan)
);
console.log(
  "limited scan:",
  /LIMITED SCAN/i.test(plan)
);

await client.end();
