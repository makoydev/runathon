import type { DistanceUnit, ExperienceLevel, Pace, RaceDistance, TrainingPlan } from '../types';
import { DISTANCE_INFO, EXPERIENCE_INFO } from '../types';

// The generator is deterministic, so a share link only needs the inputs.
export interface SharedPlanInputs {
  distance: RaceDistance;
  currentPace: Pace; // canonical per-km
  targetPace: Pace;
  trainingDays: number;
  currentWeeklyMileage?: number; // canonical km
  longestRecentRun?: number;
  experienceLevel: ExperienceLevel;
  unit: DistanceUnit;
}

const MIN_TRAINING_DAYS = 3;
const MAX_TRAINING_DAYS = 6;
// Sanity bounds for pace seconds per km: 2:00/km to 20:00/km.
const MIN_PACE_SECONDS = 120;
const MAX_PACE_SECONDS = 1200;
const MAX_DISTANCE_KM = 500;

function paceToSeconds(pace: Pace): number {
  return pace.minutes * 60 + pace.seconds;
}

function paceFromSeconds(totalSeconds: number): Pace {
  return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 };
}

export function encodeShareParams(plan: TrainingPlan): string {
  const params = new URLSearchParams({
    d: plan.distance,
    cp: String(paceToSeconds(plan.currentPace)),
    tp: String(paceToSeconds(plan.targetPace)),
    td: String(plan.trainingDays),
    xp: plan.experienceLevel ?? 'intermediate',
    u: plan.unit ?? 'km',
  });
  if (plan.currentWeeklyMileage) params.set('wm', String(plan.currentWeeklyMileage));
  if (plan.longestRecentRun) params.set('lr', String(plan.longestRecentRun));
  return params.toString();
}

function parsePaceSeconds(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const seconds = Number(value);
  return seconds >= MIN_PACE_SECONDS && seconds <= MAX_PACE_SECONDS ? seconds : null;
}

function parseDistanceKm(value: string | null): number | undefined | null {
  if (value === null) return undefined; // optional field absent
  if (!/^\d+(\.\d+)?$/.test(value)) return null;
  const km = Number(value);
  return km > 0 && km <= MAX_DISTANCE_KM ? km : null;
}

// Returns null unless every present parameter is valid; a broken link should
// fall back to the normal form, never to a half-parsed plan.
export function decodeShareParams(search: string): SharedPlanInputs | null {
  const params = new URLSearchParams(search);
  const distance = params.get('d');
  if (distance === null || !(distance in DISTANCE_INFO)) return null;

  const currentPaceSeconds = parsePaceSeconds(params.get('cp'));
  const targetPaceSeconds = parsePaceSeconds(params.get('tp'));
  if (currentPaceSeconds === null || targetPaceSeconds === null) return null;

  const trainingDaysRaw = params.get('td');
  if (trainingDaysRaw === null || !/^\d+$/.test(trainingDaysRaw)) return null;
  const trainingDays = Number(trainingDaysRaw);
  if (trainingDays < MIN_TRAINING_DAYS || trainingDays > MAX_TRAINING_DAYS) return null;

  const experience = params.get('xp') ?? 'intermediate';
  if (!(experience in EXPERIENCE_INFO)) return null;

  const unit = params.get('u') ?? 'km';
  if (unit !== 'km' && unit !== 'mi') return null;

  const currentWeeklyMileage = parseDistanceKm(params.get('wm'));
  const longestRecentRun = parseDistanceKm(params.get('lr'));
  if (currentWeeklyMileage === null || longestRecentRun === null) return null;

  return {
    distance: distance as RaceDistance,
    currentPace: paceFromSeconds(currentPaceSeconds),
    targetPace: paceFromSeconds(targetPaceSeconds),
    trainingDays,
    currentWeeklyMileage,
    longestRecentRun,
    experienceLevel: experience as ExperienceLevel,
    unit,
  };
}

// True when two plans were generated from the same inputs, so opening a share
// link twice reuses the already-saved plan instead of duplicating it.
export function sameInputs(a: TrainingPlan, b: TrainingPlan): boolean {
  return (
    a.distance === b.distance &&
    paceToSeconds(a.currentPace) === paceToSeconds(b.currentPace) &&
    paceToSeconds(a.targetPace) === paceToSeconds(b.targetPace) &&
    a.trainingDays === b.trainingDays &&
    (a.currentWeeklyMileage ?? 0) === (b.currentWeeklyMileage ?? 0) &&
    (a.longestRecentRun ?? 0) === (b.longestRecentRun ?? 0) &&
    (a.experienceLevel ?? 'intermediate') === (b.experienceLevel ?? 'intermediate') &&
    (a.unit ?? 'km') === (b.unit ?? 'km')
  );
}

export function buildShareUrl(plan: TrainingPlan): string {
  return `${window.location.origin}${window.location.pathname}?${encodeShareParams(plan)}`;
}
