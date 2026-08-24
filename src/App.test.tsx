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
