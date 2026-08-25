import { describe, it, expect } from 'vitest'
import { buildCalendarContent, nextMonday } from './calendarExport'
import { generateTrainingPlan } from './planGenerator'

describe('calendarExport', () => {
  const makePlan = () =>
    generateTrainingPlan('5k', { minutes: 6, seconds: 0 }, { minutes: 5, seconds: 30 }, 5, 25, 8)

  describe('nextMonday', () => {
    it('returns the following Monday for a mid-week date', () => {
      // 2026-08-26 is a Wednesday.
      const result = nextMonday(new Date(2026, 7, 26))
      expect(result.getDay()).toBe(1)
      expect(result.getDate()).toBe(31)
    })

    it('returns the next Monday, not today, when called on a Monday', () => {
      // 2026-08-24 is a Monday.
      const result = nextMonday(new Date(2026, 7, 24))
      expect(result.getDay()).toBe(1)
      expect(result.getDate()).toBe(31)
    })
  })

  describe('buildCalendarContent', () => {
    const startDate = new Date(2026, 7, 31) // Monday

    it('produces a valid calendar wrapper', () => {
      const content = buildCalendarContent(makePlan(), startDate)

      expect(content.startsWith('BEGIN:VCALENDAR')).toBe(true)
      expect(content.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
      expect(content).toContain('X-WR-CALNAME:Runathon 5K Plan')
    })

    it('creates one event per non-rest day', () => {
      const plan = makePlan()
      const nonRestDays = plan.weeks
        .flatMap((week) => week.days)
        .filter((day) => day.dayType && day.dayType !== 'rest').length

      const content = buildCalendarContent(plan, startDate)
      const eventCount = (content.match(/BEGIN:VEVENT/g) ?? []).length

      expect(eventCount).toBe(nonRestDays)
    })

    it('anchors week 1 to the start date', () => {
      const content = buildCalendarContent(makePlan(), startDate)
      expect(content).toContain('DTSTART;VALUE=DATE:20260901') // Tuesday of week 1
    })

    it('places race day on the final Sunday', () => {
      const plan = makePlan() // 8 weeks: race Sunday = start + 7*7 + 6 = 2026-10-25
      const content = buildCalendarContent(plan, startDate)

      expect(content).toContain('SUMMARY:RACE DAY - 5K')
      expect(content).toContain('DTSTART;VALUE=DATE:20261025')
    })

    it('escapes commas in event text', () => {
      const content = buildCalendarContent(makePlan(), startDate)
      // Descriptions like "10-15 min easy warmup with a few strides, then..." contain commas.
      expect(content).toContain('\\,')
    })

    it('keeps content lines within the 75-octet limit', () => {
      const content = buildCalendarContent(makePlan(), startDate)
      content.split('\r\n').forEach((line) => {
        expect(line.length).toBeLessThanOrEqual(75)
      })
    })
  })
})
