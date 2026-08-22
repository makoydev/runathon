import { describe, it, expect } from 'vitest'
import { assessGoalFeasibility } from './goalFeasibility'
import type { Pace } from '../types'

describe('assessGoalFeasibility', () => {
  const pace = (minutes: number, seconds: number): Pace => ({ minutes, seconds })

  it('rates a maintenance goal with solid mileage as conservative', () => {
    const result = assessGoalFeasibility('10k', pace(5, 30), pace(5, 30), 35, 10)

    expect(result.rating).toBe('conservative')
    expect(result.reasons.some((reason) => reason.includes('no risk'))).toBe(true)
  })

  it('rates a small pace improvement with adequate base as moderate', () => {
    // ~4.5% improvement over 10 weeks with mileage already near target peak.
    const result = assessGoalFeasibility('10k', pace(5, 30), pace(5, 15), 30, 9)

    expect(result.rating).toBe('moderate')
  })

  it('rates a large pace improvement as aggressive or worse', () => {
    // ~8.3% improvement over 8 weeks.
    const result = assessGoalFeasibility('5k', pace(6, 0), pace(5, 30), 25, 8)

    expect(['aggressive', 'high-risk']).toContain(result.rating)
  })

  it('rates a marathon on a very low base as high-risk', () => {
    const result = assessGoalFeasibility('full', pace(6, 0), pace(5, 45), 12, 6)

    expect(result.rating).toBe('high-risk')
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('flags a steep mileage build even when the pace goal is safe', () => {
    const result = assessGoalFeasibility('half', pace(6, 0), pace(6, 0), 15, 12)

    expect(['aggressive', 'high-risk']).toContain(result.rating)
    expect(result.reasons.some((reason) => reason.includes('mileage'))).toBe(true)
  })

  it('flags a short longest run relative to race distance', () => {
    const result = assessGoalFeasibility('full', pace(6, 0), pace(6, 0), 60, 10)

    expect(['aggressive', 'high-risk']).toContain(result.rating)
    expect(result.reasons.some((reason) => reason.includes('longest recent run'))).toBe(true)
  })

  it('always returns at least one reason', () => {
    const result = assessGoalFeasibility('5k', pace(6, 0), pace(5, 55), 25, 8)

    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('takes the worst factor as the overall rating', () => {
    // Conservative pace goal but marathon-distance endurance gap.
    const result = assessGoalFeasibility('full', pace(6, 0), pace(5, 58), 20, 8)

    expect(['aggressive', 'high-risk']).toContain(result.rating)
  })
})
