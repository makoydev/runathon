import type { SavedPlan } from '../utils/planStorage';
import { DISTANCE_INFO } from '../types';
import { formatPaceInUnit } from '../utils/units';

interface SavedPlansListProps {
  savedPlans: SavedPlan[];
  onView: (saved: SavedPlan) => void;
  onDelete: (saved: SavedPlan) => void;
}

function formatCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function SavedPlansList({ savedPlans, onView, onDelete }: SavedPlansListProps) {
  if (savedPlans.length === 0) {
    return (
      <section
        aria-label="No saved plans"
        className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-center"
      >
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No saved plans yet</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every plan you generate is saved on this device and listed here, so you can come back to it later.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Saved Plans</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Plans you generate are saved on this device automatically.
        </p>
      </div>

      <ul className="space-y-2">
        {savedPlans.map((saved) => {
          const { plan } = saved;
          const info = DISTANCE_INFO[plan.distance];
          const targetPace = formatPaceInUnit(plan.targetPace, plan.unit ?? 'km');
          const label = `${info.name} plan from ${formatCreatedAt(saved.createdAt)}`;
          return (
            <li
              key={saved.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div>
                <span className="block font-semibold text-slate-700 dark:text-slate-200">{info.name}</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  {formatCreatedAt(saved.createdAt)} · target {targetPace} · {plan.trainingDays} days/week
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onView(saved)}
                  aria-label={`View ${label}`}
                  className="px-4 py-2 text-sm font-semibold text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 rounded-lg transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => onDelete(saved)}
                  aria-label={`Delete ${label}`}
                  className="px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
