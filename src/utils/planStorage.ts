import type { TrainingPlan } from '../types';

export interface SavedPlan {
  id: string;
  createdAt: string;
  plan: TrainingPlan;
}

const PLANS_KEY = 'runathon.saved-plans.v1';
const ACTIVE_PLAN_KEY = 'runathon.active-plan-id.v1';
const MAX_SAVED_PLANS = 10;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isSavedPlan(value: unknown): value is SavedPlan {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const plan = candidate.plan as Record<string, unknown> | undefined;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof plan === 'object' &&
    plan !== null &&
    typeof plan.distance === 'string' &&
    Array.isArray(plan.weeks)
  );
}

export function loadSavedPlans(): SavedPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedPlan);
  } catch {
    return [];
  }
}

function persistPlans(plans: SavedPlan[]): void {
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  } catch {
    // Storage may be unavailable (private mode, quota) - the app still works without persistence.
  }
}

export function savePlan(plan: TrainingPlan): SavedPlan {
  const record: SavedPlan = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    plan,
  };
  const plans = [record, ...loadSavedPlans()].slice(0, MAX_SAVED_PLANS);
  persistPlans(plans);
  return record;
}

export function deleteSavedPlan(id: string): SavedPlan[] {
  const plans = loadSavedPlans().filter((saved) => saved.id !== id);
  persistPlans(plans);
  return plans;
}

export function loadActivePlanId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PLAN_KEY);
  } catch {
    return null;
  }
}

export function storeActivePlanId(id: string | null): void {
  try {
    if (id === null) {
      localStorage.removeItem(ACTIVE_PLAN_KEY);
    } else {
      localStorage.setItem(ACTIVE_PLAN_KEY, id);
    }
  } catch {
    // Ignore storage failures - persistence is a convenience, not a requirement.
  }
}
