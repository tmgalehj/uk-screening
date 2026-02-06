import { SupabaseClient } from '@supabase/supabase-js';
import {
  PipelineConfig,
  RawCandidate,
  CallLogEntry,
  RunStats,
  ScoredCandidate,
  PipelineCandidate,
} from '../types';
import { loadConfig } from '../config';
import { fetchCandidates } from './fetch-candidates';
import { applyGates } from './gates';
import { selectJob } from './job-selection';
import { formatCandidate, formatPhone } from './formatter';
import { validatePhone } from './phone-validation';
import { calculateScore } from './scoring';
import { applyQuota } from './quota';
import { makeVapiCall } from '../integrations/vapi';
import { sendWhatsAppTemplate } from '../integrations/whatsapp';
import { syncToActiveCampaign } from '../integrations/activecampaign';
import { trackHeapEvent } from '../integrations/heap';
import {
  sendSlackMessage,
  formatRunStartMessage,
  formatRunCompleteMessage,
  formatErrorMessage,
} from '../integrations/slack';

// ============================================================
// HELPERS
// ============================================================

async function updateRunStatus(
  supabase: SupabaseClient,
  runId: string,
  status: string,
  extras?: Record<string, unknown>
) {
  await supabase
    .from('pipeline_runs')
    .update({ status, ...extras })
    .eq('id', runId);
}

async function getCallHistory(supabase: SupabaseClient, days: number): Promise<CallLogEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('call_log')
    .select('*')
    .gte('CALL_TIMESTAMP', since.toISOString());

  if (error) {
    console.error('Failed to fetch call history:', error.message);
    return [];
  }

  return (data || []) as CallLogEntry[];
}

// ============================================================
// CREATE RUN
// ============================================================

export async function createRun(
  supabase: SupabaseClient,
  triggerType: 'scheduled' | 'manual',
  triggeredBy?: string
): Promise<string> {
  const config = await loadConfig(supabase);

  const { data, error } = await supabase
    .from('pipeline_runs')
    .insert({
      status: 'pending',
      trigger_type: triggerType,
      triggered_by: triggeredBy || null,
      config_snapshot: config,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create run: ${error.message}`);
  return data.id;
}

// ============================================================
// PREPARE PIPELINE (Steps 1-6: Fetch, Gate, Select, Format, Validate, Score, Quota)
// ============================================================

export async function preparePipeline(supabase: SupabaseClient, runId: string): Promise<void> {
  const now = new Date();

  // Load the config snapshot from the run
  const { data: run } = await supabase
    .from('pipeline_runs')
    .select('config_snapshot')
    .eq('id', runId)
    .single();

  const config = run?.config_snapshot as PipelineConfig;

  // STEP 1: Fetch candidates
  await updateRunStatus(supabase, runId, 'fetching');
  let rawCandidates: RawCandidate[];
  try {
    rawCandidates = await fetchCandidates();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fetch failed';
    await updateRunStatus(supabase, runId, 'failed', { error_message: msg });
    await sendSlackMessage(`UK Screening fetch failed: ${msg}`);
    throw err;
  }

  // STEP 2: Load call history
  await updateRunStatus(supabase, runId, 'processing');
  const callHistory = await getCallHistory(supabase, 30);

  // Group raw candidates by CANDIDATE_ID
  const candidateGroups: Record<string, RawCandidate[]> = {};
  rawCandidates.forEach((c) => {
    if (!candidateGroups[c.CANDIDATE_ID]) candidateGroups[c.CANDIDATE_ID] = [];
    candidateGroups[c.CANDIDATE_ID].push(c);
  });

  // STEPS 3-6: Process each candidate
  const allCandidateRows: Partial<PipelineCandidate>[] = [];
  const selectedCandidates: ScoredCandidate[] = [];

  for (const [candidateId, records] of Object.entries(candidateGroups)) {
    const firstRecord = records[0];

    // Apply gates (using all records for this candidate + call history)
    const gateResult = applyGates(firstRecord, callHistory, config, now);

    // Base row for this candidate
    const baseRow: Partial<PipelineCandidate> = {
      run_id: runId,
      candidate_id: candidateId,
      full_name: firstRecord.FULL_NAME,
      email: firstRecord.EMAIL,
      phone: firstRecord.PHONE,
      phone_formatted: formatPhone(firstRecord.PHONE),
      source_data: firstRecord,
      gate_compliance: gateResult.gate_compliance,
      gate_buffer: gateResult.gate_buffer,
      gate_volume: gateResult.gate_volume,
      gate_details: gateResult.gate_details,
    };

    const gatesPassed =
      gateResult.gate_compliance && gateResult.gate_buffer && gateResult.gate_volume;

    if (!gatesPassed) {
      allCandidateRows.push({ ...baseRow, execution_status: 'skipped' });
      continue;
    }

    // Job selection
    const jobResult = selectJob(records, callHistory, config, now);
    baseRow.selected_job_id = jobResult.selected_job_id;
    baseRow.selected_job_title = jobResult.selected_job_title;
    baseRow.selected_company = jobResult.selected_company;
    baseRow.job_selection_reason = jobResult.job_selection_reason;
    baseRow.call_type = jobResult.call_type;
    baseRow.call_number = jobResult.call_number;

    if (!jobResult.selected_job_id) {
      allCandidateRows.push({ ...baseRow, execution_status: 'skipped' });
      continue;
    }

    // Format
    const formatted = formatCandidate(firstRecord, jobResult);
    if (!formatted) {
      allCandidateRows.push({ ...baseRow, execution_status: 'skipped' });
      continue;
    }

    // Phone validation
    const phoneResult = validatePhone(formatted.phoneFormatted);
    baseRow.phone_valid = phoneResult.phone_valid;
    baseRow.phone_validation_reason = phoneResult.phone_validation_reason;

    if (!phoneResult.phone_valid) {
      allCandidateRows.push({ ...baseRow, execution_status: 'skipped' });
      continue;
    }

    // Score
    const scored = calculateScore(formatted, config, now);
    baseRow.priority_score = scored.priority_score;
    baseRow.score_breakdown = scored.score_breakdown;

    allCandidateRows.push(baseRow);
    selectedCandidates.push(scored);
  }

  // Apply quota
  const quotaSelected = applyQuota(selectedCandidates, config);
  const selectedIds = new Set(quotaSelected.map((c) => c.candidateId));

  // Mark non-selected candidates as skipped
  allCandidateRows.forEach((row) => {
    if (row.candidate_id && !selectedIds.has(row.candidate_id) && !row.execution_status) {
      row.execution_status = 'skipped';
    }
  });

  // Persist all candidates to DB
  const BATCH_SIZE = 500;
  for (let i = 0; i < allCandidateRows.length; i += BATCH_SIZE) {
    const batch = allCandidateRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('pipeline_candidates').insert(batch);
    if (error) console.error(`Failed to insert candidate batch ${i}:`, error.message);
  }

  // Update run stats
  const stats: RunStats = {
    total_fetched: rawCandidates.length,
    total_passed_gates: allCandidateRows.filter(
      (r) => r.gate_compliance && r.gate_buffer && r.gate_volume
    ).length,
    total_phone_valid: allCandidateRows.filter((r) => r.phone_valid).length,
    total_selected: quotaSelected.length,
    total_called: 0,
    total_errors: 0,
    total_whatsapp_sent: 0,
  };

  await updateRunStatus(supabase, runId, 'processing', { stats });
}

// ============================================================
// EXECUTE PIPELINE (Step 7: Call candidates)
// ============================================================

export async function executePipeline(supabase: SupabaseClient, runId: string): Promise<void> {
  await updateRunStatus(supabase, runId, 'executing');
  await sendSlackMessage(formatRunStartMessage());

  // Get all candidates pending execution for this run
  const { data: candidates, error } = await supabase
    .from('pipeline_candidates')
    .select('*')
    .eq('run_id', runId)
    .eq('execution_status', 'pending')
    .eq('phone_valid', true)
    .not('selected_job_id', 'is', null)
    .eq('manually_excluded', false)
    .order('priority_score', { ascending: false });

  if (error) {
    await updateRunStatus(supabase, runId, 'failed', {
      error_message: `Failed to load candidates: ${error.message}`,
    });
    return;
  }

  // Also include manually included candidates
  const { data: overrides } = await supabase
    .from('pipeline_candidates')
    .select('*')
    .eq('run_id', runId)
    .eq('manually_included', true)
    .eq('execution_status', 'pending');

  const allToCall = [...(candidates || [])];
  if (overrides) {
    const existingIds = new Set(allToCall.map((c) => c.id));
    overrides.forEach((o) => {
      if (!existingIds.has(o.id)) allToCall.push(o);
    });
  }

  let totalCalled = 0;
  let totalErrors = 0;
  let totalWhatsAppSent = 0;

  for (const candidate of allToCall) {
    // Mark as calling
    await supabase
      .from('pipeline_candidates')
      .update({ execution_status: 'calling' })
      .eq('id', candidate.id);

    // Wait 15 seconds between calls (skip for the first one)
    if (totalCalled > 0) {
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }

    // 1. Make Vapi call
    const vapiResult = await makeVapiCall({
      phone: candidate.phone_formatted || candidate.phone,
      firstName: candidate.full_name?.split(/\s+/)[0] || 'there',
      fullName: candidate.full_name,
      jobTitle: candidate.selected_job_title || '',
      companyName: candidate.selected_company || '',
      candidateId: candidate.candidate_id,
      jobId: candidate.selected_job_id || '',
      callType: candidate.call_type || 'initial',
      callNumber: candidate.call_number || 1,
      email: candidate.email || '',
    });

    if (!vapiResult.success) {
      totalErrors++;
      await supabase
        .from('pipeline_candidates')
        .update({
          execution_status: 'error',
          execution_error: vapiResult.error,
          executed_at: new Date().toISOString(),
        })
        .eq('id', candidate.id);

      await sendSlackMessage(formatErrorMessage(candidate.full_name, vapiResult.error || 'Unknown'));
      continue;
    }

    totalCalled++;

    // 2. Send WhatsApp (initial calls only)
    let whatsappSent = false;
    if (candidate.call_type === 'initial') {
      const waResult = await sendWhatsAppTemplate({
        phone: candidate.phone_formatted || candidate.phone,
        firstName: candidate.full_name?.split(/\s+/)[0] || 'there',
        companyName: candidate.selected_company || '',
        jobTitle: candidate.selected_job_title || '',
      });
      whatsappSent = waResult.success;
      if (whatsappSent) totalWhatsAppSent++;
    }

    // 3. Sync to ActiveCampaign
    let acSynced = false;
    if (candidate.email) {
      const acResult = await syncToActiveCampaign({
        email: candidate.email,
        jobTitle: candidate.selected_job_title || '',
        companyName: candidate.selected_company || '',
      });
      acSynced = acResult.success;
    }

    // 4. Track in Heap
    let heapTracked = false;
    if (candidate.email) {
      const heapResult = await trackHeapEvent({ email: candidate.email });
      heapTracked = heapResult.success;
    }

    // 5. Log to call_log (maintaining backwards compatibility)
    await supabase.from('call_log').insert({
      JOB_ID: candidate.selected_job_id,
      CANDIDATE_ID: candidate.candidate_id,
      FULL_NAME: candidate.full_name,
      JOB_TITLE: candidate.selected_job_title,
      COMPANY_REQUESTED: candidate.selected_company,
      CALL_ID: vapiResult.callId,
      CALL_TIMESTAMP: vapiResult.createdAt || new Date().toISOString(),
      CHASE_STAGE: (candidate.call_number || 0) + 1,
      SMS: candidate.call_type === 'initial' ? 'SENT' : 'NOT_SENT',
      CALL_TYPE: candidate.call_type,
      Email: candidate.email,
      request_type: candidate.source_data?.STAGE_NAME || '',
      Country: 'United Kingdom',
      phone_number: candidate.phone_formatted || candidate.phone,
    });

    // 6. Update pipeline_candidates row
    await supabase
      .from('pipeline_candidates')
      .update({
        execution_status: 'completed',
        vapi_call_id: vapiResult.callId,
        whatsapp_sent: whatsappSent,
        activecampaign_synced: acSynced,
        heap_tracked: heapTracked,
        executed_at: new Date().toISOString(),
      })
      .eq('id', candidate.id);
  }

  // Update run stats and mark complete
  const { data: currentRun } = await supabase
    .from('pipeline_runs')
    .select('stats')
    .eq('id', runId)
    .single();

  const existingStats = (currentRun?.stats || {}) as RunStats;
  const updatedStats: RunStats = {
    ...existingStats,
    total_called: totalCalled,
    total_errors: totalErrors,
    total_whatsapp_sent: totalWhatsAppSent,
  };

  await updateRunStatus(supabase, runId, 'completed', {
    completed_at: new Date().toISOString(),
    stats: updatedStats,
  });

  await sendSlackMessage(
    formatRunCompleteMessage({ totalCalled, totalErrors })
  );
}

// ============================================================
// FULL PIPELINE (for scheduled runs — prepare + execute in one go)
// ============================================================

export async function runFullPipeline(supabase: SupabaseClient, runId: string): Promise<void> {
  await preparePipeline(supabase, runId);
  await executePipeline(supabase, runId);
}
