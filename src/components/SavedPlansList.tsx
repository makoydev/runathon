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
  if (savedPlans.length === 0) return null;

  return (
    <section className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-700">Saved Plans</h2>
        <p className="text-sm text-slate-500">
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
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-slate-200"
            >
              <div>
                <span className="block font-semibold text-slate-700">{info.name}</span>
                <span className="block text-sm text-slate-500">
                  {formatCreatedAt(saved.createdAt)} · target {targetPace} · {plan.trainingDays} days/week
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onView(saved)}
                  aria-label={`View ${label}`}
                  className="px-4 py-2 text-sm font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => onDelete(saved)}
                  aria-label={`Delete ${label}`}
                  className="px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
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
