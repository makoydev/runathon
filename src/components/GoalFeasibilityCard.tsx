import type { GoalFeasibility, FeasibilityRating } from '../utils/goalFeasibility';

interface GoalFeasibilityCardProps {
  feasibility: GoalFeasibility;
}

const RATING_STYLES: Record<FeasibilityRating, { label: string; container: string; badge: string }> = {
  conservative: {
    label: 'Conservative',
    container: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
  },
  moderate: {
    label: 'Moderate',
    container: 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800',
    badge: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300',
  },
  aggressive: {
    label: 'Aggressive',
    container: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
  },
  'high-risk': {
    label: 'High Risk',
    container: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800',
    badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
  },
};

export function GoalFeasibilityCard({ feasibility }: GoalFeasibilityCardProps) {
  const styles = RATING_STYLES[feasibility.rating];
  const isWarning = feasibility.rating === 'aggressive' || feasibility.rating === 'high-risk';

  return (
    <section
      role={isWarning ? 'alert' : 'status'}
      className={`p-5 rounded-xl border shadow-sm space-y-2 ${styles.container}`}
    >
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Goal Check</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles.badge}`}>
          {styles.label}
        </span>
      </div>
      <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
        {feasibility.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </section>
  );
}
