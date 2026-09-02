import type { DistanceUnit, ExperienceLevel, Pace, RaceDistance, RunWalkRatio, TrainingPlan } from '../types';
import { generateTrainingPlan } from './planGenerator';

export interface PlanOptionStats {
  trainingDays: number;
  totalMileageKm: number;
  qualityDays: number;
  longestRunKm: number;
  /** Non-rest days in race week, including the shakeout and the race itself. */
  raceWeekRunDays: number;
}

export const COMPARISON_DAY_OPTIONS = [3, 4, 5, 6];

function summarizePlan(plan: TrainingPlan): PlanOptionStats {
  let totalMileageKm = 0;
  let qualityDays = 0;
  let longestRunKm = 0;

  plan.weeks.forEach((week) => {
    week.days.forEach((day) => {
      if (!day.dayType || day.dayType === 'rest') return;
      totalMileageKm += day.distanceKm ?? 0;
      longestRunKm = Math.max(longestRunKm, day.distanceKm ?? 0);
      if (day.dayType === 'quality') qualityDays += 1;
    });
  });

  const raceWeek = plan.weeks[plan.weeks.length - 1];
  const raceWeekRunDays = raceWeek.days.filter(
    (day) => day.dayType && day.dayType !== 'rest'
  ).length;

  return {
    trainingDays: plan.trainingDays,
    totalMileageKm: Math.round(totalMileageKm * 10) / 10,
    qualityDays,
    longestRunKm,
    raceWeekRunDays,
  };
}

// Generate the same plan at each training frequency and reduce each to the
// stats runners compare: volume, quality load, longest run, race week shape.
export function comparePlanOptions(
  distance: RaceDistance,
  currentPaceKm: Pace,
  targetPaceKm: Pace,
  weeklyMileageKm: number,
  longestRunKm: number,
  experienceLevel: ExperienceLevel,
  unit: DistanceUnit,
  runWalk: RunWalkRatio | null = null
): PlanOptionStats[] {
  return COMPARISON_DAY_OPTIONS.map((trainingDays) =>
    summarizePlan(
      generateTrainingPlan(
        distance,
        currentPaceKm,
        targetPaceKm,
        trainingDays,
        weeklyMileageKm,
        longestRunKm,
        experienceLevel,
        unit,
        runWalk
      )
    )
  );
}
