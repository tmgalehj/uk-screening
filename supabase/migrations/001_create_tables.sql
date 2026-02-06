-- UK Screening Pipeline Tables
-- Run this against your Supabase database

-- ============================================================
-- PIPELINE CONFIGURATION
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default configuration
INSERT INTO pipeline_config (key, value, description) VALUES
  ('daily_quota', '10000', 'Max calls per run'),
  ('buffer_hours', '48', 'Hours between calls to same candidate'),
  ('max_monthly_calls', '6', 'Max calls to a candidate in 30 days'),
  ('max_calls_per_job', '6', 'Max calls about one job'),
  ('chase_interval_days', '2', 'Min days between chase calls'),
  ('job_age_minimum_hours', '12', 'Job must be this old before calling'),
  ('screening_stage_bonus', '200', 'Priority bonus for screening stage'),
  ('company_limits', '{"enabled": false, "max_per_company": 100}', 'Per-company caps'),
  ('gates_enabled', '{"compliance": true, "buffer": true, "volume": true}', 'Toggle individual gates')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PIPELINE RUNS
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'fetching', 'processing', 'executing', 'completed', 'failed', 'cancelled')),
  trigger_type TEXT NOT NULL
    CHECK (trigger_type IN ('scheduled', 'manual')),
  triggered_by UUID,
  config_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created ON pipeline_runs(created_at DESC);

-- ============================================================
-- CANDIDATE PIPELINE ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  phone_formatted TEXT,

  -- Source data
  source_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Gate results
  gate_compliance BOOLEAN,
  gate_buffer BOOLEAN,
  gate_volume BOOLEAN,
  gates_passed BOOLEAN GENERATED ALWAYS AS (
    COALESCE(gate_compliance, false) AND
    COALESCE(gate_buffer, false) AND
    COALESCE(gate_volume, false)
  ) STORED,
  gate_details JSONB,

  -- Job selection
  selected_job_id TEXT,
  selected_job_title TEXT,
  selected_company TEXT,
  job_selection_reason TEXT,
  call_type TEXT,
  call_number INTEGER DEFAULT 1,

  -- Phone validation
  phone_valid BOOLEAN,
  phone_validation_reason TEXT,

  -- Scoring
  priority_score INTEGER DEFAULT 0,
  score_breakdown JSONB,

  -- Execution
  execution_status TEXT DEFAULT 'pending'
    CHECK (execution_status IN ('pending', 'calling', 'completed', 'error', 'skipped')),
  vapi_call_id TEXT,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  activecampaign_synced BOOLEAN DEFAULT FALSE,
  heap_tracked BOOLEAN DEFAULT FALSE,
  execution_error TEXT,
  executed_at TIMESTAMPTZ,

  -- Manual overrides
  manually_included BOOLEAN DEFAULT FALSE,
  manually_excluded BOOLEAN DEFAULT FALSE,
  override_by UUID,
  override_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pc_run_id ON pipeline_candidates(run_id);
CREATE INDEX IF NOT EXISTS idx_pc_candidate_id ON pipeline_candidates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_pc_gates ON pipeline_candidates(run_id, gates_passed);
CREATE INDEX IF NOT EXISTS idx_pc_execution ON pipeline_candidates(run_id, execution_status);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE pipeline_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage pipeline_config"
  ON pipeline_config FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage pipeline_runs"
  ON pipeline_runs FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage pipeline_candidates"
  ON pipeline_candidates FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage audit_log"
  ON audit_log FOR ALL USING (auth.role() = 'authenticated');
