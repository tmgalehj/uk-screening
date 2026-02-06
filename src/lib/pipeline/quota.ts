import { PipelineConfig, ScoredCandidate } from '../types';

/**
 * Selects the top candidates up to the daily quota, respecting optional company limits.
 * Candidates should already be scored — this just sorts and caps.
 */
export function applyQuota(
  candidates: ScoredCandidate[],
  config: PipelineConfig
): ScoredCandidate[] {
  // Sort by priority score (highest first)
  const sorted = [...candidates].sort((a, b) => b.priority_score - a.priority_score);

  if (!config.company_limits.enabled) {
    return sorted.slice(0, config.daily_quota);
  }

  // Apply company limits
  const selected: ScoredCandidate[] = [];
  const companyCallCounts: Record<string, number> = {};

  for (const candidate of sorted) {
    if (selected.length >= config.daily_quota) break;

    const company = candidate.company || 'Unknown';
    const currentCount = companyCallCounts[company] || 0;

    if (currentCount < config.company_limits.max_per_company) {
      selected.push(candidate);
      companyCallCounts[company] = currentCount + 1;
    }
  }

  return selected;
}
