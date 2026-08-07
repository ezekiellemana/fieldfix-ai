-- FIELDfix AI
-- Migration: 001_initial_schema
-- CockroachDB persistent + episodic memory foundation

CREATE TABLE IF NOT EXISTS schema_migrations (
  version STRING(32) PRIMARY KEY,
  description STRING(255) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name STRING(160) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cognito_sub STRING(255) NOT NULL,
  name STRING(160) NOT NULL,
  role STRING(32) NOT NULL
    CHECK (role IN ('technician', 'supervisor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (org_id, cognito_sub),
  INDEX users_org_role_idx (org_id, role)
);

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name STRING(160) NOT NULL,
  region STRING(120),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX sites_org_region_idx (org_id, region)
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,

  asset_code STRING(64) NOT NULL,
  asset_type STRING(80) NOT NULL,
  manufacturer STRING(120),
  model STRING(120),

  installed_at DATE,

  criticality STRING(16) NOT NULL DEFAULT 'medium'
    CHECK (criticality IN ('low', 'medium', 'high', 'critical')),

  status STRING(32) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'maintenance', 'offline', 'retired')),

  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (org_id, asset_code),

  INDEX assets_org_site_idx (org_id, site_id),
  INDEX assets_org_type_model_idx (org_id, asset_type, model)
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,

  title STRING(255) NOT NULL,
  symptom_text STRING NOT NULL,

  severity STRING(16) NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  status STRING(32) NOT NULL DEFAULT 'open'
    CHECK (
      status IN (
        'open',
        'diagnosing',
        'awaiting_approval',
        'repairing',
        'monitoring',
        'resolved',
        'failed'
      )
    ),

  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX incidents_asset_created_idx (asset_id, created_at DESC),
  INDEX incidents_org_status_idx (org_id, status)
);

CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  author_type STRING(32) NOT NULL
    CHECK (
      author_type IN ('technician', 'supervisor', 'agent', 'system')
    ),

  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  kind STRING(64) NOT NULL DEFAULT 'note',
  text STRING NOT NULL,

  readings JSONB NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX observations_incident_created_idx (incident_id, created_at DESC)
);

CREATE TABLE IF NOT EXISTS repair_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  sequence_no INT NOT NULL DEFAULT 1,

  action_type STRING(80) NOT NULL,
  description STRING NOT NULL,

  proposed_by STRING(32) NOT NULL DEFAULT 'agent'
    CHECK (proposed_by IN ('agent', 'technician', 'supervisor')),

  approval_status STRING(32) NOT NULL DEFAULT 'pending'
    CHECK (
      approval_status IN ('pending', 'approved', 'rejected', 'not_required')
    ),

  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  performed_at TIMESTAMPTZ,
  result_text STRING,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX repair_actions_incident_sequence_idx (incident_id, sequence_no),
  INDEX repair_actions_org_approval_idx (org_id, approval_status)
);

CREATE TABLE IF NOT EXISTS outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  incident_id UUID NOT NULL UNIQUE REFERENCES incidents(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  resolution_status STRING(32) NOT NULL
    CHECK (
      resolution_status IN ('successful', 'partial', 'failed', 'monitoring')
    ),

  downtime_minutes INT
    CHECK (downtime_minutes IS NULL OR downtime_minutes >= 0),

  recurrence_detected BOOL NOT NULL DEFAULT false,

  days_to_recurrence INT
    CHECK (days_to_recurrence IS NULL OR days_to_recurrence >= 0),

  outcome_text STRING NOT NULL,

  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX outcomes_org_status_idx (org_id, resolution_status)
);

-- Core FIELDfix episodic / long-term memory.
CREATE TABLE IF NOT EXISTS memory_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  asset_type STRING(80) NOT NULL,
  asset_model STRING(120),

  title STRING(255) NOT NULL,

  symptom_summary STRING NOT NULL,
  root_cause STRING,
  fix_summary STRING,
  outcome_summary STRING,
  lesson STRING,

  -- Canonical text sent to Titan Text Embeddings V2.
  canonical_text STRING NOT NULL,

  -- Locked to Titan Text Embeddings V2 1024-dimensional output.
  embedding VECTOR(1024) NOT NULL,

  quality_score DECIMAL(4,3) NOT NULL DEFAULT 0.500
    CHECK (quality_score >= 0 AND quality_score <= 1),

  verified BOOL NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX memory_org_asset_idx (org_id, asset_id),
  INDEX memory_org_asset_type_idx (org_id, asset_type),
  INDEX memory_incident_idx (incident_id),

  -- org_id is an ANN prefix column for tenant-scoped retrieval.
  VECTOR INDEX memory_embedding_idx (
    org_id,
    embedding vector_cosine_ops
  )
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  trigger STRING(80) NOT NULL,

  model_id STRING(255),

  status STRING(32) NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed')),

  confidence DECIMAL(4,3)
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),

  recommendation JSONB,

  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  error_code STRING(120),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX agent_runs_incident_created_idx (incident_id, created_at DESC),
  INDEX agent_runs_org_status_idx (org_id, status)
);

CREATE TABLE IF NOT EXISTS agent_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  agent_run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,

  tool_name STRING(120) NOT NULL,

  input_summary STRING,
  output_summary STRING,

  duration_ms INT
    CHECK (duration_ms IS NULL OR duration_ms >= 0),

  success BOOL NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX agent_tool_calls_run_created_idx (agent_run_id, created_at)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  actor_type STRING(32) NOT NULL
    CHECK (
      actor_type IN ('technician', 'supervisor', 'agent', 'system')
    ),

  actor_id UUID,

  event STRING(160) NOT NULL,

  entity_type STRING(80) NOT NULL,
  entity_id UUID,

  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  INDEX audit_org_created_idx (org_id, created_at DESC),
  INDEX audit_entity_idx (entity_type, entity_id)
);

INSERT INTO schema_migrations (
  version,
  description
)
VALUES (
  '001',
  'Initial FIELDfix asset, incident, outcome, agent, and episodic memory schema'
)
ON CONFLICT (version) DO NOTHING;
