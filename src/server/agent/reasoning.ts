import {
  createDeterministicExplanation,
  explainRecommendationWithBedrock,
  type BedrockReasoningInput,
  type BedrockReasoningOutput,
} from "./bedrock";

export type ReasoningProvider =
  | "amazon-bedrock"
  | "deterministic"
  | "deterministic-fallback";

export type RecommendationReasoning =
  BedrockReasoningOutput & {
    provider: ReasoningProvider;
    modelId: string | null;
    fallbackUsed: boolean;
    fallbackReason: string | null;
  };

function bedrockEnabled(): boolean {
  return (
    process.env.BEDROCK_REASONING_ENABLED
      ?.trim()
      .toLowerCase() === "true"
  );
}

export async function resolveRecommendationReasoning(
  input: BedrockReasoningInput
): Promise<RecommendationReasoning> {
  const deterministic =
    createDeterministicExplanation(input);

  if (!bedrockEnabled()) {
    return {
      ...deterministic,
      provider: "deterministic",
      modelId: null,
      fallbackUsed: false,
      fallbackReason: null,
    };
  }

  try {
    const explanation =
      await explainRecommendationWithBedrock(input);

    return {
      ...explanation,
      provider: "amazon-bedrock",
      modelId:
        process.env.BEDROCK_REASONING_MODEL ??
        null,
      fallbackUsed: false,
      fallbackReason: null,
    };
  } catch (error) {
    return {
      ...deterministic,
      provider: "deterministic-fallback",
      modelId:
        process.env.BEDROCK_REASONING_MODEL ??
        null,
      fallbackUsed: true,
      fallbackReason:
        error instanceof Error
          ? error.name
          : "BEDROCK_REASONING_ERROR",
    };
  }
}
