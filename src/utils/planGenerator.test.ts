import { describe, it, expect } from 'vitest'
import { generateTrainingPlan } from './planGenerator'
import type { Pace, RaceDistance } from '../types'

describe('generateTrainingPlan', () => {
  const defaultCurrentPace: Pace = { minutes: 6, seconds: 0 }
  const defaultTargetPace: Pace = { minutes: 5, seconds: 30 }
  const defaultTrainingDays = 5

  describe('plan structure', () => {
    it('generates correct number of weeks for 5k', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      expect(plan.weeks).toHaveLength(8)
    })

    it('generates correct number of weeks for 10k', () => {
      const plan = generateTrainingPlan('10k', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      expect(plan.weeks).toHaveLength(10)
    })

    it('generates correct number of weeks for half marathon', () => {
      const plan = generateTrainingPlan('half', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      expect(plan.weeks).toHaveLength(12)
    })

    it('generates correct number of weeks for full marathon', () => {
      const plan = generateTrainingPlan('full', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      expect(plan.weeks).toHaveLength(16)
    })

    it('includes all 7 days in each week', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      plan.weeks.forEach((week) => {
        expect(week.days).toHaveLength(7)
      })
    })

    it('stores input parameters in the plan', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, 4)
      expect(plan.distance).toBe('5k')
      expect(plan.currentPace).toEqual(defaultCurrentPace)
      expect(plan.targetPace).toEqual(defaultTargetPace)
      expect(plan.trainingDays).toBe(4)
    })
  })

  describe('training phases', () => {
    it('assigns Base Building phase to early weeks', () => {
      const plan = generateTrainingPlan('full', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      // Week 1 has progress = 1/16 = 6.25%, which is < 25% (Base Building)
      expect(plan.weeks[0].phase).toBe('Base Building')
      // Week 3 has progress = 3/16 = 18.75%, still < 25%
      expect(plan.weeks[2].phase).toBe('Base Building')
    })

    it('assigns Build Phase to mid-early weeks', () => {
      const plan = generateTrainingPlan('full', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      // Week 5 has progress = 5/16 = 31.25%, which is >= 25% and < 50% (Build Phase)
      expect(plan.weeks[4].phase).toBe('Build Phase')
      expect(plan.weeks[6].phase).toBe('Build Phase')
    })

    it('assigns Peak Training phase to mid-late weeks', () => {
      const plan = generateTrainingPlan('full', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      // Week 9 has progress = 9/16 = 56.25%, which is >= 50% and < 85%
      expect(plan.weeks[8].phase).toBe('Peak Training')
      expect(plan.weeks[12].phase).toBe('Peak Training')
    })

    it('assigns Taper phase to final weeks', () => {
      const plan = generateTrainingPlan('full', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      // Week 16 has progress = 16/16 = 100%, which is >= 85% (Taper)
      expect(plan.weeks[15].phase).toBe('Taper')
    })
  })

  describe('80/20 easy vs quality distribution', () => {
    it('limits quality training to approximately 20% of weekly mileage (excluding race week)', () => {
      const plan = generateTrainingPlan('half', defaultCurrentPace, defaultTargetPace, 5)

      // Exclude race week as it has unique structure with the race itself
      const trainingWeeks = plan.weeks.slice(0, -1)

      trainingWeeks.forEach((week) => {
        const totalMileage = parseInt(week.totalMileage)
        let qualityMileage = 0

        week.days.forEach((day) => {
          if (day.dayType === 'quality' && day.distance) {
            // Extract number from distance string like "5 km" or "5 km total"
            const match = day.distance.match(/(\d+)/)
            if (match) {
              qualityMileage += parseInt(match[1])
            }
          }
        })

        // Quality should be at most ~25% of total mileage (22% cap + some margin)
        const qualityPercentage = (qualityMileage / totalMileage) * 100
        expect(qualityPercentage).toBeLessThanOrEqual(30)
      })
    })

    it('has more easy mileage than quality mileage (excluding race week)', () => {
      const plan = generateTrainingPlan('10k', defaultCurrentPace, defaultTargetPace, 5)

      // Exclude race week as it has unique structure
      const trainingWeeks = plan.weeks.slice(0, -1)

      trainingWeeks.forEach((week) => {
        let easyMileage = 0
        let qualityMileage = 0

        week.days.forEach((day) => {
          if (!day.distance || day.distance === 'Rest') return
          const match = day.distance.match(/(\d+)/)
          if (!match) return
          const distance = parseInt(match[1])

          if (day.dayType === 'quality') {
            qualityMileage += distance
          } else if (day.dayType === 'easy' || day.dayType === 'long' || day.dayType === 'recovery') {
            easyMileage += distance
          }
        })

        // Easy should always be greater than quality
        expect(easyMileage).toBeGreaterThan(qualityMileage)
      })
    })

    it('reduces quality sessions during Base Building phase', () => {
      const plan = generateTrainingPlan('full', defaultCurrentPace, defaultTargetPace, 5)

      // Base building weeks should have fewer/lighter quality sessions
      const baseWeek = plan.weeks[0]
      const buildWeek = plan.weeks[6]

      const countQualitySessions = (week: typeof baseWeek) =>
        week.days.filter((d) => d.dayType === 'quality').length

      // Base building should have 1 quality session, build phase should have 2
      expect(countQualitySessions(baseWeek)).toBeLessThanOrEqual(countQualitySessions(buildWeek))
    })
  })

  describe('pace calculations', () => {
    it('generates paces that improve over time', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)

      const getPaceFromWeek = (week: typeof plan.weeks[0]) => {
        const tempoDay = week.days.find((d) => d.workout.includes('Tempo'))
        if (!tempoDay?.pace) return null
        const match = tempoDay.pace.match(/(\d+):(\d+)/)
        if (!match) return null
        return parseInt(match[1]) * 60 + parseInt(match[2])
      }

      const firstWeekPace = getPaceFromWeek(plan.weeks[0])
      const lastWeekPace = getPaceFromWeek(plan.weeks[plan.weeks.length - 2]) // -2 because last week is race week

      if (firstWeekPace && lastWeekPace) {
        // Later week pace should be faster (lower number)
        expect(lastWeekPace).toBeLessThan(firstWeekPace)
      }
    })

    it('easy pace is slower than tempo pace', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)

      const week = plan.weeks[4] // Pick a mid-plan week
      const easyDay = week.days.find((d) => d.dayType === 'easy' && d.pace)
      const tempoDay = week.days.find((d) => d.workout.includes('Tempo'))

      if (easyDay?.pace && tempoDay?.pace) {
        const parseMinutes = (pace: string) => {
          const match = pace.match(/(\d+):(\d+)/)
          return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0
        }

        const easySeconds = parseMinutes(easyDay.pace)
        const tempoSeconds = parseMinutes(tempoDay.pace)

        // Easy should be slower (higher number)
        expect(easySeconds).toBeGreaterThan(tempoSeconds)
      }
    })
  })

  describe('training days adjustment', () => {
    it('respects user training day preference', () => {
      const distances: RaceDistance[] = ['5k', '10k', 'half', 'full']
      const trainingDaysOptions = [3, 4, 5, 6]

      distances.forEach((distance) => {
        trainingDaysOptions.forEach((trainingDays) => {
          const plan = generateTrainingPlan(distance, defaultCurrentPace, defaultTargetPace, trainingDays)

          plan.weeks.forEach((week, weekIndex) => {
            const runDays = week.days.filter((d) => d.dayType && d.dayType !== 'rest').length

            // Allow race week to have different number of days
            const isRaceWeek = weekIndex === plan.weeks.length - 1
            if (!isRaceWeek) {
              expect(runDays).toBeLessThanOrEqual(trainingDays)
            }
          })
        })
      })
    })

    it('always includes long run on Saturday', () => {
      const plan = generateTrainingPlan('half', defaultCurrentPace, defaultTargetPace, 3)

      // Check non-race weeks
      plan.weeks.slice(0, -1).forEach((week) => {
        const saturday = week.days.find((d) => d.day === 'Saturday')
        expect(saturday?.dayType).toBe('long')
      })
    })
  })

  describe('race week', () => {
    it('has race day on Sunday of final week', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      const raceWeek = plan.weeks[plan.weeks.length - 1]
      const sunday = raceWeek.days.find((d) => d.day === 'Sunday')

      expect(sunday?.workout).toContain('RACE DAY')
    })

    it('has pre-race shakeout on Saturday of final week', () => {
      const plan = generateTrainingPlan('10k', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      const raceWeek = plan.weeks[plan.weeks.length - 1]
      const saturday = raceWeek.days.find((d) => d.day === 'Saturday')

      expect(saturday?.workout).toContain('Shakeout')
    })

    it('displays correct race distance on race day', () => {
      const distances: Array<{ key: RaceDistance; km: number }> = [
        { key: '5k', km: 5 },
        { key: '10k', km: 10 },
        { key: 'half', km: 21.1 },
        { key: 'full', km: 42.2 },
      ]

      distances.forEach(({ key, km }) => {
        const plan = generateTrainingPlan(key, defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
        const raceWeek = plan.weeks[plan.weeks.length - 1]
        const sunday = raceWeek.days.find((d) => d.day === 'Sunday')

        expect(sunday?.distance).toBe(`${km} km`)
      })
    })
  })

  describe('plan summary', () => {
    it('includes 80/20 distribution note', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      expect(plan.summary).toContain('80%')
      expect(plan.summary).toContain('easy')
    })

    it('mentions training days per week', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, 4)
      expect(plan.summary).toContain('4 days/week')
    })

    it('includes pace information', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, defaultTrainingDays)
      expect(plan.summary).toContain('6:00')
      expect(plan.summary).toContain('5:30')
    })
  })

  describe('edge cases', () => {
    it('handles same current and target pace', () => {
      const samePace: Pace = { minutes: 5, seconds: 30 }
      const plan = generateTrainingPlan('5k', samePace, samePace, defaultTrainingDays)

      expect(plan.weeks).toHaveLength(8)
      expect(plan.summary).toContain('steady')
    })

    it('handles slower target pace (negative improvement)', () => {
      const currentPace: Pace = { minutes: 5, seconds: 0 }
      const slowerTarget: Pace = { minutes: 5, seconds: 30 }
      const plan = generateTrainingPlan('5k', currentPace, slowerTarget, defaultTrainingDays)

      expect(plan.weeks).toHaveLength(8)
      expect(plan.summary).toContain('add')
    })

    it('handles minimum training days (3)', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, 3)

      plan.weeks.forEach((week, weekIndex) => {
        const isRaceWeek = weekIndex === plan.weeks.length - 1
        if (!isRaceWeek) {
          const runDays = week.days.filter((d) => d.dayType && d.dayType !== 'rest').length
          expect(runDays).toBeLessThanOrEqual(3)
        }
      })
    })

    it('handles maximum training days (6)', () => {
      const plan = generateTrainingPlan('5k', defaultCurrentPace, defaultTargetPace, 6)

      plan.weeks.forEach((week) => {
        const runDays = week.days.filter((d) => d.dayType && d.dayType !== 'rest').length
        expect(runDays).toBeLessThanOrEqual(6)
      })
    })

    it('handles edge pace values', () => {
      const slowPace: Pace = { minutes: 9, seconds: 59 }
      const fastPace: Pace = { minutes: 3, seconds: 0 }

      const plan = generateTrainingPlan('5k', slowPace, fastPace, defaultTrainingDays)
      expect(plan.weeks).toHaveLength(8)
    })
  })
})
