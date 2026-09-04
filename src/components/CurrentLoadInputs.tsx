import type { DistanceUnit } from '../types';
import { InlineNotice } from './InlineNotice';

interface CurrentLoadInputsProps {
  currentWeeklyMileage: number;
  longestRecentRun: number;
  unit?: DistanceUnit;
  // Field-level problems from the plan input check, shown under the field.
  weeklyMileageError?: string;
  longestRunError?: string;
  onCurrentWeeklyMileageChange: (distance: number) => void;
  onLongestRecentRunChange: (distance: number) => void;
}

function parseDistanceInput(value: string, max: number): number {
  const sanitized = value.replace(/[^\d.]/g, '');
  if (sanitized === '') return 0;

  const parsed = Number(sanitized);
  if (!Number.isFinite(parsed)) return 0;

  return Math.max(0, Math.min(max, Math.round(parsed * 10) / 10));
}

export function CurrentLoadInputs({
  currentWeeklyMileage,
  longestRecentRun,
  unit = 'km',
  weeklyMileageError,
  longestRunError,
  onCurrentWeeklyMileageChange,
  onLongestRecentRunChange,
}: CurrentLoadInputsProps) {
  const inputClass = (invalid: boolean) =>
    `w-full px-4 py-3 text-2xl font-mono text-center border rounded-lg focus:ring-2 outline-none bg-white/80 dark:bg-slate-800/80 ${
      invalid
        ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-300 dark:focus:ring-rose-600 focus:border-rose-300 dark:focus:border-rose-600'
        : 'border-slate-200 dark:border-slate-700 focus:ring-violet-300 dark:focus:ring-violet-500 focus:border-violet-300 dark:focus:border-violet-500'
    }`;

  return (
    <section className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Current Training Load</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Used to keep early mileage and long runs close to what you can handle now.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Current weekly mileage</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              value={currentWeeklyMileage.toString()}
              onChange={(event) => onCurrentWeeklyMileageChange(parseDistanceInput(event.target.value, 250))}
              className={inputClass(Boolean(weeklyMileageError))}
              aria-label="Current weekly mileage"
              aria-describedby={weeklyMileageError ? 'current-weekly-mileage-help current-weekly-mileage-error' : 'current-weekly-mileage-help'}
              aria-invalid={Boolean(weeklyMileageError)}
            />
            <span className="text-lg text-slate-500 dark:text-slate-400 font-medium" aria-hidden="true">{unit}/wk</span>
          </div>
          <span id="current-weekly-mileage-help" className="block text-xs text-slate-400 dark:text-slate-500 mt-1">
            Average distance you run in a normal recent week.
          </span>
          {weeklyMileageError && (
            <InlineNotice tone="error" id="current-weekly-mileage-error" className="mt-3">
              {weeklyMileageError}
            </InlineNotice>
          )}
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Longest recent run</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              value={longestRecentRun.toString()}
              onChange={(event) => onLongestRecentRunChange(parseDistanceInput(event.target.value, 100))}
              className={inputClass(Boolean(longestRunError))}
              aria-label="Longest recent run"
              aria-describedby={longestRunError ? 'longest-recent-run-help longest-recent-run-error' : 'longest-recent-run-help'}
              aria-invalid={Boolean(longestRunError)}
            />
            <span className="text-lg text-slate-500 dark:text-slate-400 font-medium" aria-hidden="true">{unit}</span>
          </div>
          <span id="longest-recent-run-help" className="block text-xs text-slate-400 dark:text-slate-500 mt-1">
            Longest single run from the last few weeks.
          </span>
          {longestRunError && (
            <InlineNotice tone="error" id="longest-recent-run-error" className="mt-3">
              {longestRunError}
            </InlineNotice>
          )}
        </label>
      </div>
    </section>
  );
}
