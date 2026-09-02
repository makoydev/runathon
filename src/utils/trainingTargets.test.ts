import { describe, it, expect } from 'vitest'
import { peakLongRun, peakWeeklyMileage, DISTANCE_TARGETS } from './trainingTargets'

describe('training targets', () => {
  it('asks marathoners for a 30 km plus long run', () => {
    expect(peakLongRun('full')).toBeGreaterThanOrEqual(30)
    expect(peakLongRun('full', 'beginner')).toBeGreaterThanOrEqual(26)
    expect(peakLongRun('full', 'advanced')).toBeGreaterThan(peakLongRun('full'))
  })

  it('keeps the peak long run under half the peak week for every level', () => {
    for (const distance of ['5k', '10k', 'half', 'full'] as const) {
      for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
        expect(peakLongRun(distance, level)).toBeLessThanOrEqual(peakWeeklyMileage(distance, level) * 0.5)
      }
    }
  })

  it('grows targets with race distance', () => {
    expect(DISTANCE_TARGETS['5k'].peakLongRun).toBeLessThan(DISTANCE_TARGETS['10k'].peakLongRun)
    expect(DISTANCE_TARGETS['half'].peakLongRun).toBeLessThan(DISTANCE_TARGETS['full'].peakLongRun)
  })
})
