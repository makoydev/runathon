import type { DistanceUnit, ExperienceLevel, Pace, RaceDistance, RunWalkRatio, TrainingDay, TrainingMethod, TrainingWeek } from '../types';
import { DISTANCE_INFO, EXTENDED_PLAN_WEEKS, supportsExtendedPlan } from '../types';
import { KM_PER_MILE } from './units';
import { DISTANCE_TARGETS, EXPERIENCE_CONFIG } from './trainingTargets';

// Galloway-style run-walk-run plans. Walk breaks are taken from the first
// minute of every run, weekday runs are short and time-based, and the long
// run grows every week while short, then every other week, all the way to
// race distance where the timeline allows.

export interface RunWalkPreset {
  id: string;
  label: string;
  ratio: RunWalkRatio;
}

export const RUN_WALK_PRESETS: RunWalkPreset[] = [
  { id: '4:1', label: '4 min run / 1 min walk', ratio: { runSeconds: 240, walkSeconds: 60 } },
  { id: '3:1', label: '3 min run / 1 min walk', ratio: { runSeconds: 180, walkSeconds: 60 } },
  { id: '2:1', label: '2 min run / 1 min walk', ratio: { runSeconds: 120, walkSeconds: 60 } },
  { id: '1:1', label: '1 min run / 1 min walk', ratio: { runSeconds: 60, walkSeconds: 60 } },
  { id: '30s', label: '30 s run / 30 s walk', ratio: { runSeconds: 30, walkSeconds: 30 } },
];

export const MIN_SEGMENT_SECONDS = 15;
export const MAX_SEGMENT_SECONDS = 600;

// Galloway pairs ratios with pace: faster runners run longer between walks.
export function autoRunWalkRatio(paceSecondsPerKm: number): RunWalkRatio {
  if (paceSecondsPerKm <= 300) return RUN_WALK_PRESETS[0].ratio;
  if (paceSecondsPerKm <= 345) return RUN_WALK_PRESETS[1].ratio;
  if (paceSecondsPerKm <= 405) return RUN_WALK_PRESETS[2].ratio;
  if (paceSecondsPerKm <= 495) return RUN_WALK_PRESETS[3].ratio;
  return RUN_WALK_PRESETS[4].ratio;
}

// Form choices: a preset id or 'auto', and the distance's standard length or
// Galloway's extended build.
export type RunWalkChoice = 'auto' | string;
export type PlanLengthChoice = 'standard' | 'extended';

export function resolveRunWalkRatio(choice: RunWalkChoice, currentPaceSecondsPerKm: number): RunWalkRatio {
  const preset = RUN_WALK_PRESETS.find((candidate) => candidate.id === choice);
  return preset ? preset.ratio : autoRunWalkRatio(currentPaceSecondsPerKm);
}

// The week count to generate, or undefined for the distance's standard length.
// An extended choice is ignored for distances that don't offer one.
export function resolvePlanWeeks(
  choice: PlanLengthChoice,
  method: TrainingMethod,
  distance: RaceDistance | null
): number | undefined {
  if (method !== 'runwalk' || choice !== 'extended' || !distance || !supportsExtendedPlan(distance)) return undefined;
  return EXTENDED_PLAN_WEEKS;
}

function segmentLabel(seconds: number): string {
  if (seconds % 60 === 0) return `${seconds / 60} min`;
  return `${seconds} s`;
}

export function ratioLabel(ratio: RunWalkRatio): string {
  return `run ${segmentLabel(ratio.runSeconds)} / walk ${segmentLabel(ratio.walkSeconds)}`;
}

export function ratioShortLabel(ratio: RunWalkRatio): string {
  return `${segmentLabel(ratio.runSeconds)} / ${segmentLabel(ratio.walkSeconds)}`;
}

export function isValidRatio(ratio: RunWalkRatio): boolean {
  return [ratio.runSeconds, ratio.walkSeconds].every(
    (seconds) => Number.isInteger(seconds) && seconds >= MIN_SEGMENT_SECONDS && seconds <= MAX_SEGMENT_SECONDS
  );
}

export function sameRatio(a: RunWalkRatio | undefined, b: RunWalkRatio | undefined): boolean {
  if (!a || !b) return !a && !b;
  return a.runSeconds === b.runSeconds && a.walkSeconds === b.walkSeconds;
}

export interface WeekendRun {
  km: number;
  isLong: boolean;
}

// Long runs every week while they are short, then every other week so the
// last one lands `tail` weeks before the race. Off weekends get a short run.
export function runWalkWeekendSchedule(
  totalWeeks: number,
  startKm: number,
  targetKm: number,
  growthKm: number,
  tail: number,
  alternateFromKm = 16
): WeekendRun[] {
  const lastLongWeek = Math.max(1, totalWeeks - tail);
  const goal = Math.max(targetKm, startKm);
  const schedule: WeekendRun[] = [];
  let current = startKm;
  for (let week = 1; week <= totalWeeks; week++) {
    if (week === totalWeeks) {
      schedule.push({ km: 0, isLong: false });
      continue;
    }
    if (week === 1) {
      schedule.push({ km: roundHalf(current), isLong: true });
      continue;
    }
    if (week > lastLongWeek) {
      const taperKm = [10, 6][week - lastLongWeek - 1] ?? 5;
      schedule.push({ km: roundHalf(Math.min(taperKm, current * 0.5)), isLong: false });
      continue;
    }
    const isLong = current < alternateFromKm || (lastLongWeek - week) % 2 === 0;
    if (isLong) {
      current = Math.min(goal, current + growthKm);
      schedule.push({ km: roundHalf(current), isLong: true });
    } else {
      schedule.push({ km: roundHalf(clamp(current * 0.4, 5, 10)), isLong: false });
    }
  }
  return schedule;
}

// An extended plan spreads the same build over more weeks: the smallest growth
// step (0.25 km increments, at least 1 km) that still reaches race distance by
// the last long run, so the runner isn't asked to repeat full-distance long
// runs. Falls back to the standard step when nothing smaller gets there.
export function fitLongRunGrowth(
  totalWeeks: number,
  startKm: number,
  targetKm: number,
  maxGrowthKm: number,
  tail: number
): number {
  const goal = roundHalf(targetKm);
  for (let growth = 1; growth < maxGrowthKm; growth += 0.25) {
    const peak = Math.max(...runWalkWeekendSchedule(totalWeeks, startKm, targetKm, growth, tail).map((run) => run.km));
    if (peak >= goal) return growth;
  }
  return maxGrowthKm;
}

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function paceToSeconds(pace: Pace): number {
  return Math.max(0, pace.minutes * 60 + pace.seconds);
}

function secondsToPace(totalSeconds: number): Pace {
  const normalized = Math.max(0, Math.round(totalSeconds));
  return { minutes: Math.floor(normalized / 60), seconds: normalized % 60 };
}

function formatPace(seconds: number, unit: DistanceUnit): string {
  const display = secondsToPace(unit === 'mi' ? seconds * KM_PER_MILE : seconds);
  return `${display.minutes}:${display.seconds.toString().padStart(2, '0')}/${unit}`;
}

function formatDistance(distanceKm: number, unit: DistanceUnit): string {
  const value = unit === 'mi' ? distanceKm / KM_PER_MILE : distanceKm;
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded} ${unit}` : `${rounded.toFixed(1)} ${unit}`;
}

// Galloway's Magic Mile multipliers: mile time x factor predicts race pace.
const MAGIC_MILE_FACTOR: Record<RaceDistance, number> = { '5k': 1.05, '10k': 1.15, half: 1.2, full: 1.3 };
const MILE_KM = 1.6;

type Phase = 'Base Building' | 'Build Phase' | 'Peak Training' | 'Taper';

// The taper starts right after the last long run, however long the plan is.
function phaseFor(weekNum: number, totalWeeks: number, lastLongWeek: number): Phase {
  if (weekNum > lastLongWeek) return 'Taper';
  const progress = weekNum / totalWeeks;
  if (progress < 0.25) return 'Base Building';
  if (progress < 0.5) return 'Build Phase';
  return 'Peak Training';
}

const KEEP_ORDER = ['Saturday', 'Tuesday', 'Thursday', 'Sunday', 'Wednesday', 'Friday'];
const RACE_WEEK_KEEP_ORDER = ['Sunday', 'Tuesday', 'Thursday', 'Saturday', 'Wednesday', 'Friday'];

export interface RunWalkPlanInputs {
  distance: RaceDistance;
  currentPace: Pace;
  targetPace: Pace;
  trainingDays: number;
  longestRecentRun: number;
  experienceLevel: ExperienceLevel;
  unit: DistanceUnit;
  ratio: RunWalkRatio;
  /** Defaults to the distance's standard length; longer plans grow the long run more gently. */
  totalWeeks?: number;
}

export function generateRunWalkWeeks(inputs: RunWalkPlanInputs): TrainingWeek[] {
  const { distance, trainingDays, experienceLevel, unit, ratio } = inputs;
  const info = DISTANCE_INFO[distance];
  const totalWeeks = inputs.totalWeeks ?? info.weeks;
  const targets = DISTANCE_TARGETS[distance];
  const standardGrowth = EXPERIENCE_CONFIG[experienceLevel].longRunGrowthPerWeek + 0.5;
  const startKm = inputs.longestRecentRun > 0 ? inputs.longestRecentRun : targets.startMileage * 0.3;
  const tail = distance === 'full' ? 3 : 2;
  const lastLongWeek = totalWeeks - tail;
  const growth = totalWeeks > info.weeks
    ? fitLongRunGrowth(totalWeeks, startKm, targets.runWalkLongRun, standardGrowth, tail)
    : standardGrowth;
  const weekend = runWalkWeekendSchedule(totalWeeks, startKm, targets.runWalkLongRun, growth, tail);
  const currentSeconds = paceToSeconds(inputs.currentPace);
  const targetSeconds = paceToSeconds(inputs.targetPace);
  const breaks = ratioLabel(ratio);

  return weekend.map((weekendRun, index) => {
    const weekNum = index + 1;
    const isRaceWeek = weekNum === totalWeeks;
    const progress = weekNum / totalWeeks;
    const weekRace = currentSeconds - (currentSeconds - targetSeconds) * progress;
    const longPace = formatPace(weekRace + 75, unit);
    const weekdayPace = formatPace(weekRace + 45, unit);
    const recoveryPace = formatPace(weekRace + 90, unit);
    const magicMilePace = formatPace(weekRace / MAGIC_MILE_FACTOR[distance], unit);
    const ramp = clamp((weekNum - 1) / Math.max(1, lastLongWeek - 1), 0, 1);
    const weekdayMinutes = weekNum > lastLongWeek ? 30 : Math.round(30 + 15 * ramp);
    const shortKm = round1((30 * 60) / (weekRace + 90));
    const isMagicMileWeek = weekNum % 3 === 0 && weekNum <= lastLongWeek;

    const runWalkDay = (day: string, workout: string, minutes: number, extra: string): TrainingDay => {
      const km = round1((minutes * 60) / (weekRace + 45));
      return {
        day,
        workout,
        description: `${minutes} min of ${breaks} at a conversational effort. ${extra}`,
        pace: weekdayPace,
        distance: `${formatDistance(km, unit)} (~${minutes} min)`,
        distanceKm: km,
        dayType: 'easy',
      };
    };

    const tuesday: TrainingDay = isMagicMileWeek
      ? {
          day: 'Tuesday',
          workout: 'Magic Mile',
          description: `Warm up ${formatDistance(MILE_KM, unit)} with ${breaks}, then run ${formatDistance(MILE_KM, unit)} (one mile) at a strong, even effort, and cool down ${formatDistance(MILE_KM, unit)} easy. Multiply your mile time by ${MAGIC_MILE_FACTOR[distance]} to predict your ${info.name} pace.`,
          pace: magicMilePace,
          distance: `${formatDistance(MILE_KM * 3, unit)} total`,
          distanceKm: round1(MILE_KM * 3),
          qualityKm: MILE_KM,
          dayType: 'quality',
        }
      : runWalkDay('Tuesday', 'Run-Walk + Cadence Drills', isRaceWeek ? 30 : weekdayMinutes, 'Add 4 x 30 s cadence drills: count your steps and shorten your stride slightly to quicken your turnover.');

    const days: TrainingDay[] = [
      {
        day: 'Monday',
        workout: 'Rest or Walk',
        description: 'Complete rest or an easy 30 min walk',
        dayType: 'rest',
      },
      tuesday,
      runWalkDay('Wednesday', 'Easy Run-Walk', 30, 'Keep this one relaxed; it is about consistency, not fitness.'),
      runWalkDay('Thursday', 'Run-Walk + Acceleration-Gliders', isRaceWeek ? 20 : weekdayMinutes, 'Add 4 x 30 s acceleration-gliders: ease up to a quick but smooth stride for 15 steps, then glide back down.'),
      runWalkDay('Friday', 'Easy Run-Walk', 25, 'Optional short session or a walk.'),
      weekendRun.isLong
        ? {
            day: 'Saturday',
            workout: 'Long Run-Walk',
            description: `${formatDistance(weekendRun.km, unit)} of ${breaks} at ${longPace} or slower. There is no such thing as too slow on a long run; take every walk break from the first minute.`,
            pace: longPace,
            distance: formatDistance(weekendRun.km, unit),
            distanceKm: weekendRun.km,
            dayType: 'long',
          }
        : {
            day: 'Saturday',
            workout: 'Short Weekend Run-Walk',
            description: `${formatDistance(weekendRun.km, unit)} of ${breaks} at ${longPace}. A short weekend lets you absorb the last long run before the next one.`,
            pace: longPace,
            distance: formatDistance(weekendRun.km, unit),
            distanceKm: weekendRun.km,
            dayType: 'long',
          },
      {
        day: 'Sunday',
        workout: 'Recovery Run-Walk',
        description: `30 min of ${breaks} at a very easy ${recoveryPace}, or a brisk walk.`,
        pace: recoveryPace,
        distance: `${formatDistance(shortKm, unit)} (~30 min)`,
        distanceKm: shortKm,
        dayType: 'recovery',
      },
    ];

    if (isRaceWeek) {
      days[5] = {
        day: 'Saturday',
        workout: 'Pre-Race Shakeout',
        description: `10-15 min of ${breaks} with a few gentle accelerations, then rest up.`,
        pace: weekdayPace,
        distance: formatDistance(2, unit),
        distanceKm: 2,
        dayType: 'easy',
      };
      days[6] = {
        day: 'Sunday',
        workout: `RACE DAY - ${info.name}`,
        description: `Run-walk from the first minute at ${breaks}, and keep the walk breaks even while you feel strong; they are what carry you through the last third. Target pace: ${formatPace(targetSeconds, unit)}.`,
        pace: formatPace(targetSeconds, unit),
        distance: formatDistance(info.km, unit),
        distanceKm: info.km,
        qualityKm: info.km,
        dayType: 'quality',
      };
    }

    const keepOrder = isRaceWeek ? RACE_WEEK_KEEP_ORDER : KEEP_ORDER;
    const retained = new Set(keepOrder.slice(0, trainingDays));
    for (const day of days) {
      if (day.dayType === 'rest' || retained.has(day.day)) continue;
      day.workout = 'Rest';
      day.description = 'Rest day - adjusted to match your selected weekly frequency';
      day.pace = undefined;
      day.distance = undefined;
      day.distanceKm = undefined;
      day.qualityKm = undefined;
      day.dayType = 'rest';
    }

    const totalKm = days.reduce((sum, day) => (day.dayType && day.dayType !== 'rest' ? sum + (day.distanceKm ?? 0) : sum), 0);
    return {
      week: weekNum,
      phase: phaseFor(weekNum, totalWeeks, lastLongWeek),
      days,
      totalMileage: formatDistance(totalKm, unit),
    };
  });
}
