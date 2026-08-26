import { describe, it, expect } from 'vitest'
import { summarizeProgress } from './progressSummary'
import { dayKey } from './progressStorage'
import type { PlanProgress } from './progressStorage'
import { generateTrainingPlan } from './planGenerator'

describe('summarizeProgress', () => {
  const makePlan = () =>
    generateTrainingPlan('10k', { minutes: 6, seconds: 0 }, { minutes: 5, seconds: 30 }, 5, 30, 10)

  it('counts every non-rest day as a workout with no progress marked', () => {
    const plan = makePlan()
    const summary = summarizeProgress(plan, {})

    const nonRestDays = plan.weeks
      .flatMap((week) => week.days)
      .filter((day) => day.dayType && day.dayType !== 'rest').length

    expect(summary.totalWorkouts).toBe(nonRestDays)
    expect(summary.completedCount).toBe(0)
    expect(summary.skippedCount).toBe(0)
    expect(summary.completionRate).toBe(0)
    expect(summary.completedMileageKm).toBe(0)
  })

  it('tallies completed mileage and longest completed run', () => {
    const plan = makePlan()
    const week1 = plan.weeks[0]
    const progress: PlanProgress = {}
    const markedDistances: number[] = []

    week1.days.forEach((day, dayIndex) => {
      if (day.dayType && day.dayType !== 'rest' && day.distanceKm) {
        progress[dayKey(1, dayIndex)] = 'completed'
        markedDistances.push(day.distanceKm)
      }
    })

    const summary = summarizeProgress(plan, progress)
    const expectedTotal = Math.round(markedDistances.reduce((a, b) => a + b, 0) * 10) / 10

    expect(summary.completedCount).toBe(markedDistances.length)
    expect(summary.completedMileageKm).toBe(expectedTotal)
    expect(summary.longestCompletedRunKm).toBe(Math.max(...markedDistances))
  })

  it('computes completion rate over marked days only', () => {
    const plan = makePlan()
    const nonRest: Array<{ week: number; dayIndex: number }> = []
    plan.weeks.forEach((week) => {
      week.days.forEach((day, dayIndex) => {
        if (day.dayType && day.dayType !== 'rest') nonRest.push({ week: week.week, dayIndex })
      })
    })

    const progress: PlanProgress = {
      [dayKey(nonRest[0].week, nonRest[0].dayIndex)]: 'completed',
      [dayKey(nonRest[1].week, nonRest[1].dayIndex)]: 'completed',
      [dayKey(nonRest[2].week, nonRest[2].dayIndex)]: 'skipped',
    }

    const summary = summarizeProgress(plan, progress)
    expect(summary.completionRate).toBeCloseTo(2 / 3, 5)
    expect(summary.skippedCount).toBe(1)
  })

  it('points at the first unmarked quality or long session as the next key session', () => {
    const plan = makePlan()
    const summary = summarizeProgress(plan, {})

    expect(summary.nextKeySession).not.toBeNull()
    expect(summary.nextKeySession?.week).toBe(1)

    // Mark every key session in week 1; the next key session moves to a later week.
    const progress: PlanProgress = {}
    plan.weeks[0].days.forEach((day, dayIndex) => {
      if (day.dayType === 'quality' || day.dayType === 'long') {
        progress[dayKey(1, dayIndex)] = 'completed'
      }
    })

    const afterWeek1 = summarizeProgress(plan, progress)
    expect(afterWeek1.nextKeySession?.week).toBeGreaterThan(1)
  })
})
