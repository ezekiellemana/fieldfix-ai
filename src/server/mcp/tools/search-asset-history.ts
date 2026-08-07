import { z } from "zod";

import { createCockroachMcpClient } from "../client";
import { parseMcpRows } from "../result";

const inputSchema = z.object({
  orgId: z.string().uuid(),
  assetId: z.string().uuid(),
  limit: z.number().int().min(1).max(25).default(10),
});

export type SearchAssetHistoryInput =
  z.input<typeof inputSchema>;

export type AssetHistoryRow = {
  incident_id: string;
  title: string;
  symptom_text: string;
  severity: string;
  status: string;
  started_at: string;
  resolved_at: string | null;
  repair_action: string | null;
  resolution_status: string | null;
  recurrence_detected: boolean | null;
  days_to_recurrence: number | null;
  outcome_text: string | null;
};

export async function searchAssetHistory(
  input: SearchAssetHistoryInput
): Promise<AssetHistoryRow[]> {
  const { orgId, assetId, limit } =
    inputSchema.parse(input);

  const client = await createCockroachMcpClient();

  try {
    const result = await client.callTool({
      name: "select_query",
      arguments: {
        database: "fieldfix",
        query: `
          SELECT
            i.id AS incident_id,
            i.title,
            i.symptom_text,
            i.severity,
            i.status,
            i.started_at,
            i.resolved_at,
            ra.description AS repair_action,
            o.resolution_status,
            o.recurrence_detected,
            o.days_to_recurrence,
            o.outcome_text
          FROM incidents AS i
          LEFT JOIN repair_actions AS ra
            ON ra.incident_id = i.id
           AND ra.org_id = i.org_id
          LEFT JOIN outcomes AS o
            ON o.incident_id = i.id
           AND o.org_id = i.org_id
          WHERE i.org_id = '${orgId}'
            AND i.asset_id = '${assetId}'
          ORDER BY i.started_at DESC
          LIMIT ${limit}
        `,
      },
    });

    return parseMcpRows<AssetHistoryRow>(result);
  } finally {
    await client.close().catch(() => {});
  }
}
