import pg from "pg";
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const { Client } = pg;

const REGION = process.env.AWS_REGION ?? "eu-central-1";

const REASONING_MODEL =
  process.env.BEDROCK_REASONING_MODEL ??
  "global.amazon.nova-2-lite-v1:0";

const bedrock = new BedrockRuntimeClient({
  region: REGION,
});

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT
        current_database() AS database_name,
        current_user AS sql_user,
        now() AS connected_at
    `);

    return result.rows[0];
  } finally {
    await client.end().catch(() => {});
  }
}

async function checkReasoning() {
  const response = await bedrock.send(
    new ConverseCommand({
      modelId: REASONING_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              text: "Reply with exactly: FIELDfix reasoning OK",
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 30,
        temperature: 0,
      },
    })
  );

  return (
    response.output?.message?.content?.find(
      (item) => typeof item.text === "string"
    )?.text ?? null
  );
}

export const handler = async (event = {}) => {
  const action = event.action ?? "health";

  try {
    if (action === "database-health") {
      const database = await checkDatabase();

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          database,
        }),
      };
    }

    if (action === "reasoning-health") {
      const reasoning = await checkReasoning();

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          reasoning,
          model: REASONING_MODEL,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        service: "fieldfix-agent",
        region: REGION,
        availableActions: [
          "database-health",
          "reasoning-health"
        ]
      }),
    };
  } catch (error) {
    console.error("FIELDfix agent error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.name,
        message: error.message,
      }),
    };
  }
};
