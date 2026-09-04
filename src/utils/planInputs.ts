import type { Pace, PlanAssumptions, RaceDistance } from '../types';
import { maxTrainingDays } from './planAssumptions';

export type InputField = 'distance' | 'currentPace' | 'targetPace' | 'weeklyMileage' | 'longestRun' | 'schedule';

export interface InputIssue {
  field: InputField;
  message: string;
}

export interface PlanInputs {
  distance: RaceDistance | null;
  currentPace: Pace;
  targetPace: Pace;
  currentWeeklyMileage: number;
  longestRecentRun: number;
  trainingDays: number;
  assumptions: PlanAssumptions;
}

export interface PlanInputCheck {
  // Problems that stop generation until fixed, in form order.
  blockers: InputIssue[];
  // Things worth knowing that still allow a plan to be generated.
  warnings: InputIssue[];
}

export const DISTANCE_PROMPT = 'Select a race distance to get started';

function hasPace(pace: Pace): boolean {
  return pace.minutes > 0 || pace.seconds > 0;
}

function paceSeconds(pace: Pace): number {
  return pace.minutes * 60 + pace.seconds;
}

// Only invalid input blocks generation; risky goals are left to the
// feasibility check so runners can still see the plan they asked for.
export function validatePlanInputs(inputs: PlanInputs): PlanInputCheck {
  const blockers: InputIssue[] = [];
  const warnings: InputIssue[] = [];

  if (!inputs.distance) {
    blockers.push({ field: 'distance', message: DISTANCE_PROMPT });
  }
  if (!hasPace(inputs.currentPace)) {
    blockers.push({ field: 'currentPace', message: 'Enter your current pace (it cannot be 0:00).' });
  }
  if (!hasPace(inputs.targetPace)) {
    blockers.push({ field: 'targetPace', message: 'Enter your target pace (it cannot be 0:00).' });
  }
  if (inputs.currentWeeklyMileage <= 0) {
    blockers.push({ field: 'weeklyMileage', message: 'Enter your current weekly mileage.' });
  }
  if (inputs.longestRecentRun <= 0) {
    blockers.push({ field: 'longestRun', message: 'Enter your longest recent run.' });
  } else if (inputs.longestRecentRun > inputs.currentWeeklyMileage) {
    blockers.push({
      field: 'longestRun',
      message: 'Longest recent run cannot be greater than your current weekly mileage.',
    });
  }
  const availableDays = maxTrainingDays(inputs.assumptions);
  if (inputs.trainingDays > availableDays) {
    blockers.push({
      field: 'schedule',
      message: `Only ${availableDays} days are available, but the plan needs ${inputs.trainingDays} training days. Free up a weekday or reduce your training days.`,
    });
  }

  if (hasPace(inputs.currentPace) && hasPace(inputs.targetPace) && paceSeconds(inputs.targetPace) >= paceSeconds(inputs.currentPace)) {
    warnings.push({
      field: 'targetPace',
      message: 'Target pace is not faster than your current pace. The plan will focus on maintenance unless you set a quicker goal.',
    });
  }

  return { blockers, warnings };
}

export function issueFor(issues: InputIssue[], field: InputField): string | undefined {
  return issues.find((issue) => issue.field === field)?.message;
}
