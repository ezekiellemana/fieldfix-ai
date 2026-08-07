import pg from "pg";
import fs from "node:fs/promises";
import { pipeline } from "@huggingface/transformers";

const { Client } = pg;

const MODEL =
  process.env.LOCAL_EMBEDDING_MODEL ??
  "Xenova/multilingual-e5-large";

const QUERY =
  process.argv.slice(2).join(" ") ||
  "Pump vibrates heavily and loses pressure after warming up for about twenty minutes.";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

console.log("\nFIELDfix semantic memory search");
console.log(`Query: ${QUERY}`);
console.log(`Model: ${MODEL}`);
console.log("Loading embedding model...");

const extractor = await pipeline(
  "feature-extraction",
  MODEL,
  {
    dtype: "q8",
  }
);

const output = await extractor(
  `query: ${QUERY}`,
  {
    pooling: "mean",
    normalize: true,
  }
);

const embedding = output.tolist()[0];

if (!Array.isArray(embedding) || embedding.length !== 1024) {
  throw new Error(
    `Expected a 1024-dimensional query vector, got ${embedding?.length}.`
  );
}

const candidates = JSON.parse(
  await fs.readFile(
    "database/seeds/memory-candidates.json",
    "utf8"
  )
);

const orgId = candidates[0].org_id;

const vectorLiteral = `[${embedding.join(",")}]`;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

const result = await client.query(
  `
    SELECT
      id,
      title,
      asset_model,
      symptom_summary,
      root_cause,
      fix_summary,
      outcome_summary,
      lesson,
      verified,
      quality_score,
      1 - (
        embedding <=> CAST($2 AS VECTOR(1024))
      ) AS similarity
    FROM memory_episodes
    WHERE org_id = $1
    ORDER BY embedding <=> CAST($2 AS VECTOR(1024))
    LIMIT 8
  `,
  [orgId, vectorLiteral]
);

console.log("\n=== Top FIELDfix memories ===");

console.table(
  result.rows.map((row, index) => ({
    rank: index + 1,
    similarity: Number(row.similarity).toFixed(4),
    title: row.title,
    root_cause: row.root_cause,
    fix: row.fix_summary,
    outcome: row.outcome_summary,
    verified: row.verified,
  }))
);

await client.end();
