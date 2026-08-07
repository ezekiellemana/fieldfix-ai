import { z } from "zod";

import { createCockroachMcpClient } from "../client";
import { parseMcpRows } from "../result";

const inputSchema = z.object({
  orgId: z.string().uuid(),
  assetId: z.string().uuid(),
});

export type GetAssetContextInput =
  z.infer<typeof inputSchema>;

export type AssetContextRow = {
  id: string;
  asset_code: string;
  asset_type: string;
  manufacturer: string | null;
  model: string | null;
  criticality: string;
  status: string;
  site_name: string | null;
  region: string | null;
  incident_count: number;
  unresolved_incident_count: number;
};

export async function getAssetContext(
  input: GetAssetContextInput
): Promise<AssetContextRow | null> {
  const { orgId, assetId } = inputSchema.parse(input);

  const client = await createCockroachMcpClient();

  try {
    const result = await client.callTool({
      name: "select_query",
      arguments: {
        database: "fieldfix",
        query: `
          SELECT
            a.id,
            a.asset_code,
            a.asset_type,
            a.manufacturer,
            a.model,
            a.criticality,
            a.status,
            s.name AS site_name,
            s.region,
            COUNT(i.id)::INT AS incident_count,
            SUM(
              CASE
                WHEN i.status NOT IN ('resolved', 'failed')
                THEN 1
                ELSE 0
              END
            )::INT AS unresolved_incident_count
          FROM assets AS a
          LEFT JOIN sites AS s
            ON s.id = a.site_id
           AND s.org_id = a.org_id
          LEFT JOIN incidents AS i
            ON i.asset_id = a.id
           AND i.org_id = a.org_id
          WHERE a.org_id = '${orgId}'
            AND a.id = '${assetId}'
          GROUP BY
            a.id,
            a.asset_code,
            a.asset_type,
            a.manufacturer,
            a.model,
            a.criticality,
            a.status,
            s.name,
            s.region
          LIMIT 1
        `,
      },
    });

    const rows =
      parseMcpRows<AssetContextRow>(result);

    return rows[0] ?? null;
  } finally {
    await client.close().catch(() => {});
  }
}
