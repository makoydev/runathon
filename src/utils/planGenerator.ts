import type { RaceDistance, Pace, TrainingPlan, TrainingWeek, TrainingDay, ExperienceLevel, DistanceUnit } from '../types';
import { DISTANCE_INFO, EXPERIENCE_INFO } from '../types';
import { KM_PER_MILE } from './units';
import { DISTANCE_TARGETS, EXPERIENCE_CONFIG, peakWeeklyMileage, peakLongRun } from './trainingTargets';
import { deriveTrainingPaces } from './trainingPaces';

function paceToSeconds(pace: Pace): number {
  return Math.max(0, pace.minutes * 60 + pace.seconds);
}

function secondsToPace(totalSeconds: number): Pace {
  const normalizedSeconds = Math.max(0, Math.round(totalSeconds));
  return {
    minutes: Math.floor(normalizedSeconds / 60),
    seconds: normalizedSeconds % 60,
  };
}

// All internal math is in km and sec/km; `unit` only affects the display strings.
function formatPace(pace: Pace, unit: DistanceUnit = 'km'): string {
  const displaySeconds = unit === 'mi' ? paceToSeconds(pace) * KM_PER_MILE : paceToSeconds(pace);
  const normalized = secondsToPace(displaySeconds);
  return `${normalized.minutes}:${normalized.seconds.toString().padStart(2, '0')}/${unit}`;
}

function formatDistance(distanceKm: number, unit: DistanceUnit = 'km'): string {
  const value = unit === 'mi' ? distanceKm / KM_PER_MILE : distanceKm;
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded} ${unit}` : `${rounded.toFixed(1)} ${unit}`;
}

function scheduledMileage(days: TrainingDay[]): number {
  return days.reduce((total, day) => {
    if (day.dayType === 'rest') return total;
    return total + (day.distanceKm ?? 0);
  }, 0);
}

function normalizeDistance(distance: number): number {
  if (!Number.isFinite(distance)) return 0;
  return Math.max(0, Math.round(distance * 10) / 10);
}

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type Phase = 'Base Building' | 'Build Phase' | 'Peak Training' | 'Taper';

function phaseFor(weekNum: number, totalWeeks: number): Phase {
  const progress = weekNum / totalWeeks;
  if (progress < 0.25) return 'Base Building';
  if (progress < 0.5) return 'Build Phase';
  if (progress < 0.85) return 'Peak Training';
  return 'Taper';
}

// The last hard week: volume and the long run peak here, then the taper cuts back.
function peakWeekFor(totalWeeks: number): number {
  let peakWeek = 1;
  for (let week = 1; week <= totalWeeks; week++) {
    if (phaseFor(week, totalWeeks) !== 'Taper') peakWeek = week;
  }
  return peakWeek;
}

// Fraction of peak volume kept in each taper week, keyed by weeks until race week.
const TAPER_VOLUME: Record<number, number> = { 2: 0.8, 1: 0.6, 0: 0.3 };
const TAPER_LONG_RUN: Record<number, number> = { 2: 0.7, 1: 0.5, 0: 0 };
const CUTBACK_FACTOR = 0.75;

// Which run days survive when the runner has fewer available days. Key sessions
// (long run, tempo) are kept first; optional easy days go first.
const KEEP_ORDER = ['Saturday', 'Thursday', 'Wednesday', 'Tuesday', 'Sunday', 'Friday'];
const RACE_WEEK_KEEP_ORDER = ['Sunday', 'Thursday', 'Saturday', 'Tuesday', 'Friday', 'Wednesday'];

interface WeekVolume {
  weeklyMileage: number;
  longRun: number;
  isCutback: boolean;
}

function weekVolume(
  weekNum: number,
  totalWeeks: number,
  distance: RaceDistance,
  experienceLevel: ExperienceLevel,
  currentWeeklyMileage: number,
  longestRecentRun: number
): WeekVolume {
  const targets = DISTANCE_TARGETS[distance];
  const experience = EXPERIENCE_CONFIG[experienceLevel];
  const phase = phaseFor(weekNum, totalWeeks);
  const peakWeek = peakWeekFor(totalWeeks);
  const ramp = peakWeek > 1 ? clamp((weekNum - 1) / (peakWeek - 1), 0, 1) : 1;
  const isCutback = weekNum % 4 === 0 && phase !== 'Taper' && weekNum !== totalWeeks;

  // Weekly volume: ramp from the runner's current load toward the distance peak,
  // never growing faster than the experience level's compounding rate allows.
  const startMileage = currentWeeklyMileage > 0 ? currentWeeklyMileage : targets.startMileage;
  const peakMileage = Math.max(peakWeeklyMileage(distance, experienceLevel), startMileage);
  const rampedMileage = startMileage + (peakMileage - startMileage) * ramp;
  const growthCap = currentWeeklyMileage > 0
    ? currentWeeklyMileage * Math.pow(experience.weeklyGrowthRate, weekNum)
    : Infinity;
  let weeklyMileage = Math.min(rampedMileage, growthCap);

  // Long run: ramp from the runner's longest recent run toward the distance peak,
  // limited by a per-week growth step, and never more than half the week.
  const startLongRun = longestRecentRun > 0 ? longestRecentRun : targets.startMileage * 0.4;
  const targetLongRun = Math.max(peakLongRun(distance, experienceLevel), startLongRun);
  const rampedLongRun = startLongRun + (targetLongRun - startLongRun) * ramp;
  const longRunGrowthCap = startLongRun + experience.longRunGrowthPerWeek * (weekNum - 1);
  let longRun = Math.min(rampedLongRun, longRunGrowthCap);

  if (phase === 'Taper') {
    const weeksToRace = totalWeeks - weekNum;
    weeklyMileage = peakMileage * (TAPER_VOLUME[weeksToRace] ?? 0.6);
    const peakedLongRun = Math.min(targetLongRun, startLongRun + experience.longRunGrowthPerWeek * (peakWeek - 1));
    longRun = peakedLongRun * (TAPER_LONG_RUN[weeksToRace] ?? 0.5);
  } else if (isCutback) {
    weeklyMileage *= CUTBACK_FACTOR;
    longRun *= CUTBACK_FACTOR;
  }

  weeklyMileage = Math.max(Math.round(weeklyMileage), 10);
  longRun = clamp(Math.round(longRun), 0, Math.round(weeklyMileage * 0.5));
  return { weeklyMileage, longRun, isCutback };
}

interface QualitySession {
  warmup: number;
  segment: number;
  cooldown: number;
}

function sessionTotal(session: QualitySession): number {
  return session.warmup + session.segment + session.cooldown;
}

function generateWeeklyPlan(
  weekNum: number,
  totalWeeks: number,
  distance: RaceDistance,
  currentPace: Pace,
  targetPace: Pace,
  trainingDays: number,
  currentWeeklyMileage = 0,
  longestRecentRun = 0,
  experienceLevel: ExperienceLevel = 'intermediate',
  unit: DistanceUnit = 'km'
): TrainingWeek {
  const info = DISTANCE_INFO[distance];
  const targets = DISTANCE_TARGETS[distance];
  const experience = EXPERIENCE_CONFIG[experienceLevel];
  const phase = phaseFor(weekNum, totalWeeks);
  const isRaceWeek = weekNum === totalWeeks;
  const progress = weekNum / totalWeeks;

  // Race pace moves from the current pace toward the goal across the plan, and
  // every training pace is derived from that week's race pace.
  const currentSeconds = paceToSeconds(currentPace);
  const targetSeconds = paceToSeconds(targetPace);
  const weekRaceSeconds = currentSeconds - (currentSeconds - targetSeconds) * progress;
  const paces = deriveTrainingPaces(weekRaceSeconds, info.km);
  const fmtDistance = (km: number) => formatDistance(km, unit);
  const fmtPace = (pace: Pace) => formatPace(pace, unit);
  const easyPace = fmtPace(secondsToPace(paces.easy));
  const recoveryPace = fmtPace(secondsToPace(paces.recovery));
  const thresholdPace = fmtPace(secondsToPace(paces.threshold));
  const intervalPace = fmtPace(secondsToPace(paces.interval));

  const { weeklyMileage, longRun, isCutback } = weekVolume(
    weekNum, totalWeeks, distance, experienceLevel, currentWeeklyMileage, longestRecentRun
  );

  // Quality frequency: one session while building base or tapering, two in the
  // build and peak phases, limited by experience, availability, and cutbacks.
  const plannedQualitySessions = phase === 'Build Phase' || phase === 'Peak Training' ? 2 : 1;
  const availabilityQualitySessions = trainingDays >= 4 ? 2 : 1;
  const qualitySessions = Math.min(
    plannedQualitySessions,
    availabilityQualitySessions,
    experience.maxQualitySessions,
    isCutback || isRaceWeek ? 1 : 2
  );

  // Threshold work is sized as a share of the week, capped per race distance.
  const thresholdFraction = phase === 'Base Building' ? 0.08 : phase === 'Build Phase' ? 0.1 : phase === 'Peak Training' ? 0.12 : 0.06;
  const easyBookend = weeklyMileage >= 30 ? 2 : 1.5;
  const tempo: QualitySession = {
    warmup: easyBookend,
    segment: isRaceWeek ? 2 : clamp(roundHalf(weeklyMileage * thresholdFraction), 3, targets.maxThresholdKm),
    cooldown: easyBookend,
  };
  const repTotal = clamp(roundHalf(weeklyMileage * 0.06), 2.4, 5);
  const minReps = targets.repKm < 0.5 ? 6 : 4;
  const maxReps = targets.repKm < 0.5 ? 12 : 8;
  const reps = qualitySessions >= 2 ? clamp(Math.round(repTotal / targets.repKm), minReps, maxReps) : 0;
  const intervals: QualitySession = {
    warmup: easyBookend,
    segment: roundHalf(reps * targets.repKm),
    cooldown: easyBookend,
  };

  const qualityTotal = sessionTotal(tempo) + (qualitySessions >= 2 ? sessionTotal(intervals) : 0);
  const raceWeekLongRun = 3;
  const keyMileage = qualityTotal + (isRaceWeek ? raceWeekLongRun : longRun);
  const easyBudget = Math.max(0, weeklyMileage - keyMileage);

  // Decide which days survive the runner's availability before spreading the
  // easy mileage, so fewer days still adds up to the planned week.
  const keepOrder = isRaceWeek ? RACE_WEEK_KEEP_ORDER : KEEP_ORDER;
  const retained = new Set(keepOrder.slice(0, trainingDays));
  const tuesdayIsEasy = qualitySessions < 2;
  const candidateEasyDays: Array<[string, number]> = [
    ['Wednesday', 1],
    ['Tuesday', tuesdayIsEasy ? 0.8 : 0],
    ['Sunday', isRaceWeek ? 0 : 0.8],
    ['Friday', 0.6],
  ];
  const easyWeights = candidateEasyDays.filter(([day, weight]) => weight > 0 && retained.has(day));
  // Hand out the easy budget in weight order. Any day getting under 3 km is
  // rounded up to 3 km (or dropped when the budget is spent) so small weeks
  // still produce runnable days instead of scattering 1-2 km scraps.
  const easyDayCap = Math.max(4, Math.round(longRun * 0.6));
  const easyKm: Record<string, number> = {};
  let remainingBudget = Math.round(easyBudget);
  let remainingWeight = easyWeights.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [day, weight] of [...easyWeights].sort((a, b) => b[1] - a[1])) {
    let share = remainingWeight > 0 ? Math.round((remainingBudget * weight) / remainingWeight) : 0;
    if (share < 3) share = remainingBudget >= 3 ? 3 : 0;
    share = Math.min(share, easyDayCap, remainingBudget);
    easyKm[day] = share;
    remainingBudget -= share;
    remainingWeight -= weight;
  }
  // Fold any scraps back into the biggest easy day so volume is not lost.
  if (remainingBudget > 0 && easyWeights.length > 0) {
    const [mainDay] = [...easyWeights].sort((a, b) => b[1] - a[1])[0];
    easyKm[mainDay] = Math.min(easyDayCap, easyKm[mainDay] + remainingBudget);
  }

  const easyDay = (name: string, workout: string, description: string, pace: string, dayType: TrainingDay['dayType']): TrainingDay => {
    const km = easyKm[name] ?? 0;
    return km > 0
      ? { day: name, workout, description, pace, distance: fmtDistance(km), distanceKm: km, dayType }
      : { day: name, workout, description, distance: 'Rest', dayType: 'rest' };
  };

  const repLabel = targets.repKm < 1 ? `${Math.round(targets.repKm * 1000)}m` : `${targets.repKm}km`;
  const repRecovery = targets.repKm < 0.5 ? '90s jog' : targets.repKm < 1 ? '2 min jog' : '3 min jog';

  const days: TrainingDay[] = [
    {
      day: 'Monday',
      workout: 'Rest or Cross-Training',
      description: 'Active recovery - light yoga, swimming, or complete rest',
      dayType: 'rest',
    },
    qualitySessions >= 2
      ? {
          day: 'Tuesday',
          workout: 'Interval Training',
          description: `${fmtDistance(intervals.warmup)} easy warmup with a few strides, then ${reps}x${repLabel} at ${intervalPace} (5K effort) with ${repRecovery} recovery, ${fmtDistance(intervals.cooldown)} easy cooldown`,
          pace: intervalPace,
          distance: `${fmtDistance(sessionTotal(intervals))} total`,
          distanceKm: sessionTotal(intervals),
          qualityKm: intervals.segment,
          dayType: 'quality',
        }
      : easyDay(
          'Tuesday',
          'Strides + Drills',
          `${fmtDistance(easyKm.Tuesday ?? 0)} easy Zone 2 with 6-8x20s relaxed strides to build mechanics`,
          easyPace,
          'easy'
        ),
    easyDay('Wednesday', 'Zone 2 Easy Run', `Conversational pace run at ${easyPace} (part of the 80% easy volume)`, easyPace, 'easy'),
    {
      day: 'Thursday',
      workout: 'Tempo / Threshold Run',
      description: `${fmtDistance(tempo.warmup)} easy warmup, then ${fmtDistance(tempo.segment)} continuous at threshold (${thresholdPace}, comfortably hard), ${fmtDistance(tempo.cooldown)} easy cooldown`,
      pace: thresholdPace,
      distance: `${fmtDistance(sessionTotal(tempo))} total`,
      distanceKm: sessionTotal(tempo),
      qualityKm: tempo.segment,
      dayType: 'quality',
    },
    easyDay('Friday', 'Rest or Easy Run', 'Optional short Zone 1-2 recovery shuffle or complete rest', easyPace, 'easy'),
    {
      day: 'Saturday',
      workout: 'Long Zone 2 Run',
      description: `Build endurance at ${easyPace} (core of the easy mileage)`,
      pace: easyPace,
      distance: fmtDistance(longRun),
      distanceKm: longRun,
      dayType: 'long',
    },
    easyDay('Sunday', 'Recovery Run', `Very easy pace at ${recoveryPace}`, recoveryPace, 'recovery'),
  ];

  if (isRaceWeek) {
    days[5] = {
      day: 'Saturday',
      workout: 'Pre-Race Shakeout',
      description: 'Short, easy 2-3km jog with a few strides',
      pace: easyPace,
      distance: fmtDistance(raceWeekLongRun),
      distanceKm: raceWeekLongRun,
      dayType: 'easy',
    };
    days[6] = {
      day: 'Sunday',
      workout: `RACE DAY - ${info.name}`,
      description: `Warm up with 10 min easy jogging and a few strides. Target pace: ${fmtPace(targetPace)} - Go get your PR!`,
      pace: fmtPace(targetPace),
      distance: fmtDistance(info.km),
      distanceKm: info.km,
      qualityKm: info.km,
      dayType: 'quality',
    };
  }

  // Trim to the user's available training days while preserving key workouts.
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

  return {
    week: weekNum,
    phase,
    isCutback: isCutback || undefined,
    days,
    totalMileage: formatDistance(scheduledMileage(days), unit),
  };
}

export function generateTrainingPlan(
  distance: RaceDistance,
  currentPace: Pace,
  targetPace: Pace,
  trainingDays: number,
  currentWeeklyMileage = 0,
  longestRecentRun = 0,
  experienceLevel: ExperienceLevel = 'intermediate',
  unit: DistanceUnit = 'km'
): TrainingPlan {
  const info = DISTANCE_INFO[distance];
  const normalizedCurrentPace = secondsToPace(paceToSeconds(currentPace));
  const normalizedTargetPace = secondsToPace(paceToSeconds(targetPace));
  const normalizedWeeklyMileage = normalizeDistance(currentWeeklyMileage);
  const normalizedLongestRun = normalizeDistance(longestRecentRun);
  const weeks: TrainingWeek[] = [];

  for (let i = 1; i <= info.weeks; i++) {
    weeks.push(generateWeeklyPlan(
      i,
      info.weeks,
      distance,
      normalizedCurrentPace,
      normalizedTargetPace,
      trainingDays,
      normalizedWeeklyMileage,
      normalizedLongestRun,
      experienceLevel,
      unit
    ));
  }

  const paceImprovement = paceToSeconds(normalizedCurrentPace) - paceToSeconds(normalizedTargetPace);
  const timeImprovement = Math.round((paceImprovement * info.km) / 60);
  const improvementText = timeImprovement > 0
    ? `That's a potential improvement of ~${timeImprovement} minutes on your ${info.name} time!`
    : timeImprovement < 0
      ? `That would add roughly ${Math.abs(timeImprovement)} minutes to your ${info.name} time - double-check that goal if it's unintended.`
      : `This keeps you steady at your current ${info.name} pace.`;
  const hasIntervals = weeks.some((week) => week.days.some((day) => day.workout === 'Interval Training' && day.dayType !== 'rest'));
  const hasTempo = weeks.some((week) => week.days.some((day) => day.workout === 'Tempo / Threshold Run' && day.dayType !== 'rest'));
  const qualityWork = hasIntervals && hasTempo
    ? 'tempo and interval work'
    : hasTempo
      ? 'tempo work'
      : 'strides and easy aerobic work';
  const distributionNote = `Plan targets ~80% easy/Zone 2 mileage with controlled ${qualityWork} adjusted to your available training days.`;
  const peakLongRunKm = Math.max(...weeks.map((week) => week.days.find((day) => day.dayType === 'long')?.distanceKm ?? 0));
  const peakWeekKm = Math.max(...weeks.slice(0, -1).map((week) => scheduledMileage(week.days)));
  const peakNote = ` It builds to a ${formatDistance(peakLongRunKm, unit)} long run and ~${formatDistance(peakWeekKm, unit)}/week before the taper.`;
  const trainingLoadNote = normalizedWeeklyMileage > 0 && normalizedLongestRun > 0
    ? ` It starts from your current ${formatDistance(normalizedWeeklyMileage, unit)}/week load and ${formatDistance(normalizedLongestRun, unit)} longest recent run.`
    : '';
  const levelName = EXPERIENCE_INFO[experienceLevel].name.toLowerCase();
  const experienceNote = ` Volume and intensity are scaled for ${/^[aeiou]/.test(levelName) ? 'an' : 'a'} ${levelName} runner.`;

  return {
    distance,
    currentPace: normalizedCurrentPace,
    targetPace: normalizedTargetPace,
    currentWeeklyMileage: normalizedWeeklyMileage || undefined,
    longestRecentRun: normalizedLongestRun || undefined,
    experienceLevel,
    unit,
    trainingDays,
    weeks,
    summary: `This ${info.weeks}-week plan will guide you from ${formatPace(normalizedCurrentPace, unit)} to ${formatPace(normalizedTargetPace, unit)} ${unit === 'mi' ? 'per mile' : 'per kilometer'} on ${trainingDays} days/week. ${improvementText} ${distributionNote}${peakNote}${trainingLoadNote}${experienceNote}`,
  };
}
