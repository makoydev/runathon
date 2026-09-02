export type RaceDistance = '5k' | '10k' | 'half' | 'full';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type DistanceUnit = 'km' | 'mi';

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
  // Portion of distanceKm run at intensity (threshold segment, interval reps, the race).
  qualityKm?: number;
}

export interface TrainingWeek {
  week: number;
  phase: string;
  isCutback?: boolean;
  days: TrainingDay[];
  totalMileage: string;
  /** Set when weekly check-in feedback reduced this week's volume; explains why. */
  adjustmentNote?: string;
}

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

// Schedule constraints the runner sets before generating: where the long run
// lands and which weekdays must stay workout-free.
export interface PlanAssumptions {
  longRunDay: string;
  unavailableDays: string[];
}

export interface TrainingPlan {
  distance: RaceDistance;
  currentPace: Pace;
  targetPace: Pace;
  currentWeeklyMileage?: number;
  longestRecentRun?: number;
  experienceLevel?: ExperienceLevel;
  unit?: DistanceUnit;
  trainingDays: number;
  /** Set when the plan was generated with non-default schedule constraints. */
  assumptions?: PlanAssumptions;
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
