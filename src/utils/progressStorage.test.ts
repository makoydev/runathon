import { describe, it, expect, beforeEach } from 'vitest'
import {
  dayKey,
  loadPlanProgress,
  setWorkoutStatus,
  clearPlanProgress,
  loadWeekFeedback,
  setWeekFeedback,
  loadWorkoutLog,
  setWorkoutLogEntry,
} from './progressStorage'

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

  it('stores and reloads week feedback per plan', () => {
    setWeekFeedback('plan-a', 1, 'tired')
    setWeekFeedback('plan-a', 2, 'fresh')
    setWeekFeedback('plan-b', 1, 'normal')

    expect(loadWeekFeedback('plan-a')).toEqual({ 1: 'tired', 2: 'fresh' })
    expect(loadWeekFeedback('plan-b')).toEqual({ 1: 'normal' })
    expect(loadWeekFeedback('missing')).toEqual({})
  })

  it('overwrites feedback when a week is answered again', () => {
    setWeekFeedback('plan-a', 1, 'tired')
    const feedback = setWeekFeedback('plan-a', 1, 'normal')

    expect(feedback).toEqual({ 1: 'normal' })
    expect(loadWeekFeedback('plan-a')).toEqual({ 1: 'normal' })
  })

  it('clears week feedback along with plan progress', () => {
    setWorkoutStatus('plan-a', dayKey(1, 1), 'completed')
    setWeekFeedback('plan-a', 1, 'tired')
    setWeekFeedback('plan-b', 1, 'fresh')

    clearPlanProgress('plan-a')

    expect(loadWeekFeedback('plan-a')).toEqual({})
    expect(loadWeekFeedback('plan-b')).toEqual({ 1: 'fresh' })
  })

  it('stores and reloads workout log entries per plan', () => {
    setWorkoutLogEntry('plan-a', dayKey(1, 1), { rpe: 7, note: 'Hot day, felt hard' })
    setWorkoutLogEntry('plan-a', dayKey(1, 3), { rpe: 4 })
    setWorkoutLogEntry('plan-b', dayKey(1, 1), { note: 'Treadmill' })

    expect(loadWorkoutLog('plan-a')).toEqual({
      'w1-d1': { rpe: 7, note: 'Hot day, felt hard' },
      'w1-d3': { rpe: 4 },
    })
    expect(loadWorkoutLog('plan-b')).toEqual({ 'w1-d1': { note: 'Treadmill' } })
    expect(loadWorkoutLog('missing')).toEqual({})
  })

  it('clamps RPE to 1-10 and trims notes', () => {
    setWorkoutLogEntry('plan-a', dayKey(1, 1), { rpe: 14, note: '  windy  ' })
    setWorkoutLogEntry('plan-a', dayKey(1, 3), { rpe: 0 })

    expect(loadWorkoutLog('plan-a')).toEqual({
      'w1-d1': { rpe: 10, note: 'windy' },
      'w1-d3': { rpe: 1 },
    })
  })

  it('removes a log entry when both fields are cleared', () => {
    setWorkoutLogEntry('plan-a', dayKey(1, 1), { rpe: 6, note: 'ok' })
    const log = setWorkoutLogEntry('plan-a', dayKey(1, 1), { note: '   ' })

    expect(log).toEqual({})
    expect(loadWorkoutLog('plan-a')).toEqual({})
  })

  it('clears workout logs along with plan progress', () => {
    setWorkoutLogEntry('plan-a', dayKey(1, 1), { rpe: 5 })
    setWorkoutLogEntry('plan-b', dayKey(1, 1), { rpe: 8 })

    clearPlanProgress('plan-a')

    expect(loadWorkoutLog('plan-a')).toEqual({})
    expect(loadWorkoutLog('plan-b')).toEqual({ 'w1-d1': { rpe: 8 } })
  })

  it('survives corrupted storage', () => {
    localStorage.setItem('runathon.progress.v1', '{broken')
    expect(loadPlanProgress('plan-a')).toEqual({})

    setWorkoutStatus('plan-a', dayKey(1, 1), 'completed')
    expect(loadPlanProgress('plan-a')).toEqual({ 'w1-d1': 'completed' })
  })
})
