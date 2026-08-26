import { describe, it, expect } from 'vitest'
import {
  isWeekFullyMarked,
  assessWeekAdjustment,
  nextFeedbackWeek,
  applyWeekAdjustments,
} from './weekAdjustment'
import { dayKey } from './progressStorage'
import type { PlanProgress } from './progressStorage'
import { generateTrainingPlan } from './planGenerator'
import type { TrainingWeek } from '../types'

const makePlan = () =>
  generateTrainingPlan('10k', { minutes: 6, seconds: 0 }, { minutes: 5, seconds: 30 }, 5, 30, 10)

function markWeek(week: TrainingWeek, status: 'completed' | 'skipped'): PlanProgress {
  const progress: PlanProgress = {}
  week.days.forEach((day, dayIndex) => {
    if (day.dayType && day.dayType !== 'rest') {
      progress[dayKey(week.week, dayIndex)] = status
    }
  })
  return progress
}

describe('isWeekFullyMarked', () => {
  it('requires every trackable day to have a status', () => {
    const plan = makePlan()
    const week1 = plan.weeks[0]
    const progress = markWeek(week1, 'completed')

    expect(isWeekFullyMarked(week1, progress)).toBe(true)

    const firstKey = Object.keys(progress)[0]
    const partial = { ...progress }
    delete partial[firstKey]
    expect(isWeekFullyMarked(week1, partial)).toBe(false)
    expect(isWeekFullyMarked(week1, {})).toBe(false)
  })
})

describe('assessWeekAdjustment', () => {
  it('keeps the plan as written after a good week', () => {
    const plan = makePlan()
    const week1 = plan.weeks[0]
    const progress = markWeek(week1, 'completed')

    expect(assessWeekAdjustment(week1, progress, 'fresh')).toBeNull()
    expect(assessWeekAdjustment(week1, progress, 'normal')).toBeNull()
  })

  it('reduces 15% after a fatigued week', () => {
    const plan = makePlan()
    const week1 = plan.weeks[0]
    const progress = markWeek(week1, 'completed')

    const adjustment = assessWeekAdjustment(week1, progress, 'tired')
    expect(adjustment?.factor).toBe(0.85)
    expect(adjustment?.reason).toMatch(/high fatigue/)
  })

  it('reduces 15% when more than a third of workouts were skipped', () => {
    const plan = makePlan()
    const week1 = plan.weeks[0]
    const progress = markWeek(week1, 'skipped')

    const adjustment = assessWeekAdjustment(week1, progress, 'normal')
    expect(adjustment?.factor).toBe(0.85)
    expect(adjustment?.reason).toMatch(/skipped/)
  })

  it('reduces 25% after a fatigued week with heavy skipping', () => {
    const plan = makePlan()
    const week1 = plan.weeks[0]
    const progress = markWeek(week1, 'skipped')

    const adjustment = assessWeekAdjustment(week1, progress, 'tired')
    expect(adjustment?.factor).toBe(0.75)
  })
})

describe('nextFeedbackWeek', () => {
  it('asks about the earliest fully marked, unanswered week', () => {
    const plan = makePlan()
    const progress = markWeek(plan.weeks[0], 'completed')

    expect(nextFeedbackWeek(plan, progress, {})).toBe(1)
    expect(nextFeedbackWeek(plan, progress, { 1: 'normal' })).toBeNull()
    expect(nextFeedbackWeek(plan, {}, {})).toBeNull()
  })

  it('never asks about the final week', () => {
    const plan = makePlan()
    const lastWeek = plan.weeks[plan.weeks.length - 1]
    const progress = markWeek(lastWeek, 'completed')

    expect(nextFeedbackWeek(plan, progress, {})).toBeNull()
  })
})

describe('applyWeekAdjustments', () => {
  it('returns the plan unchanged when no feedback triggers an adjustment', () => {
    const plan = makePlan()
    const progress = markWeek(plan.weeks[0], 'completed')

    expect(applyWeekAdjustments(plan, {}, progress)).toBe(plan)
    expect(applyWeekAdjustments(plan, { 1: 'fresh' }, progress)).toBe(plan)
  })

  it('scales the following week down without mutating the original plan', () => {
    const plan = makePlan()
    const progress = markWeek(plan.weeks[0], 'completed')

    const adjusted = applyWeekAdjustments(plan, { 1: 'tired' }, progress)
    const originalWeek2 = plan.weeks[1]
    const adjustedWeek2 = adjusted.weeks[1]

    expect(adjustedWeek2.adjustmentNote).toMatch(/after week 1/)
    expect(originalWeek2.adjustmentNote).toBeUndefined()

    originalWeek2.days.forEach((day, dayIndex) => {
      const adjustedDay = adjustedWeek2.days[dayIndex]
      if (day.distanceKm && day.dayType !== 'rest') {
        expect(adjustedDay.distanceKm).toBeLessThan(day.distanceKm)
        expect(adjustedDay.distanceKm).toBeCloseTo(Math.max(2, Math.round(day.distanceKm * 0.85 * 10) / 10), 5)
      } else {
        expect(adjustedDay.distanceKm).toBe(day.distanceKm)
      }
    })

    // Other weeks are untouched (same object references).
    expect(adjusted.weeks[0]).toBe(plan.weeks[0])
    expect(adjusted.weeks[2]).toBe(plan.weeks[2])
  })

  it('recomputes the adjusted week total and preserves distance text suffixes', () => {
    const plan = makePlan()
    const progress = markWeek(plan.weeks[0], 'completed')

    const adjusted = applyWeekAdjustments(plan, { 1: 'tired' }, progress)
    const adjustedWeek2 = adjusted.weeks[1]
    const expectedTotal = adjustedWeek2.days.reduce(
      (total, day) => (day.dayType === 'rest' ? total : total + (day.distanceKm ?? 0)),
      0
    )
    const roundedTotal = Math.round(expectedTotal * 10) / 10
    expect(adjustedWeek2.totalMileage).toContain(`${roundedTotal}`)

    const tempoDay = adjustedWeek2.days.find((day) => day.workout === 'Tempo / Threshold Run')
    expect(tempoDay?.distance).toMatch(/total$/)
  })

  it('never scales race day', () => {
    const plan = makePlan()
    const secondToLast = plan.weeks[plan.weeks.length - 2]
    const progress = markWeek(secondToLast, 'skipped')

    const adjusted = applyWeekAdjustments(plan, { [secondToLast.week]: 'tired' }, progress)
    const raceWeek = adjusted.weeks[adjusted.weeks.length - 1]
    const raceDay = raceWeek.days.find((day) => day.workout.includes('RACE DAY'))
    const originalRaceDay = plan.weeks[plan.weeks.length - 1].days.find((day) =>
      day.workout.includes('RACE DAY')
    )

    expect(raceWeek.adjustmentNote).toBeDefined()
    expect(raceDay?.distanceKm).toBe(originalRaceDay?.distanceKm)
  })
})
