import { PersonalBaseline } from '../types';

export const DEFAULT_BASELINE_ANGLE = 95; // Default fallback in degrees

/**
 * Initializes a new baseline object.
 */
export function createInitialBaseline(): PersonalBaseline {
  return {
    maxShoulderAngle: DEFAULT_BASELINE_ANGLE,
    calibratedAt: 0,
    samples: [],
    isCalibrated: false,
  };
}

/**
 * Calculates the personal baseline from calibration samples.
 * Filters out extreme noisy spikes and computes a reliable peak comfortable range of motion (ROM).
 */
export function calculateBaseline(samples: number[]): number {
  if (!samples || samples.length === 0) {
    return DEFAULT_BASELINE_ANGLE;
  }

  // Filter realistic angles between 30° and 180°
  const valid = samples.filter((a) => a >= 30 && a <= 180);
  if (valid.length === 0) return DEFAULT_BASELINE_ANGLE;

  // Sort samples ascending
  valid.sort((a, b) => a - b);

  // Take the 90th percentile to prevent single frame artifact glitches while capturing true peak comfortable ROM
  const percentileIndex = Math.min(
    valid.length - 1,
    Math.floor(valid.length * 0.9)
  );

  const calculatedPeak = valid[percentileIndex];

  // Ensure reasonable minimum (e.g., at least 45°) to keep games playable
  return Math.max(45, Math.min(175, calculatedPeak));
}

/**
 * Saves baseline to localStorage for session continuity.
 */
export function saveBaselineToStorage(baseline: PersonalBaseline): void {
  try {
    localStorage.setItem('abilityplay_baseline', JSON.stringify(baseline));
  } catch (err) {
    console.warn('Could not save baseline to localStorage', err);
  }
}

/**
 * Loads baseline from localStorage if available.
 */
export function loadBaselineFromStorage(): PersonalBaseline | null {
  try {
    const data = localStorage.getItem('abilityplay_baseline');
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read baseline from localStorage', err);
  }
  return null;
}
