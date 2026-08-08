
import { runFieldfixAgent } from "../../src/server/agent/orchestrator";
import { createCockroachMcpClient } from "../../src/server/mcp/client";
import { parseMcpRows } from "../../src/server/mcp/result";

const LEARNED_INCIDENT_ID =
  "d5000000-0000-4000-8000-000000000001";

const NEW_INCIDENT_ID =
  "d5000000-0000-4000-8000-000000000010";

const SYMPTOMS =
  "Pump develops a sharp bearing squeal and the drive-end bearing housing becomes unusually hot after about ten minutes of operation.";

const EXPECTED_CAUSE =
  "Drive-end bearing lubrication breakdown";

async function main() {
  console.log(
    "\nFIELDfix Learned-Memory Agent Golden Test"
  );
  console.log(
    "========================================="
  );

  const client =
    await createCockroachMcpClient();

  let orgId: string;
  let assetId: string;
  let learnedMemoryId: string;

  try {
    const learnedResult =
      await client.callTool({
        name: "select_query",
        arguments: {
          database: "fieldfix",
          query: `
            SELECT
              id,
              org_id,
              asset_id
            FROM memory_episodes
            WHERE incident_id = '${LEARNED_INCIDENT_ID}'
              AND verified = true
            LIMIT 1
          `,
        },
      });

    const learned =
      parseMcpRows<{
        id: string;
        org_id: string;
        asset_id: string;
      }>(learnedResult)[0];

    if (!learned) {
      throw new Error(
        "Learned Day 5 memory was not found."
      );
    }

    orgId = learned.org_id;
    assetId = learned.asset_id;
    learnedMemoryId = learned.id;

    console.log(
      "\n1. Learned memory available:",
      learnedMemoryId
    );

    console.log(
      "\n2. Create NEW similar incident"
    );

    await client.callTool({
      name: "insert_rows",
      arguments: {
        database: "fieldfix",
        query: `
          INSERT INTO incidents (
            id,
            org_id,
            asset_id,
            title,
            symptom_text,
            severity,
            status,
            started_at,
            created_at,
            updated_at
          )
          VALUES (
            '${NEW_INCIDENT_ID}',
            '${orgId}',
            '${assetId}',
            'New bearing squeal and overheating incident',
            '${SYMPTOMS}',
            'high',
            'diagnosing',
            now(),
            now(),
            now()
          )
          ON CONFLICT (id)
          DO UPDATE SET
            title = excluded.title,
            symptom_text = excluded.symptom_text,
            severity = excluded.severity,
            status = excluded.status,
            updated_at = now()
        `,
      },
    });

    console.log(
      "New incident persisted."
    );
  } finally {
    await client.close().catch(() => {});
  }

  console.log(
    "\n3. Run actual FIELDfix agent"
  );

  const result =
    await runFieldfixAgent({
      orgId: orgId!,
      incidentId: NEW_INCIDENT_ID,
    });

  console.log(
    "\nDiagnosis:",
    result.recommendation.diagnosis
  );

  console.log(
    "\nOutcome evidence:",
    result.recommendation.outcomeEvidence
  );

  console.log(
    "\nApproval:",
    result.recommendation.approval
  );

  const memoryUsed =
    result.recommendation.evidence.memoryIds.includes(
      learnedMemoryId!
    );

  console.log(
    "\nLearned memory cited:",
    memoryUsed
  );

  if (!memoryUsed) {
    throw new Error(
      "Agent did not retrieve the newly learned memory."
    );
  }

  if (
    result.recommendation.diagnosis
      .probableRootCause !==
    EXPECTED_CAUSE
  ) {
    throw new Error(
      `Expected ${EXPECTED_CAUSE}, got ${result.recommendation.diagnosis.probableRootCause}`
    );
  }

  if (
    !result.recommendation.diagnosis
      .recommendedRepair
      ?.toLowerCase()
      .includes("bearing")
  ) {
    throw new Error(
      "Agent did not recommend the learned bearing repair."
    );
  }

  if (
    result.recommendation.approval.status !==
    "pending"
  ) {
    throw new Error(
      "Human approval gate was not preserved."
    );
  }

  console.log(
    "\n=== FIELDfix closed learning loop ==="
  );

  console.log(
    "Previous verified outcome learned     PASS"
  );
  console.log(
    "New independent incident created      PASS"
  );
  console.log(
    "Learned memory retrieved by agent     PASS"
  );
  console.log(
    "New root cause diagnosed              PASS"
  );
  console.log(
    "Learned repair recommended            PASS"
  );
  console.log(
    "Supervisor approval still required    PASS"
  );

  console.log(
    "\nFIELDfix CLOSED LEARNING LOOP PASSED."
  );
}

main().catch((error) => {
  console.error(
    "\nFIELDfix closed learning loop FAILED:"
  );

  console.error(error);
  process.exitCode = 1;
});
