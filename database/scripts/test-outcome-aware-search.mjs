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

console.log("\nFIELDfix outcome-aware memory search");
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
    `Expected 1024-dimensional query embedding, got ${embedding?.length}.`
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

const evidence = await client.query(
  `
    WITH nearest AS (
      SELECT
        me.id,
        me.incident_id,
        me.title,
        me.root_cause,
        me.fix_summary,
        me.outcome_summary,
        me.lesson,
        me.verified,
        me.quality_score,
        1 - (
          me.embedding <=> CAST($2 AS VECTOR(1024))
        ) AS similarity
      FROM memory_episodes AS me
      WHERE me.org_id = $1
      ORDER BY
        me.embedding <=> CAST($2 AS VECTOR(1024))
      LIMIT 60
    )
    SELECT
      n.root_cause,
      n.fix_summary,
      COUNT(*)::INT AS similar_cases,

      ROUND(
        MAX(n.similarity)::DECIMAL,
        4
      ) AS best_similarity,

      ROUND(
        AVG(n.similarity)::DECIMAL,
        4
      ) AS avg_similarity,

      SUM(
        CASE
          WHEN o.resolution_status = 'successful'
          THEN 1
          ELSE 0
        END
      )::INT AS successful_cases,

      SUM(
        CASE
          WHEN o.recurrence_detected = true
          THEN 1
          ELSE 0
        END
      )::INT AS recurrence_cases,

      ROUND(
        (
          100.0 *
          SUM(
            CASE
              WHEN o.resolution_status = 'successful'
              THEN 1
              ELSE 0
            END
          ) /
          NULLIF(COUNT(*), 0)
        )::DECIMAL,
        1
      ) AS success_rate_pct,

      ROUND(
        (
          100.0 *
          SUM(
            CASE
              WHEN o.recurrence_detected = true
              THEN 1
              ELSE 0
            END
          ) /
          NULLIF(COUNT(*), 0)
        )::DECIMAL,
        1
      ) AS recurrence_rate_pct,

      MIN(n.lesson) AS representative_lesson

    FROM nearest AS n

    JOIN outcomes AS o
      ON o.incident_id = n.incident_id

    GROUP BY
      n.root_cause,
      n.fix_summary

    ORDER BY
      success_rate_pct DESC,
      recurrence_rate_pct ASC,
      best_similarity DESC
  `,
  [orgId, vectorLiteral]
);

console.log("\n=== Historical repair outcome comparison ===");

console.table(
  evidence.rows.map((row, index) => ({
    rank: index + 1,
    cause: row.root_cause,
    fix: row.fix_summary,
    similar_cases: row.similar_cases,
    similarity: row.best_similarity,
    successful: row.successful_cases,
    recurrence: row.recurrence_cases,
    success_rate: `${row.success_rate_pct}%`,
    recurrence_rate: `${row.recurrence_rate_pct}%`,
  }))
);

console.log("\n=== FIELDfix interpretation evidence ===");

for (const row of evidence.rows.slice(0, 5)) {
  console.log(`\nCause: ${row.root_cause}`);
  console.log(`Repair: ${row.fix_summary}`);
  console.log(`Similar historical cases: ${row.similar_cases}`);
  console.log(`Success rate: ${row.success_rate_pct}%`);
  console.log(`Recurrence rate: ${row.recurrence_rate_pct}%`);
  console.log(`Lesson: ${row.representative_lesson}`);
}

await client.end();
