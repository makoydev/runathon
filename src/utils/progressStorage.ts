export type WorkoutStatus = 'completed' | 'skipped';

// Progress for one plan: day key -> status. Days without an entry are unmarked.
export type PlanProgress = Record<string, WorkoutStatus>;

// How a finished week felt, answered once per week at the week boundary.
export type WeekFeedback = 'fresh' | 'normal' | 'tired';

// Feedback for one plan: week number -> answer. Weeks without an entry are unanswered.
export type PlanWeekFeedback = Record<number, WeekFeedback>;

const PROGRESS_KEY = 'runathon.progress.v1';
const WEEK_FEEDBACK_KEY = 'runathon.week-feedback.v1';

export function dayKey(week: number, dayIndex: number): string {
  return `w${week}-d${dayIndex}`;
}

function loadRecord<T>(storageKey: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as Record<string, T>;
  } catch {
    return {};
  }
}

function persistRecord<T>(storageKey: string, all: Record<string, T>): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(all));
  } catch {
    // Storage may be unavailable; tracking simply won't persist.
  }
}

function loadAllProgress(): Record<string, PlanProgress> {
  return loadRecord<PlanProgress>(PROGRESS_KEY);
}

function persistAllProgress(all: Record<string, PlanProgress>): void {
  persistRecord(PROGRESS_KEY, all);
}

export function loadPlanProgress(planId: string): PlanProgress {
  const progress = loadAllProgress()[planId];
  return typeof progress === 'object' && progress !== null ? progress : {};
}

export function setWorkoutStatus(
  planId: string,
  key: string,
  status: WorkoutStatus | null
): PlanProgress {
  const all = loadAllProgress();
  const progress = { ...(all[planId] ?? {}) };
  if (status === null) {
    delete progress[key];
  } else {
    progress[key] = status;
  }
  all[planId] = progress;
  persistAllProgress(all);
  return progress;
}

export function loadWeekFeedback(planId: string): PlanWeekFeedback {
  const feedback = loadRecord<PlanWeekFeedback>(WEEK_FEEDBACK_KEY)[planId];
  return typeof feedback === 'object' && feedback !== null ? feedback : {};
}

export function setWeekFeedback(planId: string, week: number, feedback: WeekFeedback): PlanWeekFeedback {
  const all = loadRecord<PlanWeekFeedback>(WEEK_FEEDBACK_KEY);
  const planFeedback = { ...(all[planId] ?? {}), [week]: feedback };
  all[planId] = planFeedback;
  persistRecord(WEEK_FEEDBACK_KEY, all);
  return planFeedback;
}

export function clearPlanProgress(planId: string): void {
  const allProgress = loadAllProgress();
  if (planId in allProgress) {
    delete allProgress[planId];
    persistAllProgress(allProgress);
  }
  const allFeedback = loadRecord<PlanWeekFeedback>(WEEK_FEEDBACK_KEY);
  if (planId in allFeedback) {
    delete allFeedback[planId];
    persistRecord(WEEK_FEEDBACK_KEY, allFeedback);
  }
}
