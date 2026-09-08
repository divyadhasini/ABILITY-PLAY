import { AdaptiveGameParameters } from '../types';

/**
 * Calculates deterministic adaptive game parameters tailored specifically to the child's personal baseline.
 * 
 * Baseline categories:
 * - Low Range of Motion (< 80°): Level 1 - Large target, low hoop, forgiving timing
 * - Moderate Range of Motion (80° - 110°): Level 2 - Medium target, standard hoop height
 * - High Range of Motion (111° - 140°): Level 3 - Standard/Challenging target, higher hoop
 * - Advanced Range of Motion (> 140°): Level 4 - Precision target, full overhead reach
 */
export function getGameParameters(personalBaselineAngle: number): AdaptiveGameParameters {
  const baseline = Math.max(40, Math.min(180, personalBaselineAngle));

  if (baseline < 80) {
    // Level 1: Gentle start / High Accessibility
    return {
      targetSize: 96, // 96px large hoop
      targetHeightPercent: 48, // lower in the canvas (easier to reach)
      targetDistance: 'close',
      gameSpeedMs: 1400, // gentle smooth ball flight
      successThresholdAngle: Math.round(baseline * 0.75), // 75% of baseline triggers shot
      challengeLevel: 1,
      levelLabel: 'Level 1: Gentle Reach (Adaptive Ease)',
      repsGoal: 6,
    };
  } else if (baseline <= 115) {
    // Level 2: Moderate Reach
    return {
      targetSize: 82,
      targetHeightPercent: 38,
      targetDistance: 'medium',
      gameSpeedMs: 1100,
      successThresholdAngle: Math.round(baseline * 0.82), // 82% of baseline
      challengeLevel: 2,
      levelLabel: 'Level 2: Standard Court (Balanced)',
      repsGoal: 8,
    };
  } else if (baseline <= 145) {
    // Level 3: Active Stretch
    return {
      targetSize: 70,
      targetHeightPercent: 28,
      targetDistance: 'far',
      gameSpeedMs: 950,
      successThresholdAngle: Math.round(baseline * 0.88), // 88% of baseline
      challengeLevel: 3,
      levelLabel: 'Level 3: Pro Reach (High Stretch)',
      repsGoal: 10,
    };
  } else {
    // Level 4: Full Overhead Mastery
    return {
      targetSize: 62,
      targetHeightPercent: 20, // very high hoop
      targetDistance: 'far',
      gameSpeedMs: 800,
      successThresholdAngle: Math.round(baseline * 0.92), // 92% of baseline
      challengeLevel: 4,
      levelLabel: 'Level 4: All-Star Overhead (Precision)',
      repsGoal: 12,
    };
  }
}

/**
 * Calculates session progress and performance compared to baseline.
 */
export function calculateSessionPerformance(
  bestMovement: number,
  baseline: number,
  totalReps: number,
  successfulReps: number
) {
  const successRate = totalReps > 0 ? Math.round((successfulReps / totalReps) * 100) : 0;
  const baselinePercentage = baseline > 0 ? Math.round((bestMovement / baseline) * 100) : 100;

  return {
    successRate,
    baselinePercentage,
    improved: baselinePercentage >= 100,
    summaryText: `Your movement reached ${baselinePercentage}% of your starting baseline.`,
  };
}
