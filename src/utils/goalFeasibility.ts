import type { RaceDistance, Pace } from '../types';
import { DISTANCE_INFO } from '../types';

export type FeasibilityRating = 'conservative' | 'moderate' | 'aggressive' | 'high-risk';

export interface GoalFeasibility {
  rating: FeasibilityRating;
  reasons: string[];
}

const RATING_ORDER: FeasibilityRating[] = ['conservative', 'moderate', 'aggressive', 'high-risk'];

// Peak weekly volume a runner should roughly reach for each race distance,
// used to judge how far their current mileage is from race readiness.
const TARGET_PEAK_MILEAGE: Record<RaceDistance, number> = {
  '5k': 25,
  '10k': 35,
  'half': 45,
  'full': 60,
};

function paceToSeconds(pace: Pace): number {
  return Math.max(0, pace.minutes * 60 + pace.seconds);
}

function worstRating(ratings: FeasibilityRating[]): FeasibilityRating {
  return ratings.reduce((worst, rating) =>
    RATING_ORDER.indexOf(rating) > RATING_ORDER.indexOf(worst) ? rating : worst,
  'conservative');
}

export function assessGoalFeasibility(
  distance: RaceDistance,
  currentPace: Pace,
  targetPace: Pace,
  currentWeeklyMileage: number,
  longestRecentRun: number
): GoalFeasibility {
  const info = DISTANCE_INFO[distance];
  const reasons: string[] = [];
  const ratings: FeasibilityRating[] = [];

  // Pace delta vs. timeline: how much improvement each training week must deliver.
  const currentSeconds = paceToSeconds(currentPace);
  const targetSeconds = paceToSeconds(targetPace);
  const improvementFraction = currentSeconds > 0 ? (currentSeconds - targetSeconds) / currentSeconds : 0;
  const improvementPerWeek = improvementFraction / info.weeks;

  if (improvementFraction <= 0) {
    ratings.push('conservative');
    reasons.push('Your target pace is not faster than your current pace, so the pace goal carries no risk.');
  } else if (improvementPerWeek < 0.003) {
    ratings.push('conservative');
    reasons.push(`A ${Math.round(improvementFraction * 100)}% pace improvement over ${info.weeks} weeks is a gentle progression.`);
  } else if (improvementPerWeek < 0.006) {
    ratings.push('moderate');
    reasons.push(`A ${Math.round(improvementFraction * 100)}% pace improvement over ${info.weeks} weeks is achievable with consistent training.`);
  } else if (improvementPerWeek < 0.01) {
    ratings.push('aggressive');
    reasons.push(`A ${Math.round(improvementFraction * 100)}% pace improvement over ${info.weeks} weeks demands near-perfect training consistency.`);
  } else {
    ratings.push('high-risk');
    reasons.push(`A ${Math.round(improvementFraction * 100)}% pace improvement over ${info.weeks} weeks is unlikely without injury risk - consider a later race or softer target.`);
  }

  // Mileage readiness: how much weekly volume must grow to reach a typical peak.
  if (currentWeeklyMileage > 0) {
    const mileageRatio = TARGET_PEAK_MILEAGE[distance] / currentWeeklyMileage;
    if (mileageRatio <= 1.5) {
      ratings.push('conservative');
    } else if (mileageRatio <= 2.5) {
      ratings.push('moderate');
      reasons.push(`Weekly mileage needs to grow from ${currentWeeklyMileage} km toward ~${TARGET_PEAK_MILEAGE[distance]} km, a manageable but real build.`);
    } else if (mileageRatio <= 3.5) {
      ratings.push('aggressive');
      reasons.push(`Weekly mileage must roughly triple from ${currentWeeklyMileage} km toward ~${TARGET_PEAK_MILEAGE[distance]} km, which is a steep build for this timeline.`);
    } else {
      ratings.push('high-risk');
      reasons.push(`Weekly mileage of ${currentWeeklyMileage} km is far below the ~${TARGET_PEAK_MILEAGE[distance]} km typically needed - the required ramp risks injury.`);
    }
  }

  // Long-run readiness: how far the race distance is beyond the longest recent run.
  if (longestRecentRun > 0) {
    const longRunRatio = info.km / longestRecentRun;
    if (longRunRatio <= 1.5) {
      ratings.push('conservative');
    } else if (longRunRatio <= 2.5) {
      ratings.push('moderate');
      reasons.push(`Race distance (${info.km} km) is well beyond your longest recent run (${longestRecentRun} km); the long-run progression will matter.`);
    } else if (longRunRatio <= 4) {
      ratings.push('aggressive');
      reasons.push(`Your longest recent run (${longestRecentRun} km) is a small fraction of race distance (${info.km} km), so endurance is the main constraint.`);
    } else {
      ratings.push('high-risk');
      reasons.push(`Your longest recent run (${longestRecentRun} km) is very short compared to the race (${info.km} km) - building that endurance safely may need more weeks than this plan has.`);
    }
  }

  return { rating: worstRating(ratings), reasons };
}
