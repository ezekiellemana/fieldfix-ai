import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url =
  process.env.COCKROACH_MCP_URL ??
  "https://cockroachlabs.cloud/mcp";

const apiKey = process.env.COCKROACH_MCP_API_KEY;
const clusterId = process.env.COCKROACH_CLUSTER_ID;

if (!apiKey) {
  throw new Error("COCKROACH_MCP_API_KEY is not configured.");
}

if (!clusterId) {
  throw new Error("COCKROACH_CLUSTER_ID is not configured.");
}

const client = new Client({
  name: "fieldfix-mcp-read-smoke",
  version: "0.1.0",
});

const transport = new StreamableHTTPClientTransport(
  new URL(url),
  {
    requestInit: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "mcp-cluster-id": clusterId,
      },
    },
  }
);

function printToolResult(label, result) {
  console.log(`\n=== ${label} ===`);

  if (!result?.content) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  for (const item of result.content) {
    if (item.type === "text") {
      console.log(item.text);
    } else {
      console.log(JSON.stringify(item, null, 2));
    }
  }
}

try {
  console.log("Connecting to FIELDfix CockroachDB MCP...");

  await client.connect(transport);

  console.log("Connected.");

  const databases = await client.callTool({
    name: "list_databases",
    arguments: {},
  });

  printToolResult("Databases", databases);

  const tables = await client.callTool({
    name: "list_tables",
    arguments: {
      database: "fieldfix",
    },
  });

  printToolResult("FIELDfix tables", tables);

  const assetSchema = await client.callTool({
    name: "get_table_schema",
    arguments: {
      database: "fieldfix",
      schema: "public",
      table: "assets",
    },
  });

  printToolResult("assets schema", assetSchema);

  const memorySchema = await client.callTool({
    name: "get_table_schema",
    arguments: {
      database: "fieldfix",
      schema: "public",
      table: "memory_episodes",
    },
  });

  printToolResult("memory_episodes schema", memorySchema);

  const assets = await client.callTool({
    name: "select_query",
    arguments: {
      database: "fieldfix",
      query: `
        SELECT
          asset_code,
          asset_type,
          manufacturer,
          model,
          criticality,
          status
        FROM assets
        ORDER BY asset_code
        LIMIT 5
      `,
    },
  });

  printToolResult("Sample FIELDfix assets", assets);

  const counts = await client.callTool({
    name: "select_query",
    arguments: {
      database: "fieldfix",
      query: `
        SELECT
          (SELECT count(*) FROM assets) AS assets,
          (SELECT count(*) FROM incidents) AS incidents,
          (SELECT count(*) FROM outcomes) AS outcomes,
          (SELECT count(*) FROM memory_episodes) AS memory_episodes
      `,
    },
  });

  printToolResult("FIELDfix memory counts", counts);

  console.log("\nFIELDfix MCP read smoke test passed.");
} finally {
  await client.close().catch(() => {});
}
