import { FormattedCandidate, PipelineConfig, ScoreBreakdown, ScoredCandidate } from '../types';

export function calculateScore(
  candidate: FormattedCandidate,
  config: PipelineConfig,
  now: Date = new Date()
): ScoredCandidate {
  let score = 0;
  const breakdown: ScoreBreakdown = {
    stage_bonus: 0,
    type_bonus: 0,
    freshness_bonus: 0,
    initial_bonus: 0,
  };

  // 1. Screening stage bonus
  if (candidate.stageName?.toLowerCase().includes('screening')) {
    breakdown.stage_bonus = config.screening_stage_bonus;
    score += breakdown.stage_bonus;
  }

  // 2. Call type bonus
  if (candidate.callType === 'initial') {
    breakdown.type_bonus = 100;
  } else {
    breakdown.type_bonus = 50;
  }
  score += breakdown.type_bonus;

  // 3. Freshness bonus
  const requestDate = new Date(candidate.requestDate);
  const hoursOld = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60);

  if (hoursOld < 72) {
    breakdown.freshness_bonus = 30;
  } else if (hoursOld < 120) {
    breakdown.freshness_bonus = 20;
  } else if (hoursOld < 168) {
    breakdown.freshness_bonus = 10;
  }
  score += breakdown.freshness_bonus;

  // 4. Initial call bonus
  if (candidate.callType === 'initial') {
    breakdown.initial_bonus = 25;
  }
  score += breakdown.initial_bonus;

  return {
    ...candidate,
    priority_score: score,
    score_breakdown: breakdown,
  };
}
