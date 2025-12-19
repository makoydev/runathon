export type RaceDistance = '5k' | '10k' | 'half' | 'full';

export interface Pace {
  minutes: number;
  seconds: number;
}

export interface TrainingDay {
  day: string;
  workout: string;
  description: string;
  dayType?: 'rest' | 'easy' | 'quality' | 'long' | 'recovery';
  pace?: string;
  distance?: string;
}

export interface TrainingWeek {
  week: number;
  phase: string;
  days: TrainingDay[];
  totalMileage: string;
}

export interface TrainingPlan {
  distance: RaceDistance;
  currentPace: Pace;
  targetPace: Pace;
  trainingDays: number;
  weeks: TrainingWeek[];
  summary: string;
}

export const DISTANCE_INFO: Record<RaceDistance, { name: string; km: number; miles: number; weeks: number }> = {
  '5k': { name: '5K', km: 5, miles: 3.1, weeks: 8 },
  '10k': { name: '10K', km: 10, miles: 6.2, weeks: 10 },
  'half': { name: 'Half Marathon', km: 21.1, miles: 13.1, weeks: 12 },
  'full': { name: 'Marathon', km: 42.2, miles: 26.2, weeks: 16 },
};
