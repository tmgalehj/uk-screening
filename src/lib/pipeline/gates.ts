import { RawCandidate, CallLogEntry, PipelineConfig, GateResult } from '../types';

function parseDate(dateStr: string | number | null | undefined): Date | null {
  if (!dateStr || dateStr === '') return null;
  if (typeof dateStr === 'number') {
    // Excel serial date
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000);
  }
  const str = String(dateStr);
  return new Date(str.replace('!', ''));
}

export function applyGates(
  candidate: RawCandidate,
  callHistory: CallLogEntry[],
  config: PipelineConfig,
  now: Date = new Date()
): GateResult {
  const failureReasons: string[] = [];

  // Get all call records for this candidate
  const candidateCalls = callHistory.filter(
    (c) => c.CANDIDATE_ID === candidate.CANDIDATE_ID && c.CALL_ID
  );

  // 1. COMPLIANCE CHECK
  const hasOptOut = candidate.OPT_OUT_STATUS === true || candidate.OPT_OUT_STATUS === 'true';
  const gate_compliance = config.gates_enabled.compliance ? !hasOptOut : true;
  if (!gate_compliance) {
    failureReasons.push('Opted out');
  }

  // 2. UNIVERSAL BUFFER CHECK
  let gate_buffer = true;
  let lastCallAt: string | null = null;
  let hoursSinceLastCall: number | null = null;

  if (config.gates_enabled.buffer && candidateCalls.length > 0) {
    const validTimestamps = candidateCalls
      .map((record) => parseDate(record.CALL_TIMESTAMP))
      .filter((d): d is Date => d !== null);

    if (validTimestamps.length > 0) {
      const mostRecentCall = new Date(Math.max(...validTimestamps.map((d) => d.getTime())));
      lastCallAt = mostRecentCall.toISOString();
      hoursSinceLastCall = (now.getTime() - mostRecentCall.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastCall < config.buffer_hours) {
        gate_buffer = false;
        failureReasons.push(
          `Called ${Math.round(hoursSinceLastCall)}h ago (need ${config.buffer_hours}h+)`
        );
      }
    }
  }

  // 3. MONTHLY VOLUME CHECK
  let gate_volume = true;
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCalls = candidateCalls.filter((record) => {
    const callDate = parseDate(record.CALL_TIMESTAMP);
    return callDate && callDate >= thirtyDaysAgo;
  });

  if (config.gates_enabled.volume && recentCalls.length >= config.max_monthly_calls) {
    gate_volume = false;
    failureReasons.push(
      `${recentCalls.length} calls in 30 days (limit: ${config.max_monthly_calls})`
    );
  }

  return {
    gate_compliance,
    gate_buffer,
    gate_volume,
    gate_details: {
      opt_out_status: candidate.OPT_OUT_STATUS,
      last_call_at: lastCallAt,
      hours_since_last_call: hoursSinceLastCall,
      calls_in_30d: recentCalls.length,
      failure_reasons: failureReasons,
    },
  };
}
