import type { RaceDistance, Pace, DistanceUnit } from '../types';
import { DISTANCE_INFO } from '../types';
import { formatDistanceInUnit } from './units';
import { peakWeeklyMileage, peakLongRun } from './trainingTargets';

export type FeasibilityRating = 'conservative' | 'moderate' | 'aggressive' | 'high-risk';

export interface GoalFeasibility {
  rating: FeasibilityRating;
  reasons: string[];
}

const RATING_ORDER: FeasibilityRating[] = ['conservative', 'moderate', 'aggressive', 'high-risk'];

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
  longestRecentRun: number,
  unit: DistanceUnit = 'km'
): GoalFeasibility {
  const info = DISTANCE_INFO[distance];
  // Judged against what the generated plan will actually ask for at its peak.
  const targetPeakMileage = peakWeeklyMileage(distance);
  const targetLongRun = peakLongRun(distance);
  const reasons: string[] = [];
  const ratings: FeasibilityRating[] = [];
  const fmt = (km: number) => formatDistanceInUnit(km, unit);

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
    const mileageRatio = targetPeakMileage / currentWeeklyMileage;
    if (mileageRatio <= 1.5) {
      ratings.push('conservative');
    } else if (mileageRatio <= 2.5) {
      ratings.push('moderate');
      reasons.push(`Weekly mileage needs to grow from ${fmt(currentWeeklyMileage)} toward ~${fmt(targetPeakMileage)}, a manageable but real build.`);
    } else if (mileageRatio <= 3.5) {
      ratings.push('aggressive');
      reasons.push(`Weekly mileage must roughly triple from ${fmt(currentWeeklyMileage)} toward ~${fmt(targetPeakMileage)}, which is a steep build for this timeline.`);
    } else {
      ratings.push('high-risk');
      reasons.push(`Weekly mileage of ${fmt(currentWeeklyMileage)} is far below the ~${fmt(targetPeakMileage)} typically needed - the required ramp risks injury.`);
    }
  }

  // Long-run readiness: how far the plan's peak long run is beyond the longest recent run.
  if (longestRecentRun > 0) {
    const longRunRatio = targetLongRun / longestRecentRun;
    const buildNote = `the plan builds your long run to ~${fmt(targetLongRun)} for the ${fmt(info.km)} race`;
    if (longRunRatio <= 1.75) {
      ratings.push('conservative');
    } else if (longRunRatio <= 2.5) {
      ratings.push('moderate');
      reasons.push(`Your longest recent run (${fmt(longestRecentRun)}) has room to grow; ${buildNote}.`);
    } else if (longRunRatio <= 4) {
      ratings.push('aggressive');
      reasons.push(`Your longest recent run (${fmt(longestRecentRun)}) is a small fraction of what you will need; ${buildNote}, so endurance is the main constraint.`);
    } else {
      ratings.push('high-risk');
      reasons.push(`Your longest recent run (${fmt(longestRecentRun)}) is very short for this goal; ${buildNote}, and building that safely may need more weeks than this plan has.`);
    }
  }

  return { rating: worstRating(ratings), reasons };
}
