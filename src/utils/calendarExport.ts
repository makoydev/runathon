import type { TrainingPlan } from '../types';
import { DISTANCE_INFO } from '../types';

// Training weeks run Monday-Sunday, so plans are anchored to a Monday start.
export function nextMonday(from: Date): Date {
  const date = new Date(from);
  date.setHours(0, 0, 0, 0);
  const daysUntilMonday = ((8 - date.getDay()) % 7) || 7;
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// RFC 5545 requires content lines of at most 75 octets; continuations start with a space.
function foldLine(line: string): string {
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 74) {
    chunks.push(remaining.slice(0, 74));
    remaining = ' ' + remaining.slice(74);
  }
  chunks.push(remaining);
  return chunks.join('\r\n');
}

export function buildCalendarContent(plan: TrainingPlan, startDate: Date): string {
  const info = DISTANCE_INFO[plan.distance];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const stamp = `${formatDateValue(start)}T000000Z`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Runathon//Training Plan//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(`Runathon ${info.name} Plan`)}`,
  ];

  plan.weeks.forEach((week) => {
    week.days.forEach((day, dayIndex) => {
      if (day.dayType === 'rest' || day.dayType === undefined) return;
      const eventDate = addDays(start, (week.week - 1) * 7 + dayIndex);
      const detailParts = [day.description];
      if (day.pace) detailParts.push(`Pace: ${day.pace}`);
      detailParts.push(`Week ${week.week} - ${week.phase}${week.isCutback ? ' (cutback week)' : ''}`);

      lines.push(
        'BEGIN:VEVENT',
        `UID:runathon-week${week.week}-day${dayIndex}-${formatDateValue(eventDate)}@runathon`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${formatDateValue(eventDate)}`,
        `DTEND;VALUE=DATE:${formatDateValue(addDays(eventDate, 1))}`,
        `SUMMARY:${escapeText(day.distance ? `${day.workout} (${day.distance})` : day.workout)}`,
        `DESCRIPTION:${escapeText(detailParts.join('\n'))}`,
        'END:VEVENT'
      );
    });
  });

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function downloadCalendar(plan: TrainingPlan, startDate: Date = nextMonday(new Date())): void {
  const content = buildCalendarContent(plan, startDate);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `runathon-${plan.distance}-plan.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
