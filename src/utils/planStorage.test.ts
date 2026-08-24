import { describe, it, expect, beforeEach } from 'vitest'
import { loadSavedPlans, savePlan, deleteSavedPlan, loadActivePlanId, storeActivePlanId } from './planStorage'
import { generateTrainingPlan } from './planGenerator'

describe('planStorage', () => {
  const makePlan = () =>
    generateTrainingPlan('10k', { minutes: 6, seconds: 0 }, { minutes: 5, seconds: 30 }, 5, 30, 10)

  beforeEach(() => {
    localStorage.clear()
  })

  it('returns an empty list when nothing is saved', () => {
    expect(loadSavedPlans()).toEqual([])
  })

  it('round-trips a saved plan', () => {
    const saved = savePlan(makePlan())
    const loaded = loadSavedPlans()

    expect(loaded).toHaveLength(1)
    expect(loaded[0].id).toBe(saved.id)
    expect(loaded[0].createdAt).toBe(saved.createdAt)
    expect(loaded[0].plan.distance).toBe('10k')
    expect(loaded[0].plan.weeks).toHaveLength(10)
  })

  it('keeps the newest plan first', () => {
    const first = savePlan(makePlan())
    const second = savePlan(makePlan())

    const loaded = loadSavedPlans()
    expect(loaded[0].id).toBe(second.id)
    expect(loaded[1].id).toBe(first.id)
  })

  it('caps stored plans at 10, dropping the oldest', () => {
    const ids = Array.from({ length: 12 }, () => savePlan(makePlan()).id)

    const loaded = loadSavedPlans()
    expect(loaded).toHaveLength(10)
    expect(loaded.map((saved) => saved.id)).toEqual(ids.slice(2).reverse())
  })

  it('deletes a saved plan by id', () => {
    const keep = savePlan(makePlan())
    const remove = savePlan(makePlan())

    const remaining = deleteSavedPlan(remove.id)
    expect(remaining.map((saved) => saved.id)).toEqual([keep.id])
    expect(loadSavedPlans().map((saved) => saved.id)).toEqual([keep.id])
  })

  it('returns an empty list for corrupted storage', () => {
    localStorage.setItem('runathon.saved-plans.v1', 'not json{')
    expect(loadSavedPlans()).toEqual([])

    localStorage.setItem('runathon.saved-plans.v1', JSON.stringify([{ bogus: true }]))
    expect(loadSavedPlans()).toEqual([])
  })

  it('stores and clears the active plan id', () => {
    expect(loadActivePlanId()).toBeNull()

    storeActivePlanId('abc-123')
    expect(loadActivePlanId()).toBe('abc-123')

    storeActivePlanId(null)
    expect(loadActivePlanId()).toBeNull()
  })
})
