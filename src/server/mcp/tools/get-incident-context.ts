import { z } from "zod";

import { createCockroachMcpClient } from "../client";
import { parseMcpRows } from "../result";

const inputSchema = z.object({
  orgId: z.string().uuid(),
  incidentId: z.string().uuid(),
});

export type GetIncidentContextInput =
  z.infer<typeof inputSchema>;

export type IncidentContextRow = {
  id: string;
  org_id: string;
  asset_id: string;
  title: string;
  symptom_text: string;
  severity: string;
  status: string;
  started_at: string;
  resolved_at: string | null;
};

export async function getIncidentContext(
  input: GetIncidentContextInput
): Promise<IncidentContextRow | null> {
  const { orgId, incidentId } =
    inputSchema.parse(input);

  const client = await createCockroachMcpClient();

  try {
    const result = await client.callTool({
      name: "select_query",
      arguments: {
        database: "fieldfix",
        query: `
          SELECT
            id,
            org_id,
            asset_id,
            title,
            symptom_text,
            severity,
            status,
            started_at,
            resolved_at
          FROM incidents
          WHERE org_id = '${orgId}'
            AND id = '${incidentId}'
          LIMIT 1
        `,
      },
    });

    const rows =
      parseMcpRows<IncidentContextRow>(result);

    return rows[0] ?? null;
  } finally {
    await client.close().catch(() => {});
  }
}
