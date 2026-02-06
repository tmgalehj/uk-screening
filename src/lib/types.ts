// ============================================================
// RAW DATA TYPES (from Trevor.io + Supabase call_log)
// ============================================================

export interface RawCandidate {
  CANDIDATE_ID: string;
  FULL_NAME: string;
  EMAIL: string;
  PHONE: string;
  JOB_ID: string;
  JOB_TITLE: string;
  COMPANY_REQUESTED: string;
  REQUEST_DATE: string;
  STAGE_NAME: string;
  OPT_OUT_STATUS: boolean | string;
}

export interface CallLogEntry {
  JOB_ID: string;
  CANDIDATE_ID: string;
  FULL_NAME: string;
  JOB_TITLE: string;
  COMPANY_REQUESTED: string;
  CALL_ID: string;
  CALL_TIMESTAMP: string;
  CHASE_STAGE: number;
  SMS: string;
  CALL_TYPE: string;
  Email: string;
  request_type: string;
  Country: string;
  phone_number: string;
}

// ============================================================
// PIPELINE CONFIG
// ============================================================

export interface PipelineConfig {
  daily_quota: number;
  buffer_hours: number;
  max_monthly_calls: number;
  max_calls_per_job: number;
  chase_interval_days: number;
  job_age_minimum_hours: number;
  screening_stage_bonus: number;
  company_limits: {
    enabled: boolean;
    max_per_company: number;
  };
  gates_enabled: {
    compliance: boolean;
    buffer: boolean;
    volume: boolean;
  };
}

export const DEFAULT_CONFIG: PipelineConfig = {
  daily_quota: 10000,
  buffer_hours: 48,
  max_monthly_calls: 6,
  max_calls_per_job: 6,
  chase_interval_days: 2,
  job_age_minimum_hours: 12,
  screening_stage_bonus: 200,
  company_limits: { enabled: false, max_per_company: 100 },
  gates_enabled: { compliance: true, buffer: true, volume: true },
};

// ============================================================
// GATE RESULTS
// ============================================================

export interface GateResult {
  gate_compliance: boolean;
  gate_buffer: boolean;
  gate_volume: boolean;
  gate_details: {
    opt_out_status: boolean | string;
    last_call_at: string | null;
    hours_since_last_call: number | null;
    calls_in_30d: number;
    failure_reasons: string[];
  };
}

// ============================================================
// JOB SELECTION
// ============================================================

export interface JobSelection {
  selected_job_id: string | null;
  selected_job_title: string | null;
  selected_company: string | null;
  job_selection_reason: 'never_called' | 'chase_eligible' | null;
  call_type: 'initial' | 'chase' | null;
  call_number: number;
}

// ============================================================
// FORMATTED CANDIDATE
// ============================================================

export interface FormattedCandidate {
  candidateId: string;
  candidateName: string;
  firstName: string;
  email: string;
  phone: string;
  phoneFormatted: string;
  jobId: string;
  jobTitle: string;
  company: string;
  requestDate: string;
  stageName: string;
  callType: 'initial' | 'chase';
  callNumber: number;
  jobSelectionReason: string;
}

// ============================================================
// PHONE VALIDATION
// ============================================================

export interface PhoneValidation {
  phone_valid: boolean;
  phone_validation_reason: 'uk_mobile' | 'not_uk' | 'not_mobile' | 'invalid_format' | 'empty';
}

// ============================================================
// SCORING
// ============================================================

export interface ScoreBreakdown {
  stage_bonus: number;
  type_bonus: number;
  freshness_bonus: number;
  initial_bonus: number;
}

export interface ScoredCandidate extends FormattedCandidate {
  priority_score: number;
  score_breakdown: ScoreBreakdown;
}

// ============================================================
// PIPELINE RUN
// ============================================================

export type RunStatus = 'pending' | 'fetching' | 'processing' | 'executing' | 'completed' | 'failed' | 'cancelled';
export type TriggerType = 'scheduled' | 'manual';
export type ExecutionStatus = 'pending' | 'calling' | 'completed' | 'error' | 'skipped';

export interface PipelineRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: RunStatus;
  trigger_type: TriggerType;
  triggered_by: string | null;
  config_snapshot: PipelineConfig;
  stats: RunStats;
  error_message: string | null;
  created_at: string;
}

export interface RunStats {
  total_fetched: number;
  total_passed_gates: number;
  total_phone_valid: number;
  total_selected: number;
  total_called: number;
  total_errors: number;
  total_whatsapp_sent: number;
}

// ============================================================
// PIPELINE CANDIDATE (DB row)
// ============================================================

export interface PipelineCandidate {
  id: string;
  run_id: string;
  candidate_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  phone_formatted: string | null;
  source_data: RawCandidate;
  gate_compliance: boolean | null;
  gate_buffer: boolean | null;
  gate_volume: boolean | null;
  gates_passed: boolean;
  gate_details: GateResult['gate_details'] | null;
  selected_job_id: string | null;
  selected_job_title: string | null;
  selected_company: string | null;
  job_selection_reason: string | null;
  call_type: string | null;
  call_number: number;
  phone_valid: boolean | null;
  phone_validation_reason: string | null;
  priority_score: number;
  score_breakdown: ScoreBreakdown | null;
  execution_status: ExecutionStatus;
  vapi_call_id: string | null;
  whatsapp_sent: boolean;
  activecampaign_synced: boolean;
  heap_tracked: boolean;
  execution_error: string | null;
  executed_at: string | null;
  manually_included: boolean;
  manually_excluded: boolean;
  override_by: string | null;
  override_reason: string | null;
  created_at: string;
}
