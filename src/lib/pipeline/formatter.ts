import { FormattedCandidate, RawCandidate, JobSelection } from '../types';

const PREFIXES = ['mr', 'mrs', 'ms', 'dr', 'prof', 'sir', 'dame'];

export function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName || fullName.trim() === '') return 'there';

  const nameParts = fullName.trim().split(/\s+/);
  let firstNameIndex = 0;

  if (
    nameParts.length > 1 &&
    PREFIXES.includes(nameParts[0].toLowerCase().replace('.', ''))
  ) {
    firstNameIndex = 1;
  }

  let firstName = nameParts[firstNameIndex] || 'there';
  firstName = firstName.replace(/[^a-zA-Z'-]/g, '');
  firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  return firstName || 'there';
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const phoneStr = String(phone).trim();
  return phoneStr.startsWith('+') ? phoneStr : `+${phoneStr}`;
}

export function formatCandidate(
  candidate: RawCandidate,
  jobSelection: JobSelection
): FormattedCandidate | null {
  if (!jobSelection.selected_job_id || !jobSelection.call_type) return null;

  return {
    candidateId: candidate.CANDIDATE_ID,
    candidateName: candidate.FULL_NAME,
    firstName: extractFirstName(candidate.FULL_NAME),
    email: candidate.EMAIL,
    phone: candidate.PHONE,
    phoneFormatted: formatPhone(candidate.PHONE),
    jobId: jobSelection.selected_job_id,
    jobTitle: jobSelection.selected_job_title || '',
    company: jobSelection.selected_company || '',
    requestDate: candidate.REQUEST_DATE,
    stageName: candidate.STAGE_NAME,
    callType: jobSelection.call_type,
    callNumber: jobSelection.call_number,
    jobSelectionReason: jobSelection.job_selection_reason || '',
  };
}
