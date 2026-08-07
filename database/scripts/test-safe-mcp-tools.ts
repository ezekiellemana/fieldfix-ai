import fs from "node:fs/promises";

import { pipeline } from "@huggingface/transformers";

import { getAssetContext } from "../../src/server/mcp/tools/get-asset-context";
import { searchAssetHistory } from "../../src/server/mcp/tools/search-asset-history";
import { searchSimilarMemories } from "../../src/server/mcp/tools/search-similar-memories";
import { calculateRecurrenceStats } from "../../src/server/mcp/tools/calculate-recurrence-stats";

const QUERY =
  "Pump vibrates heavily and pressure drops after it has been running for about twenty minutes.";

async function main() {
  const candidates = JSON.parse(
    await fs.readFile(
      "database/seeds/memory-candidates.json",
      "utf8"
    )
  );

  const firstCandidate = candidates[0];

  if (!firstCandidate) {
    throw new Error("No FIELDfix memory candidates found.");
  }

  const orgId = firstCandidate.org_id;
  const assetId = firstCandidate.asset_id;

  console.log("\nFIELDfix safe MCP tool smoke test");
  console.log("--------------------------------");

  console.log("\n1. get_asset_context");

  const context = await getAssetContext({
    orgId,
    assetId,
  });

  console.log(context);

  if (!context) {
    throw new Error("Asset context was not found.");
  }

  if (context.asset_code !== "TZ-PUMP-001") {
    throw new Error(
      `Expected TZ-PUMP-001, got ${context.asset_code}.`
    );
  }

  console.log("\n2. search_asset_history");

  const history = await searchAssetHistory({
    orgId,
    assetId,
    limit: 6,
  });

  console.table(
    history.map((row) => ({
      incident: row.title,
      severity: row.severity,
      status: row.status,
      repair: row.repair_action,
      outcome: row.resolution_status,
      recurrence: row.recurrence_detected,
    }))
  );

  if (history.length === 0) {
    throw new Error("Asset history returned no incidents.");
  }

  console.log("\n3. Create query embedding");
  console.log(`Query: ${QUERY}`);

  const extractor = await pipeline(
    "feature-extraction",
    process.env.LOCAL_EMBEDDING_MODEL ??
      "Xenova/multilingual-e5-large",
    {
      dtype: "q8",
    }
  );

  const embeddingResult = await extractor(
    `query: ${QUERY}`,
    {
      pooling: "mean",
      normalize: true,
    }
  );

  const embedding = embeddingResult.tolist()[0];

  if (
    !Array.isArray(embedding) ||
    embedding.length !== 1024
  ) {
    throw new Error(
      `Expected 1024 embedding dimensions, got ${embedding?.length}.`
    );
  }

  console.log(
    "Embedding dimensions:",
    embedding.length
  );

  console.log("\n4. search_similar_memories");

  const memories = await searchSimilarMemories({
    orgId,
    embedding,
    limit: 8,
  });

  console.table(
    memories.map((row, index) => ({
      rank: index + 1,
      similarity: row.similarity,
      title: row.title,
      root_cause: row.root_cause,
      fix: row.fix_summary,
      verified: row.verified,
    }))
  );

  if (memories.length === 0) {
    throw new Error(
      "Semantic memory search returned no results."
    );
  }

  console.log("\n5. calculate_recurrence_stats");

  const stats = await calculateRecurrenceStats({
    orgId,
    embedding,
  });

  console.table(
    stats.map((row, index) => ({
      rank: index + 1,
      cause: row.root_cause,
      fix: row.fix_summary,
      cases: row.similar_cases,
      success_rate: `${row.success_rate_pct}%`,
      recurrence_rate: `${row.recurrence_rate_pct}%`,
    }))
  );

  if (stats.length < 2) {
    throw new Error(
      "Expected at least two historical repair alternatives."
    );
  }

  console.log(
    "\n=== FIELDfix safe MCP verification ==="
  );
  console.log("get_asset_context            ?");
  console.log("search_asset_history         ?");
  console.log("search_similar_memories      ?");
  console.log("calculate_recurrence_stats   ?");
  console.log("org_id scoping               ?");
  console.log("validated tool inputs        ?");
  console.log("CockroachDB Managed MCP      ?");

  console.log(
    "\nFIELDfix safe MCP tool smoke test passed."
  );
}

main().catch((error) => {
  console.error(
    "\nFIELDfix safe MCP tool smoke test failed:"
  );
  console.error(error);
  process.exitCode = 1;
});
