import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const apiKey = process.env.COCKROACH_MCP_API_KEY;
const clusterId = process.env.COCKROACH_CLUSTER_ID;

if (!apiKey || !clusterId) {
  throw new Error("MCP configuration is incomplete.");
}

const client = new Client({
  name: "fieldfix-learning-schema",
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

async function main() {
  await client.connect(transport);

  const tables = [
    "incidents",
    "repair_actions",
    "outcomes",
    "memory_episodes",
  ];

  for (const table of tables) {
    console.log(`\n=== ${table} ===`);

    const result = await client.callTool({
      name: "get_table_schema",
      arguments: {
        database: "fieldfix",
        schema: "public",
        table,
      },
    });

    for (const item of result.content ?? []) {
      if (item.type === "text") {
        console.log(item.text);
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close().catch(() => {});
  });
