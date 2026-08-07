import { pipeline } from "@huggingface/transformers";
import { toVectorLiteral } from "../../src/server/mcp/vector";

async function main() {
  const extractor = await pipeline(
    "feature-extraction",
    process.env.LOCAL_EMBEDDING_MODEL ??
      "Xenova/multilingual-e5-large",
    { dtype: "q8" }
  );

  const output = await extractor(
    "query: Pump vibrates heavily and pressure drops after it has been running for about twenty minutes.",
    {
      pooling: "mean",
      normalize: true,
    }
  );

  const embedding = output.tolist()[0];
  const literal = toVectorLiteral(embedding);

  console.log("Dimensions:", embedding.length);
  console.log("Vector literal characters:", literal.length);
  console.log(
    "Under MCP 16,384 limit:",
    literal.length < 16384
  );
}

main().catch(console.error);
