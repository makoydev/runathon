import type { TrainingWeek } from '../../types';
import type { WeekCompletion } from '../../utils/planView';
import { phaseStyle } from '../../utils/planView';

interface WeekNavigatorProps {
  week: TrainingWeek;
  totalWeeks: number;
  completion: WeekCompletion;
  onPrev: () => void;
  onNext: () => void;
}

function ArrowButton({ direction, disabled, onClick }: { direction: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous week' : 'Next week'}
      className="w-10 h-10 shrink-0 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/40 hover:text-violet-600 dark:hover:text-violet-300 disabled:opacity-30 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-colors flex items-center justify-center"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={direction === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

export function WeekNavigator({ week, totalWeeks, completion, onPrev, onNext }: WeekNavigatorProps) {
  const marked = completion.completed + completion.skipped;
  return (
    <div className="flex items-center gap-3">
      <ArrowButton direction="prev" disabled={week.week <= 1} onClick={onPrev} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">
            Week {week.week}
            <span className="ml-1 text-base font-normal text-slate-400 dark:text-slate-500">of {totalWeeks}</span>
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${phaseStyle(week.phase).badge}`}>{week.phase}</span>
          {week.isCutback && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300"
              title="Reduced volume this week so your body absorbs the training"
            >
              Cutback
            </span>
          )}
          {week.adjustmentNote && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
              title={week.adjustmentNote}
            >
              Adjusted
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-600 dark:text-slate-300">{week.totalMileage}</span>
          {completion.total > 0 && (
            <span>
              {' · '}
              {marked === 0
                ? `${completion.total} workouts`
                : `${completion.completed} done, ${completion.skipped} skipped of ${completion.total}`}
            </span>
          )}
        </p>
      </div>
      <ArrowButton direction="next" disabled={week.week >= totalWeeks} onClick={onNext} />
    </div>
  );
}
