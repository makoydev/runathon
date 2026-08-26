import type { DistanceUnit, TrainingPlan, TrainingWeek } from '../types';
import type { PlanProgress, PlanWeekFeedback, WeekFeedback } from './progressStorage';
import { dayKey } from './progressStorage';
import { formatDistanceInUnit } from './units';

export interface WeekAdjustment {
  factor: number;
  reason: string;
}

// Never scale a run below this; tiny prescriptions read as noise, not training.
const MIN_ADJUSTED_DISTANCE_KM = 2;

// More than a third of the week skipped counts as a struggling week.
const HIGH_SKIP_FRACTION = 1 / 3;

function trackableDays(week: TrainingWeek): number[] {
  const indices: number[] = [];
  week.days.forEach((day, dayIndex) => {
    if (day.dayType && day.dayType !== 'rest') indices.push(dayIndex);
  });
  return indices;
}

export function isWeekFullyMarked(week: TrainingWeek, progress: PlanProgress): boolean {
  const indices = trackableDays(week);
  if (indices.length === 0) return false;
  return indices.every((dayIndex) => progress[dayKey(week.week, dayIndex)] !== undefined);
}

// Decide how the week after `week` should change. Conservative by design:
// feedback only ever reduces volume; a good week keeps the plan as written.
export function assessWeekAdjustment(
  week: TrainingWeek,
  progress: PlanProgress,
  feedback: WeekFeedback
): WeekAdjustment | null {
  const indices = trackableDays(week);
  const skipped = indices.filter(
    (dayIndex) => progress[dayKey(week.week, dayIndex)] === 'skipped'
  ).length;
  const highSkip = indices.length > 0 && skipped / indices.length > HIGH_SKIP_FRACTION;

  if (feedback === 'tired' && highSkip) {
    return {
      factor: 0.75,
      reason: `Volume reduced 25% after week ${week.week}: you reported high fatigue and skipped ${skipped} of ${indices.length} workouts.`,
    };
  }
  if (feedback === 'tired') {
    return {
      factor: 0.85,
      reason: `Volume reduced 15% after week ${week.week}: you reported high fatigue.`,
    };
  }
  if (highSkip) {
    return {
      factor: 0.85,
      reason: `Volume reduced 15% after week ${week.week}: ${skipped} of ${indices.length} workouts were skipped.`,
    };
  }
  return null;
}

// The earliest week that is fully marked, still unanswered, and has a
// following week left to adjust. Null when there is nothing to ask.
export function nextFeedbackWeek(
  plan: TrainingPlan,
  progress: PlanProgress,
  feedback: PlanWeekFeedback
): number | null {
  const lastWeek = plan.weeks[plan.weeks.length - 1]?.week;
  for (const week of plan.weeks) {
    if (week.week === lastWeek) break;
    if (feedback[week.week] !== undefined) continue;
    if (isWeekFullyMarked(week, progress)) return week.week;
  }
  return null;
}

// Distance display strings carry suffixes ("total", "(optional)", "easy + strides");
// swap only the leading measurement so the suffix survives the adjustment.
function rescaleDistanceText(text: string | undefined, km: number, unit: DistanceUnit): string {
  const formatted = formatDistanceInUnit(km, unit);
  if (!text) return formatted;
  const measurement = /^\d+(?:\.\d+)?\s(?:km|mi)/;
  return measurement.test(text) ? text.replace(measurement, formatted) : formatted;
}

function adjustWeek(week: TrainingWeek, adjustment: WeekAdjustment, unit: DistanceUnit): TrainingWeek {
  const days = week.days.map((day) => {
    if (!day.distanceKm || day.dayType === 'rest' || day.workout.includes('RACE DAY')) return day;
    const scaledKm = Math.max(
      Math.min(MIN_ADJUSTED_DISTANCE_KM, day.distanceKm),
      Math.round(day.distanceKm * adjustment.factor * 10) / 10
    );
    return {
      ...day,
      distanceKm: scaledKm,
      distance: rescaleDistanceText(day.distance, scaledKm, unit),
    };
  });
  const totalKm = days.reduce(
    (total, day) => (day.dayType === 'rest' ? total : total + (day.distanceKm ?? 0)),
    0
  );
  return {
    ...week,
    days,
    totalMileage: formatDistanceInUnit(totalKm, unit),
    adjustmentNote: adjustment.reason,
  };
}

// Derive the plan as it should look given the runner's weekly check-ins.
// Pure: the stored plan is never mutated, so clearing feedback restores it.
export function applyWeekAdjustments(
  plan: TrainingPlan,
  feedback: PlanWeekFeedback,
  progress: PlanProgress
): TrainingPlan {
  const adjustments = new Map<number, WeekAdjustment>();
  plan.weeks.forEach((week) => {
    const answer = feedback[week.week];
    if (!answer) return;
    const adjustment = assessWeekAdjustment(week, progress, answer);
    if (adjustment) adjustments.set(week.week + 1, adjustment);
  });
  if (adjustments.size === 0) return plan;

  const unit = plan.unit ?? 'km';
  return {
    ...plan,
    weeks: plan.weeks.map((week) => {
      const adjustment = adjustments.get(week.week);
      return adjustment ? adjustWeek(week, adjustment, unit) : week;
    }),
  };
}
