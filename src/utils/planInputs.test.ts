import { describe, expect, it } from 'vitest';
import { validatePlanInputs, issueFor, DISTANCE_PROMPT } from './planInputs';
import type { PlanInputs } from './planInputs';
import { DEFAULT_ASSUMPTIONS } from './planAssumptions';

const valid: PlanInputs = {
  distance: 'half',
  currentPace: { minutes: 6, seconds: 0 },
  targetPace: { minutes: 5, seconds: 30 },
  currentWeeklyMileage: 25,
  longestRecentRun: 8,
  trainingDays: 5,
  assumptions: DEFAULT_ASSUMPTIONS,
};

describe('validatePlanInputs', () => {
  it('accepts a complete form without blockers or warnings', () => {
    expect(validatePlanInputs(valid)).toEqual({ blockers: [], warnings: [] });
  });

  it('lists every missing input in form order', () => {
    const check = validatePlanInputs({
      ...valid,
      distance: null,
      currentPace: { minutes: 0, seconds: 0 },
      targetPace: { minutes: 0, seconds: 0 },
      currentWeeklyMileage: 0,
      longestRecentRun: 0,
    });

    expect(check.blockers.map((issue) => issue.field)).toEqual([
      'distance',
      'currentPace',
      'targetPace',
      'weeklyMileage',
      'longestRun',
    ]);
    expect(check.blockers[0].message).toBe(DISTANCE_PROMPT);
    // Zero paces can't be compared, so no maintenance warning either.
    expect(check.warnings).toEqual([]);
  });

  it('treats a pace with only seconds as entered', () => {
    const check = validatePlanInputs({ ...valid, currentPace: { minutes: 0, seconds: 45 } });
    expect(issueFor(check.blockers, 'currentPace')).toBeUndefined();
  });

  it('blocks a longest run above the weekly mileage', () => {
    const check = validatePlanInputs({ ...valid, currentWeeklyMileage: 10, longestRecentRun: 15 });
    expect(issueFor(check.blockers, 'longestRun')).toMatch(/cannot be greater/);
    expect(issueFor(check.blockers, 'weeklyMileage')).toBeUndefined();
  });

  it('blocks a schedule with more training days than available weekdays', () => {
    const check = validatePlanInputs({
      ...valid,
      assumptions: { ...DEFAULT_ASSUMPTIONS, unavailableDays: ['Monday', 'Tuesday', 'Wednesday'] },
    });
    expect(issueFor(check.blockers, 'schedule')).toMatch(/Only 4 days are available, but the plan needs 5/);
  });

  it('warns without blocking when the target pace is not faster', () => {
    const check = validatePlanInputs({ ...valid, targetPace: { minutes: 6, seconds: 0 } });
    expect(check.blockers).toEqual([]);
    expect(issueFor(check.warnings, 'targetPace')).toMatch(/not faster/);
  });
});
