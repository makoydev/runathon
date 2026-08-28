export type WorkoutStatus = 'completed' | 'skipped';

// Progress for one plan: day key -> status. Days without an entry are unmarked.
export type PlanProgress = Record<string, WorkoutStatus>;

// How a finished week felt, answered once per week at the week boundary.
export type WeekFeedback = 'fresh' | 'normal' | 'tired';

// Feedback for one plan: week number -> answer. Weeks without an entry are unanswered.
export type PlanWeekFeedback = Record<number, WeekFeedback>;

// Optional detail recorded alongside a marked workout: perceived effort and a free note.
export interface WorkoutLogEntry {
  rpe?: number; // 1 (very easy) to 10 (max effort)
  note?: string;
}

// Log for one plan: day key -> entry. Days without an entry have no details.
export type PlanWorkoutLog = Record<string, WorkoutLogEntry>;

const PROGRESS_KEY = 'runathon.progress.v1';
const WEEK_FEEDBACK_KEY = 'runathon.week-feedback.v1';
const WORKOUT_LOG_KEY = 'runathon.workout-log.v1';

export const MIN_RPE = 1;
export const MAX_RPE = 10;

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

export function loadWorkoutLog(planId: string): PlanWorkoutLog {
  const log = loadRecord<PlanWorkoutLog>(WORKOUT_LOG_KEY)[planId];
  return typeof log === 'object' && log !== null ? log : {};
}

function normalizeLogEntry(entry: WorkoutLogEntry): WorkoutLogEntry | null {
  const normalized: WorkoutLogEntry = {};
  if (entry.rpe !== undefined && Number.isFinite(entry.rpe)) {
    normalized.rpe = Math.min(MAX_RPE, Math.max(MIN_RPE, Math.round(entry.rpe)));
  }
  const note = entry.note?.trim();
  if (note) normalized.note = note;
  return normalized.rpe === undefined && normalized.note === undefined ? null : normalized;
}

export function setWorkoutLogEntry(
  planId: string,
  key: string,
  entry: WorkoutLogEntry
): PlanWorkoutLog {
  const all = loadRecord<PlanWorkoutLog>(WORKOUT_LOG_KEY);
  const log = { ...(all[planId] ?? {}) };
  const normalized = normalizeLogEntry(entry);
  if (normalized === null) {
    delete log[key];
  } else {
    log[key] = normalized;
  }
  all[planId] = log;
  persistRecord(WORKOUT_LOG_KEY, all);
  return log;
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
  const allLogs = loadRecord<PlanWorkoutLog>(WORKOUT_LOG_KEY);
  if (planId in allLogs) {
    delete allLogs[planId];
    persistRecord(WORKOUT_LOG_KEY, allLogs);
  }
}
