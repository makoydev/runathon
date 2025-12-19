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
        ? `4x400m at ${getIntervalPace(currentWeekPace)} with 90s recovery`
        : `${Math.min(6 + Math.floor(progress * 4), 10)}x400m at ${getIntervalPace(currentWeekPace)} with 90s recovery`,
      pace: getIntervalPace(currentWeekPace),
      distance: phase === 'Taper' ? '4-5 km' : '6-8 km',
    },
    {
      day: 'Wednesday',
      workout: 'Easy Run',
      description: `Conversational pace run at ${getEasyPace(currentWeekPace)}`,
      pace: getEasyPace(currentWeekPace),
      distance: `${Math.round(weeklyMileage * 0.15)} km`,
    },
    {
      day: 'Thursday',
      workout: 'Tempo Run',
      description: `Sustained effort at ${getTempoPace(currentWeekPace)} for ${Math.round(weeklyMileage * 0.12)} km`,
      pace: getTempoPace(currentWeekPace),
      distance: `${Math.round(weeklyMileage * 0.2)} km total`,
    },
    {
      day: 'Friday',
      workout: 'Rest or Easy Run',
      description: 'Optional short recovery run or complete rest',
      pace: getEasyPace(currentWeekPace),
      distance: '3-4 km (optional)',
    },
    {
      day: 'Saturday',
      workout: 'Long Run',
      description: `Build endurance at ${getEasyPace(currentWeekPace)}`,
      pace: getEasyPace(currentWeekPace),
      distance: `${Math.round(weeklyMileage * 0.35)} km`,
    },
    {
      day: 'Sunday',
      workout: 'Recovery Run',
      description: `Very easy pace at ${formatPace(secondsToPace(currentWeekSeconds + 75))}`,
      pace: formatPace(secondsToPace(currentWeekSeconds + 75)),
      distance: `${Math.round(weeklyMileage * 0.15)} km`,
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

  return {
    distance,
    currentPace: normalizedCurrentPace,
    targetPace: normalizedTargetPace,
    weeks,
    summary: `This ${info.weeks}-week plan will guide you from ${formatPace(normalizedCurrentPace)} to ${formatPace(normalizedTargetPace)} per kilometer. ${improvementText}`,
  };
}
