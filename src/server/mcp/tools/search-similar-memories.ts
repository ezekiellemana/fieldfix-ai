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
  limit: z.number().int().min(1).max(20).default(8),
});

export type SearchSimilarMemoriesInput =
  z.input<typeof inputSchema>;

export type SimilarMemoryRow = {
  id: string;
  incident_id: string;
  asset_id: string;
  title: string;
  root_cause: string | null;
  fix_summary: string | null;
  outcome_summary: string | null;
  lesson: string | null;
  quality_score: string;
  verified: boolean;
  similarity: string;
};

export async function searchSimilarMemories(
  input: SearchSimilarMemoriesInput
): Promise<SimilarMemoryRow[]> {
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
  SELECT '${vectorLiteral}'::VECTOR(1024) AS embedding
)
SELECT
  me.id,
  me.incident_id,
  me.asset_id,
  me.title,
  me.root_cause,
  me.fix_summary,
  me.outcome_summary,
  me.lesson,
  me.quality_score,
  me.verified,
  ROUND(
    (1 - (me.embedding <=> q.embedding))::DECIMAL,
    4
  ) AS similarity
FROM memory_episodes AS me
CROSS JOIN query_vector AS q
WHERE me.org_id = '${parsed.orgId}'
ORDER BY me.embedding <=> q.embedding
LIMIT ${parsed.limit}
        `,
      },
    });

    return parseMcpRows<SimilarMemoryRow>(result);
  } finally {
    await client.close().catch(() => {});
  }
}
