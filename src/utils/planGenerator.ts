import type { RaceDistance, Pace, TrainingPlan, TrainingWeek, TrainingDay } from '../types';
import { DISTANCE_INFO } from '../types';

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

function formatPace(pace: Pace): string {
  const normalized = secondsToPace(paceToSeconds(pace));
  return `${normalized.minutes}:${normalized.seconds.toString().padStart(2, '0')}/km`;
}

function getEasyPace(pace: Pace): string {
  const seconds = paceToSeconds(pace) + 60; // Easy pace is ~60 sec slower
  return formatPace(secondsToPace(seconds));
}

function getTempoPace(pace: Pace): string {
  const seconds = paceToSeconds(pace) + 15; // Tempo is ~15 sec slower than race pace
  return formatPace(secondsToPace(seconds));
}

function getIntervalPace(pace: Pace): string {
  const seconds = paceToSeconds(pace) - 15; // Intervals are ~15 sec faster than race pace
  return formatPace(secondsToPace(seconds));
}

function generateWeeklyPlan(
  weekNum: number,
  totalWeeks: number,
  distance: RaceDistance,
  currentPace: Pace,
  targetPace: Pace
): TrainingWeek {
  const info = DISTANCE_INFO[distance];
  const currentSeconds = paceToSeconds(currentPace);
  const targetSeconds = paceToSeconds(targetPace);
  const progress = weekNum / totalWeeks;
  const interpolatedSeconds = currentSeconds - (currentSeconds - targetSeconds) * progress;
  const currentWeekPace = secondsToPace(interpolatedSeconds);
  const currentWeekSeconds = paceToSeconds(currentWeekPace);

  // Determine training phase
  let phase: string;
  if (progress < 0.25) {
    phase = 'Base Building';
  } else if (progress < 0.5) {
    phase = 'Build Phase';
  } else if (progress < 0.85) {
    phase = 'Peak Training';
  } else {
    phase = 'Taper';
  }

  // Base mileage calculation based on race distance and week
  const baseMileage = {
    '5k': 15 + progress * 10,
    '10k': 20 + progress * 15,
    'half': 25 + progress * 20,
    'full': 30 + progress * 30,
  };

  // Reduce mileage during taper
  const taperMultiplier = phase === 'Taper' ? 0.6 : 1;
  const weeklyMileage = Math.round(baseMileage[distance] * taperMultiplier);

  // Keep roughly 80/20 easy vs. quality (tempo/interval) distribution
  const qualityFraction = phase === 'Taper' ? 0.12 : 0.2;
  const targetQuality = weeklyMileage * qualityFraction;
  let intervalDistance = Math.max(3, Math.round(targetQuality * 0.4));
  let tempoDistance = Math.max(3, Math.round(targetQuality * 0.6));
  const qualityCap = Math.round(weeklyMileage * (phase === 'Taper' ? 0.15 : 0.22));
  const qualityTotal = intervalDistance + tempoDistance;
  if (qualityTotal > qualityCap) {
    const scale = qualityCap / qualityTotal;
    intervalDistance = Math.max(2, Math.round(intervalDistance * scale));
    tempoDistance = Math.max(3, Math.round(tempoDistance * scale));
  }

  const easyMileage = Math.max(0, weeklyMileage - intervalDistance - tempoDistance);
  const longRunDistance = Math.min(Math.max(6, Math.round(easyMileage * 0.45)), easyMileage);
  let remainingEasy = Math.max(0, easyMileage - longRunDistance);
  const wednesdayDistance = remainingEasy > 0
    ? Math.min(Math.max(3, Math.round(easyMileage * 0.2)), remainingEasy)
    : 0;
  remainingEasy = Math.max(0, remainingEasy - wednesdayDistance);
  const sundayDistance = remainingEasy > 0
    ? Math.min(Math.max(3, Math.round(easyMileage * 0.2)), remainingEasy)
    : 0;
  remainingEasy = Math.max(0, remainingEasy - sundayDistance);
  const fridayOptional = Math.max(0, Math.round(remainingEasy));

  const days: TrainingDay[] = [
    {
      day: 'Monday',
      workout: 'Rest or Cross-Training',
      description: 'Active recovery - light yoga, swimming, or complete rest',
    },
    {
      day: 'Tuesday',
      workout: 'Interval Training',
      description: phase === 'Taper'
        ? `4x400m at ${getIntervalPace(currentWeekPace)} with 90s recovery (single quality session this week)`
        : `${Math.min(6 + Math.floor(progress * 4), 10)}x400m at ${getIntervalPace(currentWeekPace)} with 90s recovery (quality capped to ~20% of mileage)`,
      pace: getIntervalPace(currentWeekPace),
      distance: `${intervalDistance} km`,
    },
    {
      day: 'Wednesday',
      workout: 'Zone 2 Easy Run',
      description: `Conversational pace run at ${getEasyPace(currentWeekPace)} (part of the 80% easy volume)`,
      pace: getEasyPace(currentWeekPace),
      distance: wednesdayDistance > 0 ? `${wednesdayDistance} km` : 'Optional rest',
    },
    {
      day: 'Thursday',
      workout: 'Tempo / Threshold Run',
      description: `Sustained effort at ${getTempoPace(currentWeekPace)} (kept within weekly quality budget)`,
      pace: getTempoPace(currentWeekPace),
      distance: `${tempoDistance} km total`,
    },
    {
      day: 'Friday',
      workout: 'Rest or Easy Run',
      description: 'Optional short Zone 1-2 recovery shuffle or complete rest',
      pace: getEasyPace(currentWeekPace),
      distance: fridayOptional > 0 ? `${fridayOptional} km (optional)` : 'Rest',
    },
    {
      day: 'Saturday',
      workout: 'Long Zone 2 Run',
      description: `Build endurance at ${getEasyPace(currentWeekPace)} (core of the easy mileage)`,
      pace: getEasyPace(currentWeekPace),
      distance: `${longRunDistance} km`,
    },
    {
      day: 'Sunday',
      workout: 'Recovery Run',
      description: `Very easy pace at ${formatPace(secondsToPace(currentWeekSeconds + 75))}`,
      pace: formatPace(secondsToPace(currentWeekSeconds + 75)),
      distance: sundayDistance > 0 ? `${sundayDistance} km` : 'Rest',
    },
  ];

  // Adjust final week for race day
  if (weekNum === totalWeeks) {
    days[5] = {
      day: 'Saturday',
      workout: 'Pre-Race Shakeout',
      description: 'Short, easy 2-3km jog with a few strides',
      pace: getEasyPace(targetPace),
      distance: '2-3 km',
    };
    days[6] = {
      day: 'Sunday',
      workout: `RACE DAY - ${info.name}`,
      description: `Target pace: ${formatPace(targetPace)} - Go get your PR!`,
      pace: formatPace(targetPace),
      distance: `${info.km} km`,
    };
  }

  return {
    week: weekNum,
    phase,
    days,
    totalMileage: `${weeklyMileage} km`,
  };
}

export function generateTrainingPlan(
  distance: RaceDistance,
  currentPace: Pace,
  targetPace: Pace
): TrainingPlan {
  const info = DISTANCE_INFO[distance];
  const normalizedCurrentPace = secondsToPace(paceToSeconds(currentPace));
  const normalizedTargetPace = secondsToPace(paceToSeconds(targetPace));
  const weeks: TrainingWeek[] = [];

  for (let i = 1; i <= info.weeks; i++) {
    weeks.push(generateWeeklyPlan(i, info.weeks, distance, normalizedCurrentPace, normalizedTargetPace));
  }

  const paceImprovement = paceToSeconds(normalizedCurrentPace) - paceToSeconds(normalizedTargetPace);
  const timeImprovement = Math.round((paceImprovement * info.km) / 60);
  const improvementText = timeImprovement > 0
    ? `That's a potential improvement of ~${timeImprovement} minutes on your ${info.name} time!`
    : timeImprovement < 0
      ? `That would add roughly ${Math.abs(timeImprovement)} minutes to your ${info.name} time - double-check that goal if it's unintended.`
      : `This keeps you steady at your current ${info.name} pace.`;
  const distributionNote = 'Plan targets ~80% easy/Zone 2 mileage with a controlled quality block (tempo + intervals) each week.';

  return {
    distance,
    currentPace: normalizedCurrentPace,
    targetPace: normalizedTargetPace,
    weeks,
    summary: `This ${info.weeks}-week plan will guide you from ${formatPace(normalizedCurrentPace)} to ${formatPace(normalizedTargetPace)} per kilometer. ${improvementText} ${distributionNote}`,
  };
}
