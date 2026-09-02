import type { DistanceUnit } from '../types';

interface CurrentLoadInputsProps {
  currentWeeklyMileage: number;
  longestRecentRun: number;
  unit?: DistanceUnit;
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
  onCurrentWeeklyMileageChange,
  onLongestRecentRunChange,
}: CurrentLoadInputsProps) {
  const longestRunExceedsMileage = longestRecentRun > currentWeeklyMileage;

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
              className="w-full px-4 py-3 text-2xl font-mono text-center border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500 focus:border-violet-300 dark:focus:border-violet-500 outline-none bg-white/80 dark:bg-slate-800/80"
              aria-label="Current weekly mileage"
              aria-describedby="current-weekly-mileage-help"
            />
            <span className="text-lg text-slate-500 dark:text-slate-400 font-medium" aria-hidden="true">{unit}/wk</span>
          </div>
          <span id="current-weekly-mileage-help" className="block text-xs text-slate-400 dark:text-slate-500 mt-1">
            Average distance you run in a normal recent week.
          </span>
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
              className="w-full px-4 py-3 text-2xl font-mono text-center border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500 focus:border-violet-300 dark:focus:border-violet-500 outline-none bg-white/80 dark:bg-slate-800/80"
              aria-label="Longest recent run"
              aria-describedby="longest-recent-run-help"
              aria-invalid={longestRunExceedsMileage}
            />
            <span className="text-lg text-slate-500 dark:text-slate-400 font-medium" aria-hidden="true">{unit}</span>
          </div>
          <span id="longest-recent-run-help" className="block text-xs text-slate-400 dark:text-slate-500 mt-1">
            Longest single run from the last few weeks.
          </span>
        </label>
      </div>

      {longestRunExceedsMileage && (
        <p role="alert" className="text-sm text-amber-600 dark:text-amber-300">
          Longest recent run cannot be greater than your current weekly mileage.
        </p>
      )}
    </section>
  );
}
