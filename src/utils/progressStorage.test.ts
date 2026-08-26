import { describe, it, expect, beforeEach } from 'vitest'
import { dayKey, loadPlanProgress, setWorkoutStatus, clearPlanProgress } from './progressStorage'

describe('progressStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty progress for an unknown plan', () => {
    expect(loadPlanProgress('missing')).toEqual({})
  })

  it('stores and reloads workout statuses per plan', () => {
    setWorkoutStatus('plan-a', dayKey(1, 1), 'completed')
    setWorkoutStatus('plan-a', dayKey(1, 3), 'skipped')
    setWorkoutStatus('plan-b', dayKey(1, 1), 'skipped')

    expect(loadPlanProgress('plan-a')).toEqual({ 'w1-d1': 'completed', 'w1-d3': 'skipped' })
    expect(loadPlanProgress('plan-b')).toEqual({ 'w1-d1': 'skipped' })
  })

  it('clears a single day when status is null', () => {
    setWorkoutStatus('plan-a', dayKey(2, 5), 'completed')
    const progress = setWorkoutStatus('plan-a', dayKey(2, 5), null)

    expect(progress).toEqual({})
    expect(loadPlanProgress('plan-a')).toEqual({})
  })

  it('removes all progress for a deleted plan', () => {
    setWorkoutStatus('plan-a', dayKey(1, 1), 'completed')
    setWorkoutStatus('plan-b', dayKey(1, 1), 'completed')

    clearPlanProgress('plan-a')

    expect(loadPlanProgress('plan-a')).toEqual({})
    expect(loadPlanProgress('plan-b')).toEqual({ 'w1-d1': 'completed' })
  })

  it('survives corrupted storage', () => {
    localStorage.setItem('runathon.progress.v1', '{broken')
    expect(loadPlanProgress('plan-a')).toEqual({})

    setWorkoutStatus('plan-a', dayKey(1, 1), 'completed')
    expect(loadPlanProgress('plan-a')).toEqual({ 'w1-d1': 'completed' })
  })
})
