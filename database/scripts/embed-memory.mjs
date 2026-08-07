import fs from "node:fs/promises";
import pg from "pg";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const { Client } = pg;

const REGION = process.env.AWS_REGION ?? "eu-central-1";
const MODEL_ID =
  process.env.BEDROCK_EMBEDDING_MODEL ??
  "amazon.titan-embed-text-v2:0";

const DIMENSIONS = Number(
  process.env.EMBEDDING_DIMENSIONS ?? 1024
);

const DELAY_MS = Number(
  process.env.EMBED_DELAY_MS ?? 750
);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const bedrock = new BedrockRuntimeClient({
  region: REGION,
});

const db = new Client({
  connectionString: process.env.DATABASE_URL,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedWithRetry(text) {
  let attempt = 0;

  while (attempt < 6) {
    try {
      const response = await bedrock.send(
        new InvokeModelCommand({
          modelId: MODEL_ID,
          contentType: "application/json",
          accept: "application/json",
          body: Buffer.from(
            JSON.stringify({
              inputText: text,
              dimensions: DIMENSIONS,
              normalize: true,
            })
          ),
        })
      );

      const payload = JSON.parse(
        Buffer.from(response.body).toString("utf8")
      );

      if (!Array.isArray(payload.embedding)) {
        throw new Error(
          "Titan response did not contain an embedding array."
        );
      }

      if (payload.embedding.length !== DIMENSIONS) {
        throw new Error(
          `Expected ${DIMENSIONS} dimensions, got ${payload.embedding.length}.`
        );
      }

      return payload.embedding;
    } catch (error) {
      attempt += 1;

      const retryable =
        error?.name === "ThrottlingException" ||
        error?.$metadata?.httpStatusCode === 429;

      if (!retryable || attempt >= 6) {
        throw error;
      }

      const waitMs = Math.min(
        30000,
        1000 * 2 ** (attempt - 1)
      );

      console.log(
        `Titan throttled. Retry ${attempt}/6 in ${waitMs}ms...`
      );

      await sleep(waitMs);
    }
  }
}

async function main() {
  const candidates = JSON.parse(
    await fs.readFile(
      "database/seeds/memory-candidates.json",
      "utf8"
    )
  );

  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("No memory candidates found.");
  }

  console.log(`Region: ${REGION}`);
  console.log(`Embedding model: ${MODEL_ID}`);
  console.log(`Dimensions: ${DIMENSIONS}`);
  console.log(`Candidates: ${candidates.length}`);

  await db.connect();

  const existingRows = await db.query(
    `
      SELECT id
      FROM memory_episodes
      WHERE org_id = $1
    `,
    [candidates[0].org_id]
  );

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

    const embedding = await embedWithRetry(
      candidate.canonical_text
    );

    const vectorLiteral = `[${embedding.join(",")}]`;

    await db.query(
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

    await sleep(DELAY_MS);
  }

  const countResult = await db.query(`
    SELECT count(*)::INT AS memory_episodes
    FROM memory_episodes
  `);

  console.log("\nFIELDfix embedding pipeline complete.");
  console.log(`Inserted this run: ${inserted}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(
    `Total memory episodes: ${countResult.rows[0].memory_episodes}`
  );
}

main()
  .catch((error) => {
    console.error("\nFIELDfix embedding pipeline failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end().catch(() => {});
  });
