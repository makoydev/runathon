import { describe, it, expect } from 'vitest'
import {
  applyPlanAssumptions,
  isDefaultAssumptions,
  maxTrainingDays,
  DEFAULT_ASSUMPTIONS,
} from './planAssumptions'
import { generateTrainingPlan } from './planGenerator'
import type { TrainingWeek } from '../types'

const makePlan = () =>
  generateTrainingPlan('10k', { minutes: 6, seconds: 0 }, { minutes: 5, seconds: 30 }, 5, 30, 10)

function weekMileage(week: TrainingWeek): number {
  return week.days.reduce(
    (total, day) => (day.dayType && day.dayType !== 'rest' ? total + (day.distanceKm ?? 0) : total),
    0
  )
}

describe('applyPlanAssumptions', () => {
  it('returns the plan unchanged for default assumptions', () => {
    const plan = makePlan()
    expect(applyPlanAssumptions(plan, DEFAULT_ASSUMPTIONS)).toBe(plan)
    expect(isDefaultAssumptions(DEFAULT_ASSUMPTIONS)).toBe(true)
  })

  it('moves the long run to the preferred day in every week that has one', () => {
    const plan = makePlan()
    const adjusted = applyPlanAssumptions(plan, { longRunDay: 'Wednesday', unavailableDays: [] })

    adjusted.weeks.forEach((week) => {
      const longDay = week.days.find((day) => day.dayType === 'long')
      if (longDay) expect(longDay.day).toBe('Wednesday')
    })
    // The original plan is not mutated.
    expect(plan.weeks[0].days.find((day) => day.dayType === 'long')?.day).toBe('Saturday')
  })

  it('turns unavailable days into rest and keeps their workouts elsewhere', () => {
    const plan = makePlan()
    const adjusted = applyPlanAssumptions(plan, {
      longRunDay: 'Saturday',
      unavailableDays: ['Tuesday'],
    })

    adjusted.weeks.forEach((week, weekIndex) => {
      const tuesday = week.days.find((day) => day.day === 'Tuesday')
      expect(tuesday?.dayType ?? 'rest').toBe('rest')
      expect(weekMileage(week)).toBeCloseTo(weekMileage(plan.weeks[weekIndex]), 5)
    })
  })

  it('preserves weekday ordering and day names', () => {
    const plan = makePlan()
    const adjusted = applyPlanAssumptions(plan, {
      longRunDay: 'Sunday',
      unavailableDays: ['Wednesday'],
    })

    adjusted.weeks.forEach((week, weekIndex) => {
      expect(week.days.map((day) => day.day)).toEqual(plan.weeks[weekIndex].days.map((day) => day.day))
    })
  })

  it('never moves the race even when its day is unavailable', () => {
    const plan = makePlan()
    const adjusted = applyPlanAssumptions(plan, {
      longRunDay: 'Sunday',
      unavailableDays: ['Sunday'],
    })

    const raceWeek = adjusted.weeks[adjusted.weeks.length - 1]
    const sunday = raceWeek.days.find((day) => day.day === 'Sunday')
    expect(sunday?.workout).toContain('RACE DAY')
  })

  it('ignores a preferred long-run day that is unavailable', () => {
    const plan = makePlan()
    const adjusted = applyPlanAssumptions(plan, {
      longRunDay: 'Wednesday',
      unavailableDays: ['Wednesday'],
    })

    const longDay = adjusted.weeks[0].days.find((day) => day.dayType === 'long')
    expect(longDay?.day).toBe('Saturday')
  })

  it('stamps the applied assumptions onto the plan', () => {
    const assumptions = { longRunDay: 'Friday', unavailableDays: ['Monday'] }
    expect(applyPlanAssumptions(makePlan(), assumptions).assumptions).toEqual(assumptions)
  })
})

describe('maxTrainingDays', () => {
  it('is seven minus the unavailable count', () => {
    expect(maxTrainingDays(DEFAULT_ASSUMPTIONS)).toBe(7)
    expect(maxTrainingDays({ longRunDay: 'Saturday', unavailableDays: ['Monday', 'Friday'] })).toBe(5)
  })
})
