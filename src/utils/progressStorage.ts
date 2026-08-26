export type WorkoutStatus = 'completed' | 'skipped';

// Progress for one plan: day key -> status. Days without an entry are unmarked.
export type PlanProgress = Record<string, WorkoutStatus>;

const PROGRESS_KEY = 'runathon.progress.v1';

export function dayKey(week: number, dayIndex: number): string {
  return `w${week}-d${dayIndex}`;
}

function loadAllProgress(): Record<string, PlanProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as Record<string, PlanProgress>;
  } catch {
    return {};
  }
}

function persistAllProgress(all: Record<string, PlanProgress>): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {
    // Storage may be unavailable; tracking simply won't persist.
  }
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

export function clearPlanProgress(planId: string): void {
  const all = loadAllProgress();
  if (!(planId in all)) return;
  delete all[planId];
  persistAllProgress(all);
}
