import type { GoalFeasibility, FeasibilityRating } from '../utils/goalFeasibility';

interface GoalFeasibilityCardProps {
  feasibility: GoalFeasibility;
}

const RATING_STYLES: Record<FeasibilityRating, { label: string; container: string; badge: string }> = {
  conservative: {
    label: 'Conservative',
    container: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  moderate: {
    label: 'Moderate',
    container: 'bg-sky-50 border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
  },
  aggressive: {
    label: 'Aggressive',
    container: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
  },
  'high-risk': {
    label: 'High Risk',
    container: 'bg-rose-50 border-rose-200',
    badge: 'bg-rose-100 text-rose-700',
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
        <h2 className="text-base font-semibold text-slate-700">Goal Check</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles.badge}`}>
          {styles.label}
        </span>
      </div>
      <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
        {feasibility.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </section>
  );
}
