import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useState } from 'react'
import { PaceInput } from './PaceInput'
import type { Pace } from '../types'

function PaceInputHarness() {
  const [pace, setPace] = useState<Pace>({ minutes: 6, seconds: 30 })

  return (
    <PaceInput
      label="Current Pace"
      description="Your current average pace per kilometer"
      pace={pace}
      onChange={setPace}
    />
  )
}

describe('PaceInput', () => {
  it('treats a cleared input as zero instead of keeping a stale value', () => {
    render(<PaceInputHarness />)

    fireEvent.change(screen.getByLabelText('Current Pace minutes'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Current Pace seconds'), { target: { value: '' } })

    expect(screen.getByLabelText('Current Pace minutes')).toHaveValue('0')
    expect(screen.getByLabelText('Current Pace seconds')).toHaveValue('0')
  })

  it('bounds pace fields to valid minute and second values', () => {
    render(<PaceInputHarness />)

    fireEvent.change(screen.getByLabelText('Current Pace minutes'), { target: { value: '99' } })
    fireEvent.change(screen.getByLabelText('Current Pace seconds'), { target: { value: 'abc75' } })

    expect(screen.getByLabelText('Current Pace minutes')).toHaveValue('59')
    expect(screen.getByLabelText('Current Pace seconds')).toHaveValue('59')
  })
})
