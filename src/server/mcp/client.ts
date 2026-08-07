import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export async function createCockroachMcpClient() {
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
    name: "fieldfix-agent",
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

  await client.connect(transport);

  return client;
}
