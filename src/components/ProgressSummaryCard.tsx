import type { DistanceUnit } from '../types';
import type { ProgressSummary } from '../utils/progressSummary';
import { formatDistanceInUnit } from '../utils/units';

interface ProgressSummaryCardProps {
  summary: ProgressSummary;
  unit: DistanceUnit;
  onResetProgress: () => void;
}

export function ProgressSummaryCard({ summary, unit, onResetProgress }: ProgressSummaryCardProps) {
  const markedCount = summary.completedCount + summary.skippedCount;
  const completionPercent = Math.round(summary.completionRate * 100);
  const completedShare = summary.totalWorkouts > 0 ? (summary.completedCount / summary.totalWorkouts) * 100 : 0;
  const skippedShare = summary.totalWorkouts > 0 ? (summary.skippedCount / summary.totalWorkouts) * 100 : 0;

  return (
    <section
      aria-label="Training progress summary"
      className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 shadow-sm print:hidden"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Progress</h3>
        {markedCount > 0 && (
          <button
            onClick={onResetProgress}
            aria-label="Reset all tracked progress for this plan"
            className="px-3 py-1 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Reset Progress
          </button>
        )}
      </div>

      {markedCount === 0 ? (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Mark workouts as done or skipped on each day card to track your progress. The plan opens on the week you are up to.
        </p>
      ) : (
        <>
          <div
            role="progressbar"
            aria-label="Workouts marked"
            aria-valuemin={0}
            aria-valuemax={summary.totalWorkouts}
            aria-valuenow={markedCount}
            className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex"
          >
            <div className="h-full bg-emerald-500" style={{ width: `${completedShare}%` }} />
            <div className="h-full bg-slate-400 dark:bg-slate-500" style={{ width: `${skippedShare}%` }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Workouts Completed</div>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {summary.completedCount} of {summary.totalWorkouts}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Completion Rate</div>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {completionPercent}%
                <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">of marked</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Mileage Completed</div>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {formatDistanceInUnit(summary.completedMileageKm, unit)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Longest Run Done</div>
              <div className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {formatDistanceInUnit(summary.longestCompletedRunKm, unit)}
              </div>
            </div>
          </div>
          {summary.nextKeySession && (
            <p className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">Next key session:</span> Week {summary.nextKeySession.week},{' '}
              {summary.nextKeySession.day} — {summary.nextKeySession.workout}
            </p>
          )}
        </>
      )}
    </section>
  );
}
