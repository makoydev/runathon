import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('disables plan generation when clearing the current pace to zero', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))

    const generateButton = screen.getByRole('button', { name: /generate your personalized training plan/i })
    expect(generateButton).toBeEnabled()

    fireEvent.change(screen.getByLabelText('Current Pace minutes'), { target: { value: '' } })

    expect(screen.getByLabelText('Current Pace minutes')).toHaveValue('0')
    expect(generateButton).toBeDisabled()
  })
})
