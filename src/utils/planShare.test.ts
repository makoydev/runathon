import { describe, it, expect } from 'vitest'
import { encodeShareParams, decodeShareParams, sameInputs } from './planShare'
import { generateTrainingPlan } from './planGenerator'

const makePlan = () =>
  generateTrainingPlan(
    '10k',
    { minutes: 6, seconds: 0 },
    { minutes: 5, seconds: 30 },
    5,
    30,
    10,
    'advanced',
    'mi'
  )

describe('encodeShareParams / decodeShareParams', () => {
  it('round-trips every plan input', () => {
    const plan = makePlan()
    const decoded = decodeShareParams(encodeShareParams(plan))

    expect(decoded).toEqual({
      distance: '10k',
      currentPace: { minutes: 6, seconds: 0 },
      targetPace: { minutes: 5, seconds: 30 },
      trainingDays: 5,
      currentWeeklyMileage: 30,
      longestRecentRun: 10,
      experienceLevel: 'advanced',
      unit: 'mi',
    })
  })

  it('omits absent optional inputs and restores them as undefined', () => {
    const plan = generateTrainingPlan('5k', { minutes: 6, seconds: 0 }, { minutes: 5, seconds: 30 }, 4)
    const encoded = encodeShareParams(plan)

    expect(encoded).not.toContain('wm=')
    expect(encoded).not.toContain('lr=')

    const decoded = decodeShareParams(encoded)
    expect(decoded?.currentWeeklyMileage).toBeUndefined()
    expect(decoded?.longestRecentRun).toBeUndefined()
  })

  it('defaults experience and unit when the link omits them', () => {
    const decoded = decodeShareParams('d=5k&cp=360&tp=330&td=4')
    expect(decoded?.experienceLevel).toBe('intermediate')
    expect(decoded?.unit).toBe('km')
  })

  it('rejects links with missing or invalid fields', () => {
    expect(decodeShareParams('')).toBeNull()
    expect(decodeShareParams('d=marathon&cp=360&tp=330&td=4')).toBeNull()
    expect(decodeShareParams('d=5k&tp=330&td=4')).toBeNull()
    expect(decodeShareParams('d=5k&cp=abc&tp=330&td=4')).toBeNull()
    expect(decodeShareParams('d=5k&cp=360&tp=330&td=9')).toBeNull()
    expect(decodeShareParams('d=5k&cp=360&tp=330&td=4&xp=elite')).toBeNull()
    expect(decodeShareParams('d=5k&cp=360&tp=330&td=4&u=furlongs')).toBeNull()
    expect(decodeShareParams('d=5k&cp=360&tp=330&td=4&wm=-5')).toBeNull()
  })

  it('rejects out-of-range paces', () => {
    expect(decodeShareParams('d=5k&cp=60&tp=330&td=4')).toBeNull()
    expect(decodeShareParams('d=5k&cp=360&tp=1500&td=4')).toBeNull()
  })
})

describe('sameInputs', () => {
  it('matches plans generated from identical inputs', () => {
    expect(sameInputs(makePlan(), makePlan())).toBe(true)
  })

  it('distinguishes plans that differ in any input', () => {
    const plan = makePlan()
    const differentDays = generateTrainingPlan(
      '10k', { minutes: 6, seconds: 0 }, { minutes: 5, seconds: 30 }, 4, 30, 10, 'advanced', 'mi'
    )
    const differentPace = generateTrainingPlan(
      '10k', { minutes: 6, seconds: 5 }, { minutes: 5, seconds: 30 }, 5, 30, 10, 'advanced', 'mi'
    )

    expect(sameInputs(plan, differentDays)).toBe(false)
    expect(sameInputs(plan, differentPace)).toBe(false)
  })
})
