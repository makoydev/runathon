import type { TrainingPlan } from '../types';
import type { PlanProgress } from './progressStorage';
import { dayKey } from './progressStorage';

export interface UpcomingSession {
  week: number;
  day: string;
  workout: string;
}

export interface ProgressSummary {
  totalWorkouts: number;
  completedCount: number;
  skippedCount: number;
  completionRate: number;
  completedMileageKm: number;
  longestCompletedRunKm: number;
  nextKeySession: UpcomingSession | null;
}

export function summarizeProgress(plan: TrainingPlan, progress: PlanProgress): ProgressSummary {
  let totalWorkouts = 0;
  let completedCount = 0;
  let skippedCount = 0;
  let completedMileageKm = 0;
  let longestCompletedRunKm = 0;
  let nextKeySession: UpcomingSession | null = null;

  plan.weeks.forEach((week) => {
    week.days.forEach((day, dayIndex) => {
      if (!day.dayType || day.dayType === 'rest') return;
      totalWorkouts += 1;

      const status = progress[dayKey(week.week, dayIndex)];
      if (status === 'completed') {
        completedCount += 1;
        completedMileageKm += day.distanceKm ?? 0;
        longestCompletedRunKm = Math.max(longestCompletedRunKm, day.distanceKm ?? 0);
      } else if (status === 'skipped') {
        skippedCount += 1;
      } else if (
        nextKeySession === null &&
        (day.dayType === 'quality' || day.dayType === 'long')
      ) {
        nextKeySession = { week: week.week, day: day.day, workout: day.workout };
      }
    });
  });

  const markedCount = completedCount + skippedCount;
  return {
    totalWorkouts,
    completedCount,
    skippedCount,
    completionRate: markedCount > 0 ? completedCount / markedCount : 0,
    completedMileageKm: Math.round(completedMileageKm * 10) / 10,
    longestCompletedRunKm,
    nextKeySession,
  };
}
