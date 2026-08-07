import { z } from "zod";

import { createQueryEmbedding } from "./embedding";

import {
  completeAgentRun,
  createAgentRun,
  failAgentRun,
  withAgentToolTrace,
} from "../mcp/observability";

import { calculateRecurrenceStats } from "../mcp/tools/calculate-recurrence-stats";
import { getAssetContext } from "../mcp/tools/get-asset-context";
import { getIncidentContext } from "../mcp/tools/get-incident-context";
import { searchAssetHistory } from "../mcp/tools/search-asset-history";
import { searchSimilarMemories } from "../mcp/tools/search-similar-memories";

const inputSchema = z.object({
  orgId: z.string().uuid(),
  incidentId: z.string().uuid(),
});

export type RunFieldfixAgentInput =
  z.infer<typeof inputSchema>;

function numberValue(
  value: string | number | null
): number {
  if (value == null) {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

export async function runFieldfixAgent(
  input: RunFieldfixAgentInput
) {
  const { orgId, incidentId } =
    inputSchema.parse(input);

  let agentRunId: string | null = null;

  try {
    agentRunId = await createAgentRun({
      orgId,
      incidentId,
      trigger: "incident_diagnosis",
      modelId: "fieldfix-outcome-engine-v1",
    });

    const incident =
      await withAgentToolTrace({
        agentRunId,
        orgId,
        toolName: "get_incident_context",
        toolInput: {
          orgId,
          incidentId,
        },
        execute: () =>
          getIncidentContext({
            orgId,
            incidentId,
          }),
      });

    if (!incident) {
      throw new Error(
        "Incident was not found."
      );
    }

    const asset =
      await withAgentToolTrace({
        agentRunId,
        orgId,
        toolName: "get_asset_context",
        toolInput: {
          orgId,
          assetId: incident.asset_id,
        },
        execute: () =>
          getAssetContext({
            orgId,
            assetId: incident.asset_id,
          }),
      });

    if (!asset) {
      throw new Error(
        "Asset was not found."
      );
    }

    const history =
      await withAgentToolTrace({
        agentRunId,
        orgId,
        toolName: "search_asset_history",
        toolInput: {
          orgId,
          assetId: incident.asset_id,
          limit: 10,
        },
        execute: () =>
          searchAssetHistory({
            orgId,
            assetId: incident.asset_id,
            limit: 10,
          }),
      });

    const embedding =
      await withAgentToolTrace({
        agentRunId,
        orgId,
        toolName: "create_query_embedding",
        toolInput: {
          text: incident.symptom_text,
        },
        execute: () =>
          createQueryEmbedding(
            incident.symptom_text
          ),
      });

    const memories =
      await withAgentToolTrace({
        agentRunId,
        orgId,
        toolName: "search_similar_memories",
        toolInput: {
          orgId,
          embedding,
          limit: 8,
        },
        execute: () =>
          searchSimilarMemories({
            orgId,
            embedding,
            limit: 8,
          }),
      });

    const recurrenceStats =
      await withAgentToolTrace({
        agentRunId,
        orgId,
        toolName:
          "calculate_recurrence_stats",
        toolInput: {
          orgId,
          embedding,
        },
        execute: () =>
          calculateRecurrenceStats({
            orgId,
            embedding,
          }),
      });

    if (recurrenceStats.length === 0) {
      throw new Error(
        "No outcome evidence was found."
      );
    }

    const ranked =
      recurrenceStats
        .map((row) => {
          const successRate =
            numberValue(
              row.success_rate_pct
            );

          const recurrenceRate =
            numberValue(
              row.recurrence_rate_pct
            );

          const similarity =
            numberValue(
              row.best_similarity
            );

          const score =
            successRate * 0.6 +
            (100 - recurrenceRate) *
              0.3 +
            similarity * 10;

          return {
            ...row,
            successRate,
            recurrenceRate,
            similarity,
            score,
          };
        })
        .sort(
          (a, b) =>
            b.score - a.score
        );

    const best = ranked[0];

    if (!best) {
      throw new Error(
        "Unable to rank repair evidence."
      );
    }

    const confidence = Math.min(
      0.95,
      Math.max(
        0.5,
        0.5 +
          best.successRate * 0.003 +
          (100 -
            best.recurrenceRate) *
            0.001 +
          Math.min(
            Number(best.similar_cases),
            50
          ) *
            0.001
      )
    );

    const recommendation = {
      version: "fieldfix-agent-v1",

      incident: {
        id: incident.id,
        title: incident.title,
        symptoms:
          incident.symptom_text,
        severity: incident.severity,
      },

      asset: {
        id: asset.id,
        code: asset.asset_code,
        type: asset.asset_type,
        model: asset.model,
        site: asset.site_name,
        criticality:
          asset.criticality,
      },

      diagnosis: {
        probableRootCause:
          best.root_cause,
        recommendedRepair:
          best.fix_summary,
        confidence:
          Number(
            confidence.toFixed(3)
          ),
      },

      outcomeEvidence: {
        similarCases:
          Number(best.similar_cases),
        successfulCases:
          Number(
            best.successful_cases
          ),
        recurrenceCases:
          Number(
            best.recurrence_cases
          ),
        successRatePct:
          best.successRate,
        recurrenceRatePct:
          best.recurrenceRate,
        bestSimilarity:
          best.similarity,
        lesson:
          best.representative_lesson,
      },

      alternatives: ranked
        .slice(1, 4)
        .map((candidate) => ({
          rootCause:
            candidate.root_cause,
          repair:
            candidate.fix_summary,
          similarCases:
            Number(
              candidate.similar_cases
            ),
          successRatePct:
            candidate.successRate,
          recurrenceRatePct:
            candidate.recurrenceRate,
          similarity:
            candidate.similarity,
        })),

      evidence: {
        memoryIds: memories.map(
          (memory) => memory.id
        ),
        incidentIds: memories.map(
          (memory) =>
            memory.incident_id
        ),
        assetHistoryRows:
          history.length,
      },

      approval: {
        required: true,
        status: "pending",
        requiredRole: "supervisor",
        reason:
          "FIELDfix recommendations require human approval before repair execution.",
      },

      safety: {
        autonomousExecution: false,
        physicalControl: false,
      },

      syntheticDemoEvidence: true,
    };

    await completeAgentRun({
      runId: agentRunId,
      orgId,
      confidence,
      recommendation,
    });

    return {
      agentRunId,
      recommendation,
    };
  } catch (error) {
    if (agentRunId) {
      await failAgentRun({
        runId: agentRunId,
        orgId,
        errorCode:
          "AGENT_ORCHESTRATION_FAILED",
      }).catch(() => {});
    }

    throw error;
  }
}
