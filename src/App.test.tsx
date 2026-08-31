import { fireEvent, render, screen, cleanup, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/')
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

  it('records perceived effort and notes for a marked workout', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))

    // Effort and note controls only appear once a workout is marked.
    expect(screen.queryAllByLabelText(/perceived effort for week 1/i)).toHaveLength(0)

    fireEvent.click(screen.getAllByRole('button', { name: /mark week 1 .* as completed/i })[0])

    const rpeSelect = screen.getAllByLabelText(/perceived effort for week 1/i)[0]
    fireEvent.change(rpeSelect, { target: { value: '7' } })
    expect(rpeSelect).toHaveValue('7')

    const noteInput = screen.getAllByLabelText(/notes for week 1/i)[0]
    fireEvent.change(noteInput, { target: { value: 'Hot day, hilly route' } })
    fireEvent.blur(noteInput)

    // Both persist across a reload.
    cleanup()
    render(<App />)
    expect(screen.getAllByLabelText(/perceived effort for week 1/i)[0]).toHaveValue('7')
    expect(screen.getAllByLabelText(/notes for week 1/i)[0]).toHaveValue('Hot day, hilly route')
  })

  it('opens a shared plan link directly on the plan view', () => {
    window.history.replaceState(null, '', '/?d=5k&cp=360&tp=330&td=4&xp=beginner')
    render(<App />)

    expect(screen.getByText('5K Training Plan')).toBeInTheDocument()
    // The query is stripped so a refresh doesn't re-import.
    expect(window.location.search).toBe('')
  })

  it('reuses the saved plan when the same share link is opened twice', () => {
    window.history.replaceState(null, '', '/?d=5k&cp=360&tp=330&td=4')
    render(<App />)
    cleanup()

    window.history.replaceState(null, '', '/?d=5k&cp=360&tp=330&td=4')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /create a new training plan/i }))

    expect(screen.getAllByRole('button', { name: /^view 5k plan/i })).toHaveLength(1)
  })

  it('falls back to the form when a share link is invalid', () => {
    window.history.replaceState(null, '', '/?d=ultra&cp=360&tp=330&td=4')
    render(<App />)

    expect(screen.getByText('Select a race distance to get started')).toBeInTheDocument()
  })

  it('copies a share link for the current plan', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /10K, 10 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy a shareable link/i }))

    await waitFor(() => expect(screen.getByText('Link Copied!')).toBeInTheDocument())
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('d=10k'))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('cp=360'))
  })

  it('compares schedules and applies the chosen training frequency', () => {
    render(<App />)

    // The comparison toggle only appears once the inputs are valid.
    expect(screen.queryByRole('button', { name: /compare 3 to 6 day schedules/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /10K, 10 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: /compare 3 to 6 day schedules/i }))

    expect(screen.getByText('Compare Schedules', { selector: 'h3' })).toBeInTheDocument()
    expect(screen.getByText('Total mileage')).toBeInTheDocument()
    expect(screen.getByText('Longest run')).toBeInTheDocument()

    // The current 5-day selection is highlighted; choosing 3 days updates the form.
    expect(screen.getByRole('button', { name: /use the 5-day schedule/i })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /use the 3-day schedule/i }))
    expect(screen.getByRole('button', { name: /use the 3-day schedule/i })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))
    expect(screen.getByText('3 days/week')).toBeInTheDocument()
  })

  it('applies schedule preferences to the generated plan', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /10K, 10 kilometers/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Long run on Wednesday' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tuesday unavailable' }))
    fireEvent.click(screen.getByRole('button', { name: /generate your personalized training plan/i }))

    // Week 1 is expanded by default; Wednesday holds the long run and Tuesday rests.
    const week1 = screen.getByRole('region', { name: 'Week 1 schedule' })
    const rows = within(week1).getAllByText(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/)
    expect(rows.length).toBe(7)
    expect(within(week1).getByText('Long Zone 2 Run').closest('div')?.textContent).toContain('Wednesday')
    const tuesdayRow = within(week1).getByText('Tuesday').closest('div')
    expect(tuesdayRow?.textContent).toContain('Rest')
  })

  it('moves the long run preference off a day marked unavailable', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Long run on Sunday' }))
    expect(screen.getByRole('button', { name: 'Long run on Sunday' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Sunday unavailable' }))
    expect(screen.getByRole('button', { name: 'Long run on Saturday' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('blocks generation when too many days are unavailable', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /5K, 5 kilometers/i }))
    // Default is 5 training days; block three weekdays to leave only four.
    fireEvent.click(screen.getByRole('button', { name: 'Monday unavailable' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tuesday unavailable' }))
    fireEvent.click(screen.getByRole('button', { name: 'Wednesday unavailable' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Only 4 days are available')
    expect(screen.getByRole('button', { name: /complete the required training details/i })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Wednesday unavailable' }))
    expect(screen.getByRole('button', { name: /generate your personalized training plan/i })).toBeEnabled()
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
