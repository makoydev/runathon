import type { PlanAssumptions, TrainingDay, TrainingPlan } from '../types';

export const DEFAULT_LONG_RUN_DAY = 'Saturday';

export const DEFAULT_ASSUMPTIONS: PlanAssumptions = {
  longRunDay: DEFAULT_LONG_RUN_DAY,
  unavailableDays: [],
};

export function isDefaultAssumptions(assumptions: PlanAssumptions): boolean {
  return (
    assumptions.longRunDay === DEFAULT_LONG_RUN_DAY && assumptions.unavailableDays.length === 0
  );
}

// A plan needs enough available weekdays for its training frequency.
export function maxTrainingDays(assumptions: PlanAssumptions): number {
  return 7 - assumptions.unavailableDays.length;
}

function isRaceDay(day: TrainingDay): boolean {
  return day.workout.includes('RACE DAY');
}

function isRest(day: TrainingDay): boolean {
  return !day.dayType || day.dayType === 'rest';
}

// Swap what happens on two weekdays while each keeps its weekday name.
function swapContents(days: TrainingDay[], i: number, j: number): void {
  const { day: nameI, ...contentI } = days[i];
  const { day: nameJ, ...contentJ } = days[j];
  days[i] = { day: nameI, ...contentJ };
  days[j] = { day: nameJ, ...contentI };
}

// Remap each generated week onto the runner's schedule constraints. Pure
// reordering: weekly volume, workout content, and totals never change. The
// race itself never moves - its date is not a preference.
export function applyPlanAssumptions(
  plan: TrainingPlan,
  assumptions: PlanAssumptions
): TrainingPlan {
  if (isDefaultAssumptions(assumptions)) return plan;

  const weeks = plan.weeks.map((week) => {
    const days = week.days.map((day) => ({ ...day }));

    // Place the long run on the preferred day (skipped if that day is
    // unavailable or holds the race).
    const longIndex = days.findIndex((day) => day.dayType === 'long');
    const targetIndex = days.findIndex((day) => day.day === assumptions.longRunDay);
    if (
      longIndex >= 0 &&
      targetIndex >= 0 &&
      longIndex !== targetIndex &&
      !assumptions.unavailableDays.includes(assumptions.longRunDay) &&
      !isRaceDay(days[targetIndex])
    ) {
      swapContents(days, longIndex, targetIndex);
    }

    // Move workouts off unavailable days onto available rest days.
    days.forEach((day, index) => {
      if (!assumptions.unavailableDays.includes(day.day)) return;
      if (isRest(day) || isRaceDay(day)) return;
      const restIndex = days.findIndex(
        (candidate) => isRest(candidate) && !assumptions.unavailableDays.includes(candidate.day)
      );
      if (restIndex >= 0) swapContents(days, index, restIndex);
    });

    return { ...week, days };
  });

  return { ...plan, weeks, assumptions };
}
