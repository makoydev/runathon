import type { TrainingDay, TrainingPlan, TrainingWeek } from '../types';
import type { PlanProgress } from './progressStorage';
import { dayKey } from './progressStorage';

// Pure helpers for the plan screen: which week to open, how far along each
// week is, and the shared colour language for phases and workout types.

export interface WeekCompletion {
  total: number;
  completed: number;
  skipped: number;
}

export function isTrackable(day: TrainingDay): boolean {
  return Boolean(day.dayType && day.dayType !== 'rest');
}

export function weekCompletion(week: TrainingWeek, progress: PlanProgress): WeekCompletion {
  let total = 0;
  let completed = 0;
  let skipped = 0;
  week.days.forEach((day, index) => {
    if (!isTrackable(day)) return;
    total += 1;
    const status = progress[dayKey(week.week, index)];
    if (status === 'completed') completed += 1;
    if (status === 'skipped') skipped += 1;
  });
  return { total, completed, skipped };
}

// The week the runner is "on": the first with an unmarked workout. Once
// everything is marked, stay on the final week.
export function firstOpenWeek(plan: TrainingPlan, progress: PlanProgress): number {
  for (const week of plan.weeks) {
    const { total, completed, skipped } = weekCompletion(week, progress);
    if (completed + skipped < total) return week.week;
  }
  return plan.weeks[plan.weeks.length - 1]?.week ?? 1;
}

export function weekTotalKm(week: TrainingWeek): number {
  return week.days.reduce((sum, day) => (isTrackable(day) ? sum + (day.distanceKm ?? 0) : sum), 0);
}

// The long run, or the race itself in race week: the bar segment worth reading.
export function weekKeyRunKm(week: TrainingWeek): number {
  const race = week.days.find((day) => day.workout.includes('RACE DAY'));
  if (race) return race.distanceKm ?? 0;
  return week.days.find((day) => day.dayType === 'long')?.distanceKm ?? 0;
}

export interface PhaseStyle {
  badge: string;
  band: string;
}

export const PHASE_STYLES: Record<string, PhaseStyle> = {
  'Base Building': {
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    band: 'bg-emerald-600',
  },
  'Build Phase': {
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    band: 'bg-amber-600',
  },
  'Peak Training': {
    badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
    band: 'bg-rose-600',
  },
  Taper: {
    badge: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300',
    band: 'bg-sky-600',
  },
};

export const FALLBACK_PHASE_STYLE: PhaseStyle = {
  badge: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
  band: 'bg-slate-500',
};

export function phaseStyle(phase: string): PhaseStyle {
  return PHASE_STYLES[phase] ?? FALLBACK_PHASE_STYLE;
}

// Consecutive weeks sharing a phase, for the band under the overview chart.
export interface PhaseSpan {
  phase: string;
  count: number;
}

export function phaseSpans(weeks: TrainingWeek[]): PhaseSpan[] {
  const spans: PhaseSpan[] = [];
  for (const week of weeks) {
    const last = spans[spans.length - 1];
    if (last && last.phase === week.phase) {
      last.count += 1;
    } else {
      spans.push({ phase: week.phase, count: 1 });
    }
  }
  return spans;
}

export interface DayTypeStyle {
  label: string;
  accent: string;
  chip: string;
}

const DAY_TYPE_STYLES: Record<NonNullable<TrainingDay['dayType']>, DayTypeStyle> = {
  long: {
    label: 'Long run',
    accent: 'border-violet-500',
    chip: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300',
  },
  quality: {
    label: 'Quality',
    accent: 'border-rose-500',
    chip: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
  },
  easy: {
    label: 'Easy',
    accent: 'border-sky-500',
    chip: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300',
  },
  recovery: {
    label: 'Recovery',
    accent: 'border-emerald-500',
    chip: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
  },
  rest: {
    label: 'Rest',
    accent: 'border-slate-300 dark:border-slate-600',
    chip: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  },
};

export function dayTypeStyle(day: TrainingDay): DayTypeStyle {
  if (day.workout.includes('RACE DAY')) {
    return {
      label: 'Race day',
      accent: 'border-violet-500',
      chip: 'bg-violet-500 text-white',
    };
  }
  return DAY_TYPE_STYLES[day.dayType ?? 'rest'];
}
