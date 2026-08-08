import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { z } from "zod";

const inputSchema = z.object({
  incidentTitle: z.string().min(1),
  symptoms: z.string().min(1),

  assetCode: z.string().min(1),
  assetType: z.string().min(1),

  rootCause: z.string().nullable(),
  recommendedRepair: z.string().nullable(),

  confidence: z.number().min(0).max(1),

  similarCases: z.number().int().min(0),
  successfulCases: z.number().int().min(0),
  recurrenceCases: z.number().int().min(0),

  successRatePct: z.number().min(0).max(100),
  recurrenceRatePct: z.number().min(0).max(100),

  lesson: z.string().nullable(),
});

const outputSchema = z.object({
  explanation: z.string().min(1).max(1800),
  whyThisRepair: z.string().min(1).max(1800),
  caution: z.string().min(1).max(1200),

  supervisorChecks: z
    .array(z.string().min(1).max(300))
    .min(1)
    .max(5),
});

export type BedrockReasoningInput =
  z.infer<typeof inputSchema>;

export type BedrockReasoningOutput =
  z.infer<typeof outputSchema>;

function extractJson(text: string): string {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {
    throw new Error(
      "Bedrock response did not contain JSON."
    );
  }

  return cleaned.slice(start, end + 1);
}

export function createDeterministicExplanation(
  rawInput: BedrockReasoningInput
): BedrockReasoningOutput {
  const input = inputSchema.parse(rawInput);

  return {
    explanation:
      `FIELDfix found ${input.similarCases} comparable historical cases for ${input.rootCause ?? "the probable failure mode"}. ` +
      `${input.successfulCases} were successfully resolved using the recommended approach, with ${input.recurrenceCases} recorded recurrences.`,

    whyThisRepair:
      `Historical outcome evidence shows a ${input.successRatePct}% success rate and ${input.recurrenceRatePct}% recurrence rate for: ${input.recommendedRepair ?? "the recommended repair"}.`,

    caution:
      "This is a decision-support recommendation. A qualified supervisor must verify field conditions before repair execution.",

    supervisorChecks: [
      "Confirm the reported symptoms match current field conditions.",
      "Verify isolation and maintenance safety procedures.",
      "Confirm the proposed repair is appropriate for the specific asset.",
    ],
  };
}

export async function explainRecommendationWithBedrock(
  rawInput: BedrockReasoningInput
): Promise<BedrockReasoningOutput> {
  const input = inputSchema.parse(rawInput);

  const region =
    process.env.AWS_REGION ??
    "eu-central-1";

  const modelId =
    process.env.BEDROCK_REASONING_MODEL;

  if (!modelId) {
    throw new Error(
      "BEDROCK_REASONING_MODEL is not configured."
    );
  }

  const client =
    new BedrockRuntimeClient({
      region,
    });

  const command =
    new ConverseCommand({
      modelId,

      system: [
        {
          text: `
You are FIELDfix's evidence explanation layer.

The deterministic FIELDfix outcome engine has already selected
the diagnosis and repair.

You MUST NOT change the root cause.
You MUST NOT substitute another repair.
You MUST NOT claim that physical repair has been performed.

Use only the supplied historical evidence.

Provide concise evidence-based rationale, not hidden
chain-of-thought.

Return ONLY valid JSON with this exact structure:

{
  "explanation": "string",
  "whyThisRepair": "string",
  "caution": "string",
  "supervisorChecks": ["string"]
}
          `.trim(),
        },
      ],

      messages: [
        {
          role: "user",
          content: [
            {
              text: JSON.stringify(
                input,
                null,
                2
              ),
            },
          ],
        },
      ],

      inferenceConfig: {
        maxTokens: 600,
        temperature: 0.1,
        topP: 0.9,
      },
    });

  const response =
    await client.send(command);

  const content =
    response.output?.message?.content ??
    [];

  const text = content
    .map((block) => {
      if (
        "text" in block &&
        typeof block.text === "string"
      ) {
        return block.text;
      }

      return "";
    })
    .join("\n")
    .trim();

  if (!text) {
    throw new Error(
      "Amazon Bedrock returned no explanation text."
    );
  }

  const json = JSON.parse(
    extractJson(text)
  );

  return outputSchema.parse(json);
}
