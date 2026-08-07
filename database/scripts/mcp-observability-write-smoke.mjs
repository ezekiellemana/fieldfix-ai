import { randomUUID } from "node:crypto";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const apiKey = process.env.COCKROACH_MCP_API_KEY;
const clusterId = process.env.COCKROACH_CLUSTER_ID;

if (!apiKey || !clusterId) {
  throw new Error("MCP configuration is incomplete.");
}

const client = new Client({
  name: "fieldfix-observability-write-smoke",
  version: "0.1.0",
});

const transport = new StreamableHTTPClientTransport(
  new URL(
    process.env.COCKROACH_MCP_URL ??
      "https://cockroachlabs.cloud/mcp"
  ),
  {
    requestInit: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "mcp-cluster-id": clusterId,
      },
    },
  }
);

function parseRows(result) {
  const text = result.content?.find(
    (item) => item.type === "text"
  )?.text;

  if (!text) {
    return [];
  }

  return JSON.parse(text).rows ?? [];
}

async function insert(query) {
  return client.callTool({
    name: "insert_rows",
    arguments: {
      database: "fieldfix",
      query,
    },
  });
}

async function main() {
  await client.connect(transport);

  console.log(
    "\nFIELDfix MCP observability write smoke"
  );
  console.log("--------------------------------------");

  const referenceResult = await client.callTool({
    name: "select_query",
    arguments: {
      database: "fieldfix",
      query: `
        SELECT
          org_id,
          id AS incident_id
        FROM incidents
        ORDER BY started_at ASC
        LIMIT 1
      `,
    },
  });

  const [reference] = parseRows(referenceResult);

  if (!reference) {
    throw new Error(
      "Could not find a FIELDfix incident."
    );
  }

  const orgId = reference.org_id;
  const incidentId = reference.incident_id;

  const runId = randomUUID();
  const toolCallId = randomUUID();
  const auditId = randomUUID();

  console.log("\n1. Create running agent_run");

  await insert(`
    INSERT INTO agent_runs (
      id,
      org_id,
      incident_id,
      trigger,
      model_id,
      status
    )
    VALUES (
      '${runId}',
      '${orgId}',
      '${incidentId}',
      'observability_smoke',
      'fieldfix-test',
      'running'
    )
  `);

  console.log("agent_run inserted");

  console.log("\n2. Record agent_tool_call");

  await insert(`
    INSERT INTO agent_tool_calls (
      id,
      agent_run_id,
      tool_name,
      input_summary,
      output_summary,
      duration_ms,
      success
    )
    VALUES (
      '${toolCallId}',
      '${runId}',
      'get_asset_context',
      'Synthetic MCP observability smoke input',
      'Synthetic MCP observability smoke output',
      12,
      true
    )
  `);

  console.log("agent_tool_call inserted");

  console.log("\n3. Record audit_event");

  await insert(`
    INSERT INTO audit_events (
      id,
      org_id,
      actor_type,
      event,
      entity_type,
      entity_id,
      metadata
    )
    VALUES (
      '${auditId}',
      '${orgId}',
      'system',
      'agent.observability_smoke',
      'agent_run',
      '${runId}',
      '{"synthetic":true,"source":"mcp-write-smoke"}'::JSONB
    )
  `);

  console.log("audit_event inserted");

  console.log(
    "\n4. Complete agent_run using INSERT ... ON CONFLICT"
  );

  try {
    await insert(`
      INSERT INTO agent_runs (
        id,
        org_id,
        incident_id,
        trigger,
        model_id,
        status,
        confidence,
        recommendation,
        started_at,
        completed_at,
        error_code,
        created_at
      )
      SELECT
        id,
        org_id,
        incident_id,
        trigger,
        model_id,
        'completed',
        0.999,
        '{"smoke_test":true}'::JSONB,
        started_at,
        now(),
        NULL,
        created_at
      FROM agent_runs
      WHERE id = '${runId}'
      ON CONFLICT (id)
      DO UPDATE SET
        status = excluded.status,
        confidence = excluded.confidence,
        recommendation = excluded.recommendation,
        completed_at = excluded.completed_at,
        error_code = NULL
    `);

    console.log(
      "Agent run completion via MCP INSERT upsert: PASSED"
    );
  } catch (error) {
    console.error(
      "Agent run completion via MCP INSERT upsert: FAILED"
    );
    console.error(error);
  }

  console.log("\n5. Verify persisted trace");

  const verification = await client.callTool({
    name: "select_query",
    arguments: {
      database: "fieldfix",
      query: `
        SELECT
          ar.id,
          ar.trigger,
          ar.status,
          ar.confidence,
          ar.started_at,
          ar.completed_at,
          COUNT(atc.id)::INT AS tool_calls
        FROM agent_runs AS ar
        LEFT JOIN agent_tool_calls AS atc
          ON atc.agent_run_id = ar.id
        WHERE ar.id = '${runId}'
        GROUP BY
          ar.id,
          ar.trigger,
          ar.status,
          ar.confidence,
          ar.started_at,
          ar.completed_at
      `,
    },
  });

  console.log(
    JSON.stringify(
      parseRows(verification),
      null,
      2
    )
  );

  const auditVerification =
    await client.callTool({
      name: "select_query",
      arguments: {
        database: "fieldfix",
        query: `
          SELECT
            event,
            actor_type,
            entity_type,
            metadata
          FROM audit_events
          WHERE id = '${auditId}'
          LIMIT 1
        `,
      },
    });

  console.log("\nAudit:");
  console.log(
    JSON.stringify(
      parseRows(auditVerification),
      null,
      2
    )
  );

  console.log(
    "\nFIELDfix MCP observability write smoke finished."
  );
}

main()
  .catch((error) => {
    console.error(
      "\nObservability write smoke failed:"
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close().catch(() => {});
  });
