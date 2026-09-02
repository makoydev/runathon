import type { TrainingPlan } from '../../types';
import { isTrackable } from '../../utils/planView';

interface PrintScheduleProps {
  plan: TrainingPlan;
}

// The screen shows one week at a time; the printout carries the whole plan.
export function PrintSchedule({ plan }: PrintScheduleProps) {
  return (
    <section aria-hidden="true" className="hidden print:block space-y-4">
      {plan.weeks.map((week) => (
        <table key={week.week} className="w-full text-xs border-collapse break-inside-avoid">
          <caption className="text-left font-semibold text-sm py-1">
            Week {week.week} · {week.phase}
            {week.isCutback ? ' · Cutback' : ''} · {week.totalMileage}
            {week.adjustmentNote ? ` · ${week.adjustmentNote}` : ''}
          </caption>
          <tbody>
            {week.days.map((day) => (
              <tr key={day.day} className="border-t border-slate-300 align-top">
                <td className="py-1 pr-2 w-20 font-medium">{day.day}</td>
                <td className="py-1 pr-2 w-40 font-semibold">{day.workout}</td>
                <td className="py-1 pr-2 w-20 whitespace-nowrap">{isTrackable(day) ? day.distance : ''}</td>
                <td className="py-1 pr-2 w-20 whitespace-nowrap font-mono">{isTrackable(day) ? day.pace : ''}</td>
                <td className="py-1">{day.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </section>
  );
}
