type McpTextContent = {
  type: "text";
  text: string;
};

type McpToolResult = {
  content?: Array<
    | McpTextContent
    | {
        type: string;
        [key: string]: unknown;
      }
  >;
  isError?: boolean;
};

export type McpRowsResult<T> = {
  rows: T[];
};

export function parseMcpRows<T>(
  result: unknown
): T[] {
  const toolResult = result as McpToolResult;

  if (toolResult.isError) {
    throw new Error("CockroachDB MCP tool returned an error.");
  }

  const text = toolResult.content?.find(
    (item): item is McpTextContent =>
      item.type === "text"
  );

  if (!text) {
    throw new Error(
      "CockroachDB MCP response did not contain text content."
    );
  }

  let parsed: McpRowsResult<T>;

  try {
    parsed = JSON.parse(text.text) as McpRowsResult<T>;
  } catch {
    throw new Error(
      "Unable to parse CockroachDB MCP response."
    );
  }

  if (!Array.isArray(parsed.rows)) {
    throw new Error(
      "CockroachDB MCP response did not contain rows."
    );
  }

  return parsed.rows;
}
