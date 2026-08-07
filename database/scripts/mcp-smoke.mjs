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
  name: "fieldfix-mcp-smoke",
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

try {
  console.log("Connecting to CockroachDB Cloud Managed MCP...");

  await client.connect(transport);

  console.log("Connected successfully.");

  const server = client.getServerVersion();

  console.log("\n=== MCP Server ===");
  console.log(server);

  const result = await client.listTools();

  console.log("\n=== Available MCP tools ===");

  console.table(
    result.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
    }))
  );

  console.log("\n=== Tool input schemas ===");

  for (const tool of result.tools) {
    console.log(`\n--- ${tool.name} ---`);
    console.log(
      JSON.stringify(tool.inputSchema, null, 2)
    );
  }

  console.log(
    `\nFIELDfix MCP smoke test passed. Tools discovered: ${result.tools.length}`
  );
} finally {
  await client.close().catch(() => {});
}
