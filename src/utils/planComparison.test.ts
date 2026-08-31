import { describe, it, expect } from 'vitest'
import { comparePlanOptions, COMPARISON_DAY_OPTIONS } from './planComparison'
import { generateTrainingPlan } from './planGenerator'

const compare = () =>
  comparePlanOptions(
    '10k',
    { minutes: 6, seconds: 0 },
    { minutes: 5, seconds: 30 },
    30,
    10,
    'intermediate',
    'km'
  )

describe('comparePlanOptions', () => {
  it('returns stats for every offered training frequency', () => {
    const options = compare()

    expect(options.map((option) => option.trainingDays)).toEqual(COMPARISON_DAY_OPTIONS)
    options.forEach((option) => {
      expect(option.totalMileageKm).toBeGreaterThan(0)
      expect(option.longestRunKm).toBeGreaterThan(0)
      expect(option.raceWeekRunDays).toBeGreaterThan(0)
    })
  })

  it('matches the stats of a directly generated plan', () => {
    const fourDay = compare().find((option) => option.trainingDays === 4)
    const plan = generateTrainingPlan(
      '10k', { minutes: 6, seconds: 0 }, { minutes: 5, seconds: 30 }, 4, 30, 10, 'intermediate', 'km'
    )

    const expectedTotal = plan.weeks.reduce(
      (total, week) =>
        total +
        week.days.reduce(
          (weekTotal, day) =>
            day.dayType && day.dayType !== 'rest' ? weekTotal + (day.distanceKm ?? 0) : weekTotal,
          0
        ),
      0
    )

    expect(fourDay?.totalMileageKm).toBeCloseTo(expectedTotal, 1)
    expect(fourDay?.qualityDays).toBe(
      plan.weeks.flatMap((week) => week.days).filter((day) => day.dayType === 'quality').length
    )
  })

  it('gives more frequent schedules at least as much volume', () => {
    const options = compare()
    for (let i = 1; i < options.length; i++) {
      expect(options[i].totalMileageKm).toBeGreaterThanOrEqual(options[i - 1].totalMileageKm)
    }
  })

  it('caps race-week run days at the training frequency', () => {
    compare().forEach((option) => {
      expect(option.raceWeekRunDays).toBeLessThanOrEqual(option.trainingDays)
    })
  })
})
