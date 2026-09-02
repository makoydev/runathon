import { describe, it, expect } from 'vitest'
import { generateTrainingPlan } from './planGenerator'
import { dayKey } from './progressStorage'
import { firstOpenWeek, weekCompletion, weekKeyRunKm, weekTotalKm, phaseSpans, dayTypeStyle } from './planView'

const plan = generateTrainingPlan('10k', { minutes: 6, seconds: 0 }, { minutes: 5, seconds: 30 }, 5, 30, 10)

describe('planView helpers', () => {
  it('counts only runnable days toward completion', () => {
    const week = plan.weeks[0]
    const runnable = week.days.filter((day) => day.dayType && day.dayType !== 'rest').length
    const progress = { [dayKey(1, 1)]: 'completed' as const, [dayKey(1, 3)]: 'skipped' as const }

    expect(weekCompletion(week, progress)).toEqual({ total: runnable, completed: 1, skipped: 1 })
  })

  it('opens on the first week with unmarked workouts', () => {
    expect(firstOpenWeek(plan, {})).toBe(1)

    const progress: Record<string, 'completed' | 'skipped'> = {}
    plan.weeks[0].days.forEach((day, index) => {
      if (day.dayType && day.dayType !== 'rest') progress[dayKey(1, index)] = 'completed'
    })
    expect(firstOpenWeek(plan, progress)).toBe(2)
  })

  it('stays on the final week once everything is marked', () => {
    const progress: Record<string, 'completed' | 'skipped'> = {}
    plan.weeks.forEach((week) =>
      week.days.forEach((day, index) => {
        if (day.dayType && day.dayType !== 'rest') progress[dayKey(week.week, index)] = 'skipped'
      })
    )
    expect(firstOpenWeek(plan, progress)).toBe(plan.weeks.length)
  })

  it('reads the long run, or the race in race week', () => {
    const longRun = plan.weeks[0].days.find((day) => day.dayType === 'long')?.distanceKm
    expect(weekKeyRunKm(plan.weeks[0])).toBe(longRun)
    expect(weekKeyRunKm(plan.weeks[plan.weeks.length - 1])).toBe(10)
    expect(weekTotalKm(plan.weeks[0])).toBeCloseTo(Number(plan.weeks[0].totalMileage.replace(' km', '')), 1)
  })

  it('groups consecutive weeks by phase in order', () => {
    const spans = phaseSpans(plan.weeks)
    expect(spans.map((span) => span.phase)).toEqual(['Base Building', 'Build Phase', 'Peak Training', 'Taper'])
    expect(spans.reduce((sum, span) => sum + span.count, 0)).toBe(plan.weeks.length)
  })

  it('styles race day distinctly from other quality days', () => {
    const raceDay = plan.weeks[plan.weeks.length - 1].days[6]
    expect(dayTypeStyle(raceDay).label).toBe('Race day')
    expect(dayTypeStyle({ day: 'Monday', workout: 'Rest', description: '', dayType: 'rest' }).label).toBe('Rest')
  })
})
