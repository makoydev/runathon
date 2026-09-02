import { describe, it, expect } from 'vitest'
import { autoRunWalkRatio, ratioLabel, runWalkWeekendSchedule, generateRunWalkWeeks, isValidRatio } from './runWalk'
import { generateTrainingPlan } from './planGenerator'
import { encodeShareParams, decodeShareParams, sameInputs } from './planShare'

const oneToOne = { runSeconds: 60, walkSeconds: 60 }

describe('run-walk ratios', () => {
  it('suggests longer run segments for faster runners', () => {
    expect(autoRunWalkRatio(280).runSeconds).toBe(240)
    expect(autoRunWalkRatio(450)).toEqual(oneToOne)
    expect(autoRunWalkRatio(599).runSeconds).toBe(30)
  })

  it('labels ratios in minutes or seconds', () => {
    expect(ratioLabel(oneToOne)).toBe('run 1 min / walk 1 min')
    expect(ratioLabel({ runSeconds: 30, walkSeconds: 30 })).toBe('run 30 s / walk 30 s')
  })

  it('rejects out-of-range segments', () => {
    expect(isValidRatio(oneToOne)).toBe(true)
    expect(isValidRatio({ runSeconds: 5, walkSeconds: 60 })).toBe(false)
    expect(isValidRatio({ runSeconds: 60, walkSeconds: 6000 })).toBe(false)
  })
})

describe('runWalkWeekendSchedule', () => {
  const schedule = runWalkWeekendSchedule(16, 8, 42.2, 3, 3)

  it('starts at the longest recent run and grows every week while short', () => {
    expect(schedule[0]).toEqual({ km: 8, isLong: true })
    expect(schedule[1]).toEqual({ km: 11, isLong: true })
    expect(schedule[2]).toEqual({ km: 14, isLong: true })
  })

  it('alternates long and short weekends once the long run is established', () => {
    const longWeeks = schedule.map((run, index) => (run.isLong ? index + 1 : null)).filter(Boolean)
    expect(longWeeks).toEqual([1, 2, 3, 4, 5, 7, 9, 11, 13])
    expect(schedule[5].km).toBeLessThan(schedule[4].km)
  })

  it('places the last long run three weeks out for a marathon and tapers after it', () => {
    expect(schedule[12].isLong).toBe(true)
    expect(schedule[12].km).toBe(32)
    expect(schedule[13].isLong).toBe(false)
    expect(schedule[14].km).toBeLessThan(schedule[13].km)
    expect(schedule[15]).toEqual({ km: 0, isLong: false })
  })

  it('never exceeds the target distance', () => {
    const half = runWalkWeekendSchedule(12, 12, 21.1, 3.5, 2)
    expect(Math.max(...half.map((run) => run.km))).toBe(21)
  })
})

describe('generateRunWalkWeeks', () => {
  const weeks = generateRunWalkWeeks({
    distance: 'full',
    currentPace: { minutes: 9, seconds: 59 },
    targetPace: { minutes: 8, seconds: 30 },
    trainingDays: 4,
    longestRecentRun: 8,
    experienceLevel: 'beginner',
    unit: 'km',
    ratio: oneToOne,
  })

  it('mentions the walk breaks in every running day', () => {
    weeks.slice(0, -1).forEach((week) => {
      week.days
        .filter((day) => day.dayType && day.dayType !== 'rest')
        .forEach((day) => expect(day.description).toContain('run 1 min / walk 1 min'))
    })
  })

  it('schedules a Magic Mile every third week before the taper', () => {
    const magicMileWeeks = weeks.filter((week) => week.days.some((day) => day.workout === 'Magic Mile')).map((week) => week.week)
    expect(magicMileWeeks).toEqual([3, 6, 9, 12])
    const magicMile = weeks[2].days.find((day) => day.workout === 'Magic Mile')
    expect(magicMile?.qualityKm).toBe(1.6)
    expect(magicMile?.description).toContain('1.3')
  })

  it('has no interval or tempo sessions', () => {
    weeks.forEach((week) => {
      expect(week.days.some((day) => /Interval|Tempo/.test(day.workout))).toBe(false)
    })
  })

  it('keeps the long run slower than the weekday runs', () => {
    const parse = (pace?: string) => {
      const match = pace?.match(/(\d+):(\d+)/)
      return match ? Number(match[1]) * 60 + Number(match[2]) : 0
    }
    const week = weeks[4]
    const longRun = week.days.find((day) => day.dayType === 'long')
    const weekday = week.days.find((day) => day.day === 'Tuesday')
    expect(parse(longRun?.pace)).toBeGreaterThan(parse(weekday?.pace))
  })

  it('respects the training day count and ends with the race', () => {
    weeks.slice(0, -1).forEach((week) => {
      expect(week.days.filter((day) => day.dayType && day.dayType !== 'rest').length).toBeLessThanOrEqual(4)
    })
    const raceWeek = weeks[weeks.length - 1]
    expect(raceWeek.days[6].workout).toContain('RACE DAY')
    expect(raceWeek.days[6].description).toContain('run 1 min / walk 1 min')
  })
})

describe('run-walk plans through the generator', () => {
  const plan = generateTrainingPlan('full', { minutes: 9, seconds: 59 }, { minutes: 8, seconds: 30 }, 4, 20, 8, 'beginner', 'km', oneToOne)

  it('stamps the method and ratio on the plan', () => {
    expect(plan.method).toBe('runwalk')
    expect(plan.runWalk).toEqual(oneToOne)
    expect(plan.summary).toContain('run 1 min / walk 1 min')
    expect(plan.summary).toContain('Magic Mile')
  })

  it('round-trips the ratio through share links', () => {
    const params = encodeShareParams(plan)
    expect(params).toContain('rw=60-60')
    const decoded = decodeShareParams(`?${params}`)
    expect(decoded?.runWalk).toEqual(oneToOne)
    expect(decodeShareParams('?d=5k&cp=360&tp=330&td=4&rw=5-60')).toBeNull()
  })

  it('treats different methods as different plans when deduplicating', () => {
    const continuous = generateTrainingPlan('full', { minutes: 9, seconds: 59 }, { minutes: 8, seconds: 30 }, 4, 20, 8, 'beginner', 'km')
    expect(sameInputs(plan, continuous)).toBe(false)
    expect(sameInputs(plan, generateTrainingPlan('full', { minutes: 9, seconds: 59 }, { minutes: 8, seconds: 30 }, 4, 20, 8, 'beginner', 'km', oneToOne))).toBe(true)
  })
})
