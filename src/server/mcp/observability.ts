import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

import { z } from "zod";

import { createCockroachMcpClient } from "./client";
import {
  sqlJson,
  sqlNullableNumber,
  sqlNullableText,
  sqlText,
} from "./sql";

const runBaseSchema = z.object({
  orgId: z.string().uuid(),
  incidentId: z.string().uuid(),
});

const createRunSchema = runBaseSchema.extend({
  trigger: z.string().min(1).max(80),
  modelId: z.string().min(1).max(255).nullable().optional(),
});

const completeRunSchema = z.object({
  runId: z.string().uuid(),
  orgId: z.string().uuid(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  recommendation: z.unknown().nullable().optional(),
});

const failRunSchema = z.object({
  runId: z.string().uuid(),
  orgId: z.string().uuid(),
  errorCode: z.string().min(1).max(120),
});

const auditSchema = z.object({
  orgId: z.string().uuid(),
  event: z.string().min(1).max(160),
  entityType: z.string().min(1).max(80),
  entityId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const traceSchema = z.object({
  agentRunId: z.string().uuid(),
  orgId: z.string().uuid(),
  toolName: z.string().min(1).max(120),
});

async function insertViaMcp(
  query: string
): Promise<void> {
  const client = await createCockroachMcpClient();

  try {
    const result = await client.callTool({
      name: "insert_rows",
      arguments: {
        database: "fieldfix",
        query,
      },
    });

    if (result.isError) {
      throw new Error(
        "CockroachDB MCP insert_rows returned an error."
      );
    }
  } finally {
    await client.close().catch(() => {});
  }
}

export function summarizeForTrace(
  value: unknown,
  maxLength = 1200
): string {
  const seen = new WeakSet<object>();

  const json = JSON.stringify(
    value,
    (key, currentValue) => {
      if (
        key.toLowerCase().includes("embedding") &&
        Array.isArray(currentValue)
      ) {
        return `[embedding:${currentValue.length} dimensions]`;
      }

      if (
        currentValue &&
        typeof currentValue === "object"
      ) {
        if (seen.has(currentValue)) {
          return "[circular]";
        }

        seen.add(currentValue);
      }

      return currentValue;
    }
  );

  const text = json ?? String(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...[truncated]`;
}

export async function recordAuditEvent(
  input: z.input<typeof auditSchema>
): Promise<string> {
  const parsed = auditSchema.parse(input);
  const id = randomUUID();

  await insertViaMcp(`
    INSERT INTO audit_events (
      id,
      org_id,
      actor_type,
      actor_id,
      event,
      entity_type,
      entity_id,
      metadata
    )
    VALUES (
      '${id}',
      '${parsed.orgId}',
      'agent',
      NULL,
      ${sqlText(parsed.event)},
      ${sqlText(parsed.entityType)},
      ${parsed.entityId ? `'${parsed.entityId}'` : "NULL"},
      ${sqlJson(parsed.metadata)}
    )
  `);

  return id;
}

export async function createAgentRun(
  input: z.input<typeof createRunSchema>
): Promise<string> {
  const parsed = createRunSchema.parse(input);
  const runId = randomUUID();

  await insertViaMcp(`
    INSERT INTO agent_runs (
      id,
      org_id,
      incident_id,
      trigger,
      model_id,
      status
    )
    VALUES (
      '${runId}',
      '${parsed.orgId}',
      '${parsed.incidentId}',
      ${sqlText(parsed.trigger)},
      ${sqlNullableText(parsed.modelId)},
      'running'
    )
  `);

  await recordAuditEvent({
    orgId: parsed.orgId,
    event: "agent.run.started",
    entityType: "agent_run",
    entityId: runId,
    metadata: {
      trigger: parsed.trigger,
      modelId: parsed.modelId ?? null,
    },
  });

  return runId;
}

export async function completeAgentRun(
  input: z.input<typeof completeRunSchema>
): Promise<void> {
  const parsed = completeRunSchema.parse(input);

  await insertViaMcp(`
    INSERT INTO agent_runs (
      id,
      org_id,
      incident_id,
      trigger,
      model_id,
      status,
      confidence,
      recommendation,
      started_at,
      completed_at,
      error_code,
      created_at
    )
    SELECT
      id,
      org_id,
      incident_id,
      trigger,
      model_id,
      'completed',
      ${sqlNullableNumber(parsed.confidence)},
      ${
        parsed.recommendation == null
          ? "NULL"
          : sqlJson(parsed.recommendation)
      },
      started_at,
      now(),
      NULL,
      created_at
    FROM agent_runs
    WHERE id = '${parsed.runId}'
      AND org_id = '${parsed.orgId}'
    ON CONFLICT (id)
    DO UPDATE SET
      status = excluded.status,
      confidence = excluded.confidence,
      recommendation = excluded.recommendation,
      completed_at = excluded.completed_at,
      error_code = NULL
  `);

  await recordAuditEvent({
    orgId: parsed.orgId,
    event: "agent.run.completed",
    entityType: "agent_run",
    entityId: parsed.runId,
    metadata: {
      confidence: parsed.confidence ?? null,
    },
  });
}

export async function failAgentRun(
  input: z.input<typeof failRunSchema>
): Promise<void> {
  const parsed = failRunSchema.parse(input);

  await insertViaMcp(`
    INSERT INTO agent_runs (
      id,
      org_id,
      incident_id,
      trigger,
      model_id,
      status,
      confidence,
      recommendation,
      started_at,
      completed_at,
      error_code,
      created_at
    )
    SELECT
      id,
      org_id,
      incident_id,
      trigger,
      model_id,
      'failed',
      confidence,
      recommendation,
      started_at,
      now(),
      ${sqlText(parsed.errorCode)},
      created_at
    FROM agent_runs
    WHERE id = '${parsed.runId}'
      AND org_id = '${parsed.orgId}'
    ON CONFLICT (id)
    DO UPDATE SET
      status = excluded.status,
      completed_at = excluded.completed_at,
      error_code = excluded.error_code
  `);

  await recordAuditEvent({
    orgId: parsed.orgId,
    event: "agent.run.failed",
    entityType: "agent_run",
    entityId: parsed.runId,
    metadata: {
      errorCode: parsed.errorCode,
    },
  });
}

async function recordToolCall(input: {
  agentRunId: string;
  toolName: string;
  inputSummary: string;
  outputSummary: string;
  durationMs: number;
  success: boolean;
}): Promise<string> {
  const id = randomUUID();

  await insertViaMcp(`
    INSERT INTO agent_tool_calls (
      id,
      agent_run_id,
      tool_name,
      input_summary,
      output_summary,
      duration_ms,
      success
    )
    VALUES (
      '${id}',
      '${input.agentRunId}',
      ${sqlText(input.toolName)},
      ${sqlText(input.inputSummary)},
      ${sqlText(input.outputSummary)},
      ${Math.max(0, Math.round(input.durationMs))},
      ${input.success ? "true" : "false"}
    )
  `);

  return id;
}

export async function withAgentToolTrace<T>(input: {
  agentRunId: string;
  orgId: string;
  toolName: string;
  toolInput: unknown;
  execute: () => Promise<T>;
}): Promise<T> {
  const parsed = traceSchema.parse({
    agentRunId: input.agentRunId,
    orgId: input.orgId,
    toolName: input.toolName,
  });

  const started = performance.now();

  let output: T | undefined;
  let operationError: unknown;

  try {
    output = await input.execute();
  } catch (error) {
    operationError = error;
  }

  const durationMs = performance.now() - started;
  const success = operationError == null;

  const inputSummary =
    summarizeForTrace(input.toolInput);

  const outputSummary = success
    ? summarizeForTrace(output)
    : summarizeForTrace({
        error:
          operationError instanceof Error
            ? operationError.message
            : "Unknown tool error",
      });

  let traceError: unknown;

  try {
    const toolCallId = await recordToolCall({
      agentRunId: parsed.agentRunId,
      toolName: parsed.toolName,
      inputSummary,
      outputSummary,
      durationMs,
      success,
    });

    await recordAuditEvent({
      orgId: parsed.orgId,
      event: success
        ? "agent.tool.completed"
        : "agent.tool.failed",
      entityType: "agent_tool_call",
      entityId: toolCallId,
      metadata: {
        toolName: parsed.toolName,
        durationMs: Math.round(durationMs),
        success,
      },
    });
  } catch (error) {
    traceError = error;
  }

  if (operationError) {
    throw operationError;
  }

  if (traceError) {
    throw traceError;
  }

  return output as T;
}
