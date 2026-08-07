import { z } from "zod";

export const embeddingSchema = z
  .array(z.number().finite())
  .length(1024);

export function toVectorLiteral(
  embedding: number[]
): string {
  const vector = embeddingSchema.parse(embedding);

  const compact = vector.map((value) =>
    Number(value.toFixed(6))
  );

  return `[${compact.join(",")}]`;
}
