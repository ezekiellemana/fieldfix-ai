import fs from "node:fs/promises";

import { runFieldfixAgent } from "../../src/server/agent/orchestrator";

async function main() {
  const candidates = JSON.parse(
    await fs.readFile(
      "database/seeds/memory-candidates.json",
      "utf8"
    )
  );

  const reference =
    candidates.find(
      (item: { title?: string }) =>
        item.title ===
        "Heavy vibration and delayed pressure loss"
    ) ?? candidates[0];

  if (!reference) {
    throw new Error(
      "No demo incident available."
    );
  }

  const result =
    await runFieldfixAgent({
      orgId: reference.org_id,
      incidentId:
        reference.incident_id,
    });

  console.log(
    "\n=== FIELDfix reasoning ==="
  );

  console.log(
    result.recommendation.reasoning
  );

  console.log(
    "\nDiagnosis remains:"
  );

  console.log(
    result.recommendation.diagnosis
  );

  console.log(
    "\nApproval:"
  );

  console.log(
    result.recommendation.approval
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
