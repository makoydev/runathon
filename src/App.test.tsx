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
})
