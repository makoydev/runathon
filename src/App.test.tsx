import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  it('disables plan generation when clearing the current pace to zero', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))

    const generateButton = screen.getByRole('button', { name: /generate your personalized training plan/i })
    expect(generateButton).toBeEnabled()

    fireEvent.change(screen.getByLabelText('Current Pace minutes'), { target: { value: '' } })

    expect(screen.getByLabelText('Current Pace minutes')).toHaveValue('0')
    expect(generateButton).toBeDisabled()
  })

  it('requires a possible current training load before generating a plan', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))
    fireEvent.change(screen.getByLabelText('Current weekly mileage'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('Longest recent run'), { target: { value: '15' } })

    expect(screen.getByRole('alert')).toHaveTextContent('Longest recent run cannot be greater')
    expect(screen.getByRole('button', { name: /complete the required training details/i })).toBeDisabled()
  })

  it('passes current training load into the generated plan', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /10K, 10 kilometers/i }))
    fireEvent.change(screen.getByLabelText('Current weekly mileage'), { target: { value: '32' } })
    fireEvent.change(screen.getByLabelText('Longest recent run'), { target: { value: '11' } })
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))

    expect(screen.getByText('Current Load')).toBeInTheDocument()
    expect(screen.getByText('32 km/week')).toBeInTheDocument()
    expect(screen.getByText('Longest Recent Run')).toBeInTheDocument()
    expect(screen.getByText('11 km')).toBeInTheDocument()
  })

  it('converts inputs and generates a mile-based plan when miles are selected', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /use miles/i }))

    // 25 km/week converts to 15.5 mi/week.
    expect(screen.getByLabelText('Current weekly mileage')).toHaveValue('15.5')
    expect(screen.getAllByText(/pace per mile/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /10K, 10 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))

    expect(screen.getByText(/per mile/)).toBeInTheDocument()
  })

  it('restores the active plan after a reload', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /10K, 10 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))
    expect(screen.getByText('10K Training Plan')).toBeInTheDocument()

    cleanup()
    render(<App />)

    expect(screen.getByText('10K Training Plan')).toBeInTheDocument()
  })

  it('lists saved plans on the form screen and reopens them', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))
    fireEvent.click(screen.getByRole('button', { name: /create a new training plan/i }))

    expect(screen.getByText('Saved Plans')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^view 5k plan/i }))
    expect(screen.getByText('5K Training Plan')).toBeInTheDocument()
  })

  it('tracks workout completion and shows a progress summary', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))

    expect(screen.getByText(/mark workouts as done/i)).toBeInTheDocument()

    const completeButtons = screen.getAllByRole('button', { name: /mark week 1 .* as completed/i })
    fireEvent.click(completeButtons[0])

    expect(screen.getByText('Workouts Completed')).toBeInTheDocument()
    expect(screen.getByText(/1 of \d+/)).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()

    // Clicking the same button again clears the mark.
    fireEvent.click(screen.getAllByRole('button', { name: /mark week 1 .* as completed/i })[0])
    expect(screen.getByText(/mark workouts as done/i)).toBeInTheDocument()
  })

  it('restores tracked progress after a reload', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /mark week 1 .* as completed/i })[0])

    cleanup()
    render(<App />)

    expect(screen.getByText('Workouts Completed')).toBeInTheDocument()
    expect(screen.getByText(/1 of \d+/)).toBeInTheDocument()
  })

  it('asks for a week check-in after the week is fully marked and adjusts the next week', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))

    expect(screen.queryByText('Week 1 check-in')).not.toBeInTheDocument()

    screen
      .getAllByRole('button', { name: /mark week 1 .* as skipped/i })
      .forEach((button) => fireEvent.click(button))

    expect(screen.getByText('Week 1 check-in')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /week 1 felt: very fatigued/i }))

    // The answer is recorded, the prompt goes away, and week 2 shows as adjusted.
    expect(screen.queryByText('Week 1 check-in')).not.toBeInTheDocument()
    expect(screen.getByText('Adjusted')).toBeInTheDocument()
  })

  it('resetting progress removes adjustments and check-in answers', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))
    screen
      .getAllByRole('button', { name: /mark week 1 .* as skipped/i })
      .forEach((button) => fireEvent.click(button))
    fireEvent.click(screen.getByRole('button', { name: /week 1 felt: very fatigued/i }))

    fireEvent.click(screen.getByRole('button', { name: /reset all tracked progress/i }))

    expect(screen.queryByText('Adjusted')).not.toBeInTheDocument()
    expect(screen.queryByText('Week 1 check-in')).not.toBeInTheDocument()
  })

  it('deletes a saved plan from the list', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))
    fireEvent.click(screen.getByRole('button', { name: /create a new training plan/i }))

    fireEvent.click(screen.getByRole('button', { name: /^delete 5k plan/i }))

    expect(screen.queryByText('Saved Plans')).not.toBeInTheDocument()
    expect(localStorage.getItem('runathon.active-plan-id.v1')).toBeNull()
  })
})
