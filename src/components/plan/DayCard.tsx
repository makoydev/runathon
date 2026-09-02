import type { TrainingDay } from '../../types';
import type { WorkoutLogEntry, WorkoutStatus } from '../../utils/progressStorage';
import { dayTypeStyle, isTrackable } from '../../utils/planView';
import { WorkoutLogControls } from '../WorkoutLogControls';

interface DayCardProps {
  weekNumber: number;
  day: TrainingDay;
  status: WorkoutStatus | undefined;
  logEntry: WorkoutLogEntry | undefined;
  onStatusToggle: (status: WorkoutStatus) => void;
  onLogChange: (entry: WorkoutLogEntry) => void;
}

export function DayCard({ weekNumber, day, status, logEntry, onStatusToggle, onLogChange }: DayCardProps) {
  const trackable = isTrackable(day);
  const style = dayTypeStyle(day);
  const isRace = day.workout.includes('RACE DAY');
  const isRest = !trackable;

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${style.accent} p-4 shadow-sm transition-opacity ${
        isRace
          ? 'col-span-full bg-gradient-to-r from-violet-50 to-rose-50 dark:from-violet-900/40 dark:to-rose-900/40'
          : isRest
            ? 'bg-slate-50/70 dark:bg-slate-800/40'
            : 'bg-white/80 dark:bg-slate-800/80'
      } ${status === 'skipped' ? 'opacity-60' : ''}`}
    >
      <header className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{day.day}</span>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${style.chip}`}>
          {status === 'completed' ? 'Done' : status === 'skipped' ? 'Skipped' : style.label}
        </span>
      </header>

      <h4
        className={`font-semibold leading-snug ${
          isRace ? 'text-lg text-violet-700 dark:text-violet-300' : isRest ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'
        } ${status === 'skipped' ? 'line-through' : ''}`}
      >
        {day.workout}
      </h4>

      {trackable && (day.distance || day.pace) && (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {day.distance && (
            <span className={`font-bold ${isRest ? 'text-base text-slate-400 dark:text-slate-500' : 'text-2xl text-slate-800 dark:text-slate-100'}`}>
              {day.distance}
            </span>
          )}
          {day.pace && (
            <span className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-sm font-mono">
              {day.pace}
            </span>
          )}
        </div>
      )}

      <p className={`text-sm ${isRest ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>{day.description}</p>

      {trackable && (
        <div className="mt-auto pt-2 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={() => onStatusToggle('completed')}
            aria-pressed={status === 'completed'}
            aria-label={`Mark week ${weekNumber} ${day.day} ${day.workout} as completed`}
            title={status === 'completed' ? 'Unmark as completed' : 'Mark as completed'}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === 'completed'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
          >
            ✓ Done
          </button>
          <button
            type="button"
            onClick={() => onStatusToggle('skipped')}
            aria-pressed={status === 'skipped'}
            aria-label={`Mark week ${weekNumber} ${day.day} ${day.workout} as skipped`}
            title={status === 'skipped' ? 'Unmark as skipped' : 'Mark as skipped'}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === 'skipped'
                ? 'bg-slate-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            ✗ Skip
          </button>
        </div>
      )}

      {status !== undefined && (
        <WorkoutLogControls
          label={`week ${weekNumber} ${day.day} ${day.workout}`}
          entry={logEntry}
          onChange={onLogChange}
        />
      )}
    </div>
  );
}
