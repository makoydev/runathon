import type { DistanceUnit, TrainingWeek } from '../../types';
import type { PlanProgress } from '../../utils/progressStorage';
import { formatDistanceInUnit } from '../../utils/units';
import { phaseSpans, phaseStyle, weekCompletion, weekKeyRunKm, weekTotalKm } from '../../utils/planView';

interface WeekOverviewChartProps {
  weeks: TrainingWeek[];
  progress: PlanProgress;
  selectedWeek: number;
  unit: DistanceUnit;
  onSelect: (week: number) => void;
}

// One bar per week: total volume, with the long run (or the race) as the
// darker lower segment. Bars are buttons, so the chart doubles as the week
// picker and is reachable by keyboard.
export function WeekOverviewChart({ weeks, progress, selectedWeek, unit, onSelect }: WeekOverviewChartProps) {
  const maxKm = Math.max(1, ...weeks.map(weekTotalKm));
  const spans = phaseSpans(weeks);

  return (
    <section
      aria-label="Plan overview"
      className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-sm print:hidden"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Plan at a glance</h3>
        <ul className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-violet-600 dark:bg-violet-400" aria-hidden="true" />
            Long run / race
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-violet-200 dark:bg-violet-800" aria-hidden="true" />
            Other running
          </li>
        </ul>
      </div>

      <div role="group" aria-label="Select a week" className="mt-4 flex items-end gap-1 h-32">
        {weeks.map((week) => {
          const total = weekTotalKm(week);
          const keyRun = weekKeyRunKm(week);
          const selected = week.week === selectedWeek;
          const { total: trackable, completed, skipped } = weekCompletion(week, progress);
          const done = trackable > 0 && completed + skipped === trackable;
          const details = [
            `Week ${week.week}`,
            week.phase,
            week.isCutback ? 'cutback' : null,
            `${formatDistanceInUnit(total, unit)} total`,
            `${formatDistanceInUnit(keyRun, unit)} long run`,
            trackable > 0 ? `${completed} of ${trackable} done` : null,
          ].filter(Boolean).join(', ');
          return (
            <button
              key={week.week}
              type="button"
              onClick={() => onSelect(week.week)}
              aria-pressed={selected}
              aria-label={details}
              title={details}
              className="group flex-1 min-w-0 h-full flex flex-col justify-end rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <span
                className={`relative block w-full rounded-t-[4px] transition-colors ${
                  selected
                    ? 'bg-violet-300 dark:bg-violet-700'
                    : 'bg-violet-200 dark:bg-violet-800 group-hover:bg-violet-300 dark:group-hover:bg-violet-700'
                }`}
                style={{ height: `${Math.max(4, (total / maxKm) * 100)}%` }}
              >
                <span
                  className={`absolute bottom-0 left-0 right-0 rounded-t-[4px] ${
                    selected ? 'bg-violet-700 dark:bg-violet-300' : 'bg-violet-600 dark:bg-violet-400'
                  }`}
                  style={{ height: `${total > 0 ? (keyRun / total) * 100 : 0}%` }}
                />
              </span>
              <span
                className={`mt-1 block text-[11px] leading-none tabular-nums ${
                  selected ? 'font-bold text-violet-700 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {week.week}
              </span>
              <span className="block h-2 text-[10px] leading-none text-emerald-600 dark:text-emerald-400" aria-hidden="true">
                {done ? '•' : ''}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex gap-1" aria-label="Training phases">
        {spans.map((span) => (
          <div key={span.phase} className="min-w-0" style={{ flex: span.count }}>
            <div className={`h-1 rounded-full ${phaseStyle(span.phase).band}`} />
            <div className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">{span.phase}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
