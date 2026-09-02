import { describe, it, expect } from 'vitest'
import { deriveTrainingPaces, equivalentRacePace } from './trainingPaces'

describe('deriveTrainingPaces', () => {
  it('orders intensities from intervals to recovery', () => {
    const paces = deriveTrainingPaces(360, 42.2)
    expect(paces.interval).toBeLessThan(paces.threshold)
    expect(paces.threshold).toBeLessThan(paces.race)
    expect(paces.race).toBeLessThan(paces.easy)
    expect(paces.easy).toBeLessThan(paces.recovery)
  })

  it('puts marathon threshold roughly 20-30s/km faster than marathon pace', () => {
    const paces = deriveTrainingPaces(360, 42.2)
    expect(paces.race - paces.threshold).toBeGreaterThanOrEqual(20)
    expect(paces.race - paces.threshold).toBeLessThanOrEqual(30)
  })

  it('puts 5K threshold slower than 5K race pace', () => {
    const paces = deriveTrainingPaces(360, 5)
    expect(paces.threshold).toBeGreaterThan(paces.race)
    expect(paces.interval).toBe(paces.race)
  })

  it('predicts a faster equivalent pace for shorter races', () => {
    expect(equivalentRacePace(360, 42.2, 5)).toBeLessThan(360)
    expect(equivalentRacePace(360, 5, 42.2)).toBeGreaterThan(360)
    // A 6:00/km marathoner should be near 5:17/km for 5K.
    expect(Math.round(equivalentRacePace(360, 42.2, 5))).toBeCloseTo(317, -1)
  })

  it('handles extreme paces without producing nonsense', () => {
    const slow = deriveTrainingPaces(599, 5)
    const fast = deriveTrainingPaces(180, 42.2)
    expect(slow.threshold).toBeGreaterThan(slow.interval)
    expect(fast.easy).toBeGreaterThan(fast.threshold)
  })
})
