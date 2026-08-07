import fs from "node:fs/promises";
import pg from "pg";
import { pipeline } from "@huggingface/transformers";

const { Client } = pg;

const MODEL =
  process.env.LOCAL_EMBEDDING_MODEL ??
  "Xenova/multilingual-e5-large";

const DIMENSIONS = 1024;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

console.log("FIELDfix local embedding pipeline");
console.log(`Model: ${MODEL}`);
console.log("Loading quantized embedding model...");
console.log("First run downloads the model and may take several minutes.");

const extractor = await pipeline(
  "feature-extraction",
  MODEL,
  {
    dtype: "q8",
  }
);

console.log("Embedding model loaded.");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function embedPassage(text) {
  const output = await extractor(
    `passage: ${text}`,
    {
      pooling: "mean",
      normalize: true,
    }
  );

  const rows = output.tolist();
  const embedding = rows[0];

  if (!Array.isArray(embedding)) {
    throw new Error("Embedding output is not an array.");
  }

  if (embedding.length !== DIMENSIONS) {
    throw new Error(
      `Expected ${DIMENSIONS} dimensions, got ${embedding.length}.`
    );
  }

  return embedding;
}

async function main() {
  const candidates = JSON.parse(
    await fs.readFile(
      "database/seeds/memory-candidates.json",
      "utf8"
    )
  );

  console.log(`Memory candidates: ${candidates.length}`);

  await client.connect();

  const existingRows = await client.query(`
    SELECT id
    FROM memory_episodes
  `);

  const existing = new Set(
    existingRows.rows.map((row) => row.id)
  );

  let inserted = 0;
  let skipped = 0;

  for (let index = 0; index < candidates.length; index++) {
    const candidate = candidates[index];

    if (existing.has(candidate.id)) {
      skipped += 1;

      console.log(
        `[${index + 1}/${candidates.length}] skip ${candidate.id}`
      );

      continue;
    }

    const embedding = await embedPassage(
      candidate.canonical_text
    );

    const vectorLiteral =
      `[${embedding.join(",")}]`;

    await client.query(
      `
        INSERT INTO memory_episodes (
          id,
          org_id,
          asset_id,
          incident_id,
          asset_type,
          asset_model,
          title,
          symptom_summary,
          root_cause,
          fix_summary,
          outcome_summary,
          lesson,
          canonical_text,
          embedding,
          quality_score,
          verified
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          CAST($14 AS VECTOR(1024)),
          $15,
          $16
        )
        ON CONFLICT (id) DO NOTHING
      `,
      [
        candidate.id,
        candidate.org_id,
        candidate.asset_id,
        candidate.incident_id,
        candidate.asset_type,
        candidate.asset_model,
        candidate.title,
        candidate.symptom_summary,
        candidate.root_cause,
        candidate.fix_summary,
        candidate.outcome_summary,
        candidate.lesson,
        candidate.canonical_text,
        vectorLiteral,
        candidate.quality_score,
        candidate.verified,
      ]
    );

    inserted += 1;

    console.log(
      `[${index + 1}/${candidates.length}] inserted ${candidate.id}`
    );
  }

  const result = await client.query(`
    SELECT count(*)::INT AS total
    FROM memory_episodes
  `);

  console.log("\nFIELDfix local embedding pipeline complete.");
  console.log(`Inserted this run: ${inserted}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(
    `Total memory episodes: ${result.rows[0].total}`
  );
}

main()
  .catch((error) => {
    console.error("\nFIELDfix embedding pipeline failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
