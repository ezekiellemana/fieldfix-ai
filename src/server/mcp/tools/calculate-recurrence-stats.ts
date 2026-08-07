import { z } from "zod";

import { createCockroachMcpClient } from "../client";
import { parseMcpRows } from "../result";
import {
  embeddingSchema,
  toVectorLiteral,
} from "../vector";

const inputSchema = z.object({
  orgId: z.string().uuid(),
  embedding: embeddingSchema,
});

export type CalculateRecurrenceStatsInput =
  z.input<typeof inputSchema>;

export type RecurrenceStatsRow = {
  root_cause: string | null;
  fix_summary: string | null;
  similar_cases: number;
  best_similarity: string;
  successful_cases: number;
  recurrence_cases: number;
  success_rate_pct: string;
  recurrence_rate_pct: string;
  representative_lesson: string | null;
};

export async function calculateRecurrenceStats(
  input: CalculateRecurrenceStatsInput
): Promise<RecurrenceStatsRow[]> {
  const parsed = inputSchema.parse(input);

  const vectorLiteral =
    toVectorLiteral(parsed.embedding);

  const client = await createCockroachMcpClient();

  try {
    const result = await client.callTool({
      name: "select_query",
      arguments: {
        database: "fieldfix",
        query: `
          WITH query_vector AS (
            SELECT
              '${vectorLiteral}'::VECTOR(1024) AS embedding
          ),
          nearest AS (
            SELECT
              me.incident_id,
              me.root_cause,
              me.fix_summary,
              me.lesson,
              1 - (
                me.embedding <=> q.embedding
              ) AS similarity
            FROM memory_episodes AS me
            CROSS JOIN query_vector AS q
            WHERE me.org_id = '${parsed.orgId}'
            ORDER BY
              me.embedding <=> q.embedding
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

            SUM(
              CASE
                WHEN o.resolution_status = 'successful'
                THEN 1
                ELSE 0
              END
            )::INT AS successful_cases,

            SUM(
              CASE
                WHEN o.recurrence_detected
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
                    WHEN o.recurrence_detected
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
           AND o.org_id = '${parsed.orgId}'

          GROUP BY
            n.root_cause,
            n.fix_summary

          ORDER BY
            success_rate_pct DESC,
            recurrence_rate_pct ASC,
            best_similarity DESC
        `,
      },
    });

    return parseMcpRows<RecurrenceStatsRow>(result);
  } finally {
    await client.close().catch(() => {});
  }
}
