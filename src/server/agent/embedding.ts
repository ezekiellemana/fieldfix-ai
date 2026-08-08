import { pipeline } from "@huggingface/transformers";

type EmbeddingOutput = {
  tolist(): number[][];
};

type FeatureExtractor = (
  text: string,
  options: {
    pooling: "mean";
    normalize: true;
  }
) => Promise<EmbeddingOutput>;

let extractorPromise:
  | Promise<FeatureExtractor>
  | null = null;

async function getExtractor():
  Promise<FeatureExtractor> {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      process.env.LOCAL_EMBEDDING_MODEL ??
        "Xenova/multilingual-e5-large",
      {
        dtype: "q8",
      }
    ).then(
      (model) =>
        model as unknown as FeatureExtractor
    );
  }

  return extractorPromise;
}

async function createEmbedding(
  prefix: "query" | "passage",
  text: string
): Promise<number[]> {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error(
      "Cannot create embedding for empty text."
    );
  }

  const extractor = await getExtractor();

  const output = await extractor(
    `${prefix}: ${trimmed}`,
    {
      pooling: "mean",
      normalize: true,
    }
  );

  const embedding = output.tolist()[0];

  if (
    !Array.isArray(embedding) ||
    embedding.length !== 1024
  ) {
    throw new Error(
      `Expected 1024 embedding dimensions, got ${embedding?.length}.`
    );
  }

  return embedding;
}

export function createQueryEmbedding(
  text: string
): Promise<number[]> {
  return createEmbedding("query", text);
}

export function createPassageEmbedding(
  text: string
): Promise<number[]> {
  return createEmbedding("passage", text);
}
