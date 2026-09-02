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

  return (
    <section
      aria-label="Training progress summary"
      className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm print:hidden"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Progress</h3>
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
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Mark workouts as done (✓) or skipped (✗) in the schedule below to track your progress.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Workouts Completed</div>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-200">
                {summary.completedCount} of {summary.totalWorkouts}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Completion Rate</div>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-200">
                {completionPercent}%
                <span className="ml-1 text-sm font-normal text-slate-400 dark:text-slate-500">of marked</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Mileage Completed</div>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-200">
                {formatDistanceInUnit(summary.completedMileageKm, unit)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Longest Run Done</div>
              <div className="text-xl font-bold text-slate-700 dark:text-slate-200">
                {formatDistanceInUnit(summary.longestCompletedRunKm, unit)}
              </div>
            </div>
          </div>
          {summary.nextKeySession && (
            <p className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">Next key session:</span> Week {summary.nextKeySession.week},{' '}
              {summary.nextKeySession.day} — {summary.nextKeySession.workout}
            </p>
          )}
        </>
      )}
    </section>
  );
}
