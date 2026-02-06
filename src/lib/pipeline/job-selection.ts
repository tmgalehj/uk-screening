import { RawCandidate, CallLogEntry, PipelineConfig, JobSelection } from '../types';

function parseDate(dateStr: string | number | null | undefined): Date | null {
  if (!dateStr || dateStr === '') return null;
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000);
  }
  const str = String(dateStr);
  return new Date(str.replace('!', ''));
}

function hasValidCallId(record: CallLogEntry): boolean {
  return !!record.CALL_ID && record.CALL_ID !== '';
}

interface JobSummary {
  jobId: string;
  jobDetails: RawCandidate;
  mostRecentCall: CallLogEntry | null;
  totalCalls: number;
}

/**
 * For a given candidate, selects the best job to call about.
 * Takes all import records (jobs) for this candidate + their full call history.
 */
export function selectJob(
  candidateImportRecords: RawCandidate[],
  callHistory: CallLogEntry[],
  config: PipelineConfig,
  now: Date = new Date()
): JobSelection {
  const noSelection: JobSelection = {
    selected_job_id: null,
    selected_job_title: null,
    selected_company: null,
    job_selection_reason: null,
    call_type: null,
    call_number: 0,
  };

  if (candidateImportRecords.length === 0) return noSelection;

  const candidateId = candidateImportRecords[0].CANDIDATE_ID;

  // Get call records for this candidate
  const callRecords = callHistory.filter(
    (c) => c.CANDIDATE_ID === candidateId && hasValidCallId(c)
  );

  // Group call records by JOB_ID
  const callHistoryByJob: Record<string, CallLogEntry[]> = {};
  callRecords.forEach((record) => {
    if (!callHistoryByJob[record.JOB_ID]) {
      callHistoryByJob[record.JOB_ID] = [];
    }
    callHistoryByJob[record.JOB_ID].push(record);
  });

  // Create job summaries
  const jobSummaries: JobSummary[] = candidateImportRecords.map((importRecord) => {
    const jobCalls = callHistoryByJob[importRecord.JOB_ID] || [];
    let mostRecentCall: CallLogEntry | null = null;

    if (jobCalls.length > 0) {
      mostRecentCall = jobCalls.reduce((latest, current) => {
        const latestDate = parseDate(latest.CALL_TIMESTAMP);
        const currentDate = parseDate(current.CALL_TIMESTAMP);
        if (!latestDate) return current;
        if (!currentDate) return latest;
        return currentDate > latestDate ? current : latest;
      });
    }

    return {
      jobId: importRecord.JOB_ID,
      jobDetails: importRecord,
      mostRecentCall,
      totalCalls: jobCalls.length,
    };
  });

  // Sort by REQUEST_DATE (newest first)
  const sortedJobs = jobSummaries.sort((a, b) => {
    const dateA = parseDate(a.jobDetails.REQUEST_DATE);
    const dateB = parseDate(b.jobDetails.REQUEST_DATE);
    if (!dateA || !dateB) return 0;
    return dateB.getTime() - dateA.getTime();
  });

  // Find first eligible job
  for (const job of sortedJobs) {
    const jobRequestDate = parseDate(job.jobDetails.REQUEST_DATE);
    if (!jobRequestDate) continue;

    const hoursSinceJobRequest =
      (now.getTime() - jobRequestDate.getTime()) / (1000 * 60 * 60);

    // Check job age
    if (hoursSinceJobRequest < config.job_age_minimum_hours) continue;

    // Check call limit
    if (job.totalCalls >= config.max_calls_per_job) continue;

    if (!job.mostRecentCall) {
      // Check if candidate has ANY call history (for other jobs)
      if (callRecords.length > 0) {
        const mostRecentCallAnyJob = callRecords.reduce((latest, current) => {
          const latestDate = parseDate(latest.CALL_TIMESTAMP);
          const currentDate = parseDate(current.CALL_TIMESTAMP);
          if (!latestDate) return current;
          if (!currentDate) return latest;
          return currentDate > latestDate ? current : latest;
        });

        const lastCallDate = parseDate(mostRecentCallAnyJob.CALL_TIMESTAMP);
        if (lastCallDate) {
          const daysSinceLastCall =
            (now.getTime() - lastCallDate.getTime()) / (1000 * 60 * 60 * 24);

          if (daysSinceLastCall >= config.chase_interval_days) {
            return {
              selected_job_id: job.jobId,
              selected_job_title: job.jobDetails.JOB_TITLE,
              selected_company: job.jobDetails.COMPANY_REQUESTED,
              job_selection_reason: 'chase_eligible',
              call_type: 'chase',
              call_number: 1,
            };
          } else {
            continue;
          }
        }
      }

      // Truly never called about any job
      return {
        selected_job_id: job.jobId,
        selected_job_title: job.jobDetails.JOB_TITLE,
        selected_company: job.jobDetails.COMPANY_REQUESTED,
        job_selection_reason: 'never_called',
        call_type: 'initial',
        call_number: 1,
      };
    } else {
      // Check chase timing for THIS specific job
      const lastCallDate = parseDate(job.mostRecentCall.CALL_TIMESTAMP);
      if (lastCallDate) {
        const daysSinceLastCall =
          (now.getTime() - lastCallDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastCall >= config.chase_interval_days) {
          return {
            selected_job_id: job.jobId,
            selected_job_title: job.jobDetails.JOB_TITLE,
            selected_company: job.jobDetails.COMPANY_REQUESTED,
            job_selection_reason: 'chase_eligible',
            call_type: 'chase',
            call_number: job.totalCalls + 1,
          };
        }
      }
    }
  }

  return noSelection;
}
