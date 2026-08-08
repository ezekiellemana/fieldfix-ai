import { randomUUID } from "node:crypto";

import { z } from "zod";

import { createPassageEmbedding } from "../agent/embedding";
import { createCockroachMcpClient } from "../mcp/client";
import { recordAuditEvent } from "../mcp/observability";
import { parseMcpRows } from "../mcp/result";
import {
  sqlNullableText,
  sqlText,
} from "../mcp/sql";
import { toVectorLiteral } from "../mcp/vector";

const inputSchema = z.object({
  orgId: z.string().uuid(),
  incidentId: z.string().uuid(),

  verifiedRootCause: z
    .string()
    .min(1)
    .max(500),

  lesson: z
    .string()
    .min(1)
    .max(1500),
});

export type LearnFromVerifiedOutcomeInput =
  z.infer<typeof inputSchema>;

type ExistingMemoryRow = {
  id: string;
};

type LearningSourceRow = {
  incident_id: string;
  asset_id: string;
  asset_type: string;
  asset_model: string | null;

  title: string;
  symptom_text: string;

  repair_description: string;
  approval_status: string;
  performed_at: string | null;

  resolution_status: string;
  downtime_minutes: number | null;
  recurrence_detected: boolean;
  days_to_recurrence: number | null;
  outcome_text: string;
  verified_at: string | null;
};

export type LearnedMemoryResult = {
  memoryId: string;
  created: boolean;
  canonicalText: string;
};

function qualityScore(
  resolutionStatus: string
): number {
  switch (resolutionStatus) {
    case "successful":
      return 0.95;

    case "failed":
      return 0.9;

    case "partial":
      return 0.85;

    default:
      return 0.7;
  }
}

export async function learnFromVerifiedOutcome(
  input: LearnFromVerifiedOutcomeInput
): Promise<LearnedMemoryResult> {
  const parsed = inputSchema.parse(input);

  const client =
    await createCockroachMcpClient();

  try {
    const existingResult =
      await client.callTool({
        name: "select_query",
        arguments: {
          database: "fieldfix",
          query: `
            SELECT id
            FROM memory_episodes
            WHERE org_id = '${parsed.orgId}'
              AND incident_id = '${parsed.incidentId}'
            ORDER BY created_at DESC
            LIMIT 1
          `,
        },
      });

    const existing =
      parseMcpRows<ExistingMemoryRow>(
        existingResult
      )[0];

    if (existing) {
      return {
        memoryId: existing.id,
        created: false,
        canonicalText:
          "Existing memory episode reused.",
      };
    }

    const sourceResult =
      await client.callTool({
        name: "select_query",
        arguments: {
          database: "fieldfix",
          query: `
            SELECT
              i.id AS incident_id,
              i.asset_id,
              a.asset_type,
              a.model AS asset_model,

              i.title,
              i.symptom_text,

              ra.description
                AS repair_description,
              ra.approval_status,
              ra.performed_at,

              o.resolution_status,
              o.downtime_minutes,
              o.recurrence_detected,
              o.days_to_recurrence,
              o.outcome_text,
              o.verified_at

            FROM incidents AS i

            JOIN assets AS a
              ON a.id = i.asset_id
             AND a.org_id = i.org_id

            JOIN repair_actions AS ra
              ON ra.incident_id = i.id
             AND ra.org_id = i.org_id

            JOIN outcomes AS o
              ON o.incident_id = i.id
             AND o.org_id = i.org_id

            WHERE i.org_id = '${parsed.orgId}'
              AND i.id = '${parsed.incidentId}'

            ORDER BY
              ra.sequence_no DESC,
              ra.created_at DESC

            LIMIT 1
          `,
        },
      });

    const source =
      parseMcpRows<LearningSourceRow>(
        sourceResult
      )[0];

    if (!source) {
      throw new Error(
        "Incident does not have complete repair and outcome evidence."
      );
    }

    if (
      source.approval_status !==
      "approved"
    ) {
      throw new Error(
        "FIELDfix cannot learn from an unapproved repair."
      );
    }

    if (!source.performed_at) {
      throw new Error(
        "FIELDfix cannot learn before the repair is performed."
      );
    }

    if (!source.verified_at) {
      throw new Error(
        "FIELDfix cannot learn from an unverified outcome."
      );
    }

    if (
      source.resolution_status ===
      "monitoring"
    ) {
      throw new Error(
        "FIELDfix waits for a final outcome before creating durable memory."
      );
    }

    const outcomeSummary = [
      `Resolution: ${source.resolution_status}.`,
      `Outcome: ${source.outcome_text}`,
      `Recurrence detected: ${
        source.recurrence_detected
          ? "yes"
          : "no"
      }.`,
      source.days_to_recurrence == null
        ? null
        : `Days to recurrence: ${source.days_to_recurrence}.`,
      source.downtime_minutes == null
        ? null
        : `Downtime: ${source.downtime_minutes} minutes.`,
    ]
      .filter(Boolean)
      .join(" ");

    const canonicalText = [
      `Asset type: ${source.asset_type}.`,
      source.asset_model
        ? `Asset model: ${source.asset_model}.`
        : null,

      `Incident: ${source.title}.`,
      `Symptoms: ${source.symptom_text}`,

      `Verified root cause: ${parsed.verifiedRootCause}.`,

      `Approved repair: ${source.repair_description}`,

      outcomeSummary,

      `Lesson: ${parsed.lesson}`,
    ]
      .filter(Boolean)
      .join("\n");

    const embedding =
      await createPassageEmbedding(
        canonicalText
      );

    const vectorLiteral =
      toVectorLiteral(embedding);

    const memoryId = randomUUID();

    const score =
      qualityScore(
        source.resolution_status
      );

    await client.callTool({
      name: "insert_rows",
      arguments: {
        database: "fieldfix",
        query: `
          INSERT INTO memory_episodes (
            id,
            org_id,
            asset_id,
            incident_id,
            asset_type,
            asset_model,
            title,
            symptom_summary,
            root_cause,
            fix_summary,
            outcome_summary,
            lesson,
            canonical_text,
            embedding,
            quality_score,
            verified
          )
          VALUES (
            '${memoryId}',
            '${parsed.orgId}',
            '${source.asset_id}',
            '${source.incident_id}',
            ${sqlText(source.asset_type)},
            ${sqlNullableText(source.asset_model)},
            ${sqlText(
              `Learned outcome: ${source.title}`
            )},
            ${sqlText(source.symptom_text)},
            ${sqlText(
              parsed.verifiedRootCause
            )},
            ${sqlText(
              source.repair_description
            )},
            ${sqlText(outcomeSummary)},
            ${sqlText(parsed.lesson)},
            ${sqlText(canonicalText)},
            '${vectorLiteral}'::VECTOR(1024),
            ${score},
            true
          )
        `,
      },
    });

    await recordAuditEvent({
      orgId: parsed.orgId,
      event:
        "memory.episode.created",
      entityType:
        "memory_episode",
      entityId: memoryId,
      metadata: {
        incidentId:
          source.incident_id,
        assetId:
          source.asset_id,
        resolutionStatus:
          source.resolution_status,
        recurrenceDetected:
          source.recurrence_detected,
        qualityScore: score,
        source:
          "verified_repair_outcome",
      },
    });

    return {
      memoryId,
      created: true,
      canonicalText,
    };
  } finally {
    await client.close().catch(() => {});
  }
}
