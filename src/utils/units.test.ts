import { describe, it, expect, beforeEach } from 'vitest'
import {
  kmToUnit,
  unitToKm,
  convertPace,
  formatPaceInUnit,
  formatDistanceInUnit,
  loadUnit,
  storeUnit,
} from './units'

describe('units', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('converts kilometers to miles and back', () => {
    expect(kmToUnit(10, 'mi')).toBeCloseTo(6.21, 2)
    expect(kmToUnit(10, 'km')).toBe(10)
    expect(unitToKm(kmToUnit(42.2, 'mi'), 'mi')).toBeCloseTo(42.2, 5)
  })

  it('converts a per-km pace to a slower per-mile pace', () => {
    // 6:00/km is about 9:39/mi.
    const converted = convertPace({ minutes: 6, seconds: 0 }, 'km', 'mi')
    expect(converted).toEqual({ minutes: 9, seconds: 39 })
  })

  it('round-trips pace conversion within a second', () => {
    const original = { minutes: 5, seconds: 30 }
    const roundTripped = convertPace(convertPace(original, 'km', 'mi'), 'mi', 'km')

    const toSeconds = (pace: typeof original) => pace.minutes * 60 + pace.seconds
    expect(Math.abs(toSeconds(roundTripped) - toSeconds(original))).toBeLessThanOrEqual(1)
  })

  it('formats a canonical per-km pace in either unit', () => {
    expect(formatPaceInUnit({ minutes: 6, seconds: 0 }, 'km')).toBe('6:00/km')
    expect(formatPaceInUnit({ minutes: 6, seconds: 0 }, 'mi')).toBe('9:39/mi')
  })

  it('formats a canonical km distance in either unit', () => {
    expect(formatDistanceInUnit(10, 'km')).toBe('10 km')
    expect(formatDistanceInUnit(42.2, 'mi')).toBe('26.2 mi')
  })

  it('defaults to km and persists the chosen unit', () => {
    expect(loadUnit()).toBe('km')

    storeUnit('mi')
    expect(loadUnit()).toBe('mi')

    localStorage.setItem('runathon.unit.v1', 'bogus')
    expect(loadUnit()).toBe('km')
  })
})
