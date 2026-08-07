import fs from "node:fs/promises";

import {
  completeAgentRun,
  createAgentRun,
  withAgentToolTrace,
} from "../../src/server/mcp/observability";

import { createCockroachMcpClient } from "../../src/server/mcp/client";
import { parseMcpRows } from "../../src/server/mcp/result";

import { getAssetContext } from "../../src/server/mcp/tools/get-asset-context";
import { searchAssetHistory } from "../../src/server/mcp/tools/search-asset-history";

async function main() {
  const candidates = JSON.parse(
    await fs.readFile(
      "database/seeds/memory-candidates.json",
      "utf8"
    )
  );

  const reference = candidates[0];

  if (!reference) {
    throw new Error("No memory candidate available.");
  }

  const orgId = reference.org_id;
  const incidentId = reference.incident_id;
  const assetId = reference.asset_id;

  console.log("\nFIELDfix observability layer test");
  console.log("--------------------------------");

  console.log("\n1. Create agent run");

  const agentRunId = await createAgentRun({
    orgId,
    incidentId,
    trigger: "observability_layer_test",
    modelId: "fieldfix-test",
  });

  console.log("Run:", agentRunId);

  console.log("\n2. Traced get_asset_context");

  const context = await withAgentToolTrace({
    agentRunId,
    orgId,
    toolName: "get_asset_context",
    toolInput: {
      orgId,
      assetId,
    },
    execute: () =>
      getAssetContext({
        orgId,
        assetId,
      }),
  });

  console.log(
    context?.asset_code,
    context?.model
  );

  console.log("\n3. Traced search_asset_history");

  const history = await withAgentToolTrace({
    agentRunId,
    orgId,
    toolName: "search_asset_history",
    toolInput: {
      orgId,
      assetId,
      limit: 4,
    },
    execute: () =>
      searchAssetHistory({
        orgId,
        assetId,
        limit: 4,
      }),
  });

  console.log("History rows:", history.length);

  console.log("\n4. Complete agent run");

  await completeAgentRun({
    runId: agentRunId,
    orgId,
    confidence: 0.95,
    recommendation: {
      test: true,
      assetCode: context?.asset_code,
      evidenceRows: history.length,
    },
  });

  console.log("Run completed.");

  console.log("\n5. Verify trace");

  const client = await createCockroachMcpClient();

  try {
    const result = await client.callTool({
      name: "select_query",
      arguments: {
        database: "fieldfix",
        query: `
          SELECT
            ar.id,
            ar.status,
            ar.confidence,
            COUNT(atc.id)::INT AS tool_calls,
            SUM(
              CASE
                WHEN atc.success
                THEN 1
                ELSE 0
              END
            )::INT AS successful_tool_calls
          FROM agent_runs AS ar
          LEFT JOIN agent_tool_calls AS atc
            ON atc.agent_run_id = ar.id
          WHERE ar.id = '${agentRunId}'
          GROUP BY
            ar.id,
            ar.status,
            ar.confidence
        `,
      },
    });

    console.log(
      parseMcpRows(result)
    );

    const auditResult = await client.callTool({
      name: "select_query",
      arguments: {
        database: "fieldfix",
        query: `
          SELECT
            event,
            entity_type,
            created_at
          FROM audit_events
          WHERE org_id = '${orgId}'
            AND (
              entity_id = '${agentRunId}'
              OR metadata->>'toolName' IN (
                'get_asset_context',
                'search_asset_history'
              )
            )
          ORDER BY created_at DESC
          LIMIT 10
        `,
      },
    });

    console.log("\nAudit events:");
    console.table(parseMcpRows(auditResult));
  } finally {
    await client.close().catch(() => {});
  }

  console.log(
    "\nFIELDfix observability layer test passed."
  );
}

main().catch((error) => {
  console.error(
    "\nFIELDfix observability layer test failed:"
  );
  console.error(error);
  process.exitCode = 1;
});
