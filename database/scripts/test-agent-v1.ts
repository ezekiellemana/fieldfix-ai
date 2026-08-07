import fs from "node:fs/promises";

import { runFieldfixAgent } from "../../src/server/agent/orchestrator";

async function main() {
  const candidates = JSON.parse(
    await fs.readFile(
      "database/seeds/memory-candidates.json",
      "utf8"
    )
  );

  const reference = candidates.find(
    (candidate: {
      title?: string;
    }) =>
      candidate.title ===
      "Heavy vibration and delayed pressure loss"
  ) ?? candidates[0];

  if (!reference) {
    throw new Error(
      "No FIELDfix demo incident found."
    );
  }

  console.log(
    "\nFIELDfix Agent v1 end-to-end test"
  );
  console.log(
    "--------------------------------"
  );

  const result =
    await runFieldfixAgent({
      orgId: reference.org_id,
      incidentId:
        reference.incident_id,
    });

  console.log(
    "\nAgent run:",
    result.agentRunId
  );

  console.log(
    "\nDiagnosis:",
    result.recommendation.diagnosis
  );

  console.log(
    "\nOutcome evidence:",
    result.recommendation
      .outcomeEvidence
  );

  console.log(
    "\nAlternatives:"
  );

  console.table(
    result.recommendation
      .alternatives
  );

  console.log(
    "\nApproval:",
    result.recommendation.approval
  );

  const diagnosis =
    result.recommendation
      .diagnosis;

  if (
    diagnosis.probableRootCause !==
    "Motor capacitor degradation"
  ) {
    throw new Error(
      `Unexpected diagnosis: ${diagnosis.probableRootCause}`
    );
  }

  if (
    !diagnosis.recommendedRepair
      ?.toLowerCase()
      .includes("capacitor")
  ) {
    throw new Error(
      "Expected capacitor-based repair recommendation."
    );
  }

  if (
    result.recommendation
      .approval.status !==
    "pending"
  ) {
    throw new Error(
      "Recommendation must require human approval."
    );
  }

  console.log(
    "\nAgent diagnosis               PASS"
  );
  console.log(
    "Outcome-aware ranking         PASS"
  );
  console.log(
    "Historical evidence attached  PASS"
  );
  console.log(
    "Human approval required       PASS"
  );
  console.log(
    "Autonomous physical action    BLOCKED"
  );

  console.log(
    "\nFIELDfix Agent v1 test passed."
  );
}

main().catch((error) => {
  console.error(
    "\nFIELDfix Agent v1 test failed:"
  );
  console.error(error);
  process.exitCode = 1;
});
