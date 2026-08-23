export type RaceDistance = '5k' | '10k' | 'half' | 'full';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

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
  distanceKm?: number;
}

export interface TrainingWeek {
  week: number;
  phase: string;
  isCutback?: boolean;
  days: TrainingDay[];
  totalMileage: string;
}

export interface TrainingPlan {
  distance: RaceDistance;
  currentPace: Pace;
  targetPace: Pace;
  currentWeeklyMileage?: number;
  longestRecentRun?: number;
  experienceLevel?: ExperienceLevel;
  trainingDays: number;
  weeks: TrainingWeek[];
  summary: string;
}

export const EXPERIENCE_INFO: Record<ExperienceLevel, { name: string; description: string }> = {
  beginner: { name: 'Beginner', description: 'New to structured training or returning after a long break' },
  intermediate: { name: 'Intermediate', description: 'Runs regularly and has finished a race or two' },
  advanced: { name: 'Advanced', description: 'High weekly mileage and comfortable with speed work' },
};

export const DISTANCE_INFO: Record<RaceDistance, { name: string; km: number; miles: number; weeks: number }> = {
  '5k': { name: '5K', km: 5, miles: 3.1, weeks: 8 },
  '10k': { name: '10K', km: 10, miles: 6.2, weeks: 10 },
  'half': { name: 'Half Marathon', km: 21.1, miles: 13.1, weeks: 12 },
  'full': { name: 'Marathon', km: 42.2, miles: 26.2, weeks: 16 },
};
