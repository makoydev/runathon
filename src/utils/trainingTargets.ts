import type { RaceDistance, ExperienceLevel } from '../types';

// Volume targets for an intermediate runner, in km. Peaks are what a typical
// runner should reach in the last hard week before the taper. The generator
// ramps toward them; the feasibility check judges how far away the runner is.
export interface DistanceTargets {
  startMileage: number;
  peakMileage: number;
  peakLongRun: number;
  // Longest continuous threshold segment the plan will prescribe.
  maxThresholdKm: number;
  // Interval rep length: short reps for short races, longer reps for long ones.
  repKm: number;
  // Peak long run for run-walk plans, which Galloway takes to race distance.
  runWalkLongRun: number;
}

export const DISTANCE_TARGETS: Record<RaceDistance, DistanceTargets> = {
  '5k': { startMileage: 15, peakMileage: 30, peakLongRun: 12, maxThresholdKm: 5, repKm: 0.4, runWalkLongRun: 6 },
  '10k': { startMileage: 20, peakMileage: 40, peakLongRun: 16, maxThresholdKm: 6, repKm: 0.4, runWalkLongRun: 11 },
  'half': { startMileage: 25, peakMileage: 50, peakLongRun: 21, maxThresholdKm: 8, repKm: 0.8, runWalkLongRun: 21.1 },
  'full': { startMileage: 30, peakMileage: 70, peakLongRun: 32, maxThresholdKm: 12, repKm: 1, runWalkLongRun: 42.2 },
};

// Scaling knobs per experience level: how hard the plan is allowed to push
// volume growth, long-run progression, and weekly quality frequency.
export interface ExperienceConfig {
  peakMileageMultiplier: number;
  peakLongRunMultiplier: number;
  // Compounding weekly cap on volume growth from the runner's current mileage.
  weeklyGrowthRate: number;
  // Cap on how much the long run may grow from one week to the next, in km.
  longRunGrowthPerWeek: number;
  maxQualitySessions: number;
}

export const EXPERIENCE_CONFIG: Record<ExperienceLevel, ExperienceConfig> = {
  beginner: { peakMileageMultiplier: 0.85, peakLongRunMultiplier: 0.85, weeklyGrowthRate: 1.08, longRunGrowthPerWeek: 2, maxQualitySessions: 1 },
  intermediate: { peakMileageMultiplier: 1, peakLongRunMultiplier: 1, weeklyGrowthRate: 1.1, longRunGrowthPerWeek: 2.5, maxQualitySessions: 2 },
  advanced: { peakMileageMultiplier: 1.15, peakLongRunMultiplier: 1.1, weeklyGrowthRate: 1.12, longRunGrowthPerWeek: 3, maxQualitySessions: 2 },
};

export function peakWeeklyMileage(distance: RaceDistance, level: ExperienceLevel = 'intermediate'): number {
  return Math.round(DISTANCE_TARGETS[distance].peakMileage * EXPERIENCE_CONFIG[level].peakMileageMultiplier);
}

export function peakLongRun(distance: RaceDistance, level: ExperienceLevel = 'intermediate'): number {
  return Math.round(DISTANCE_TARGETS[distance].peakLongRun * EXPERIENCE_CONFIG[level].peakLongRunMultiplier);
}
