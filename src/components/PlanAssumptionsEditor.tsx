import type { PlanAssumptions } from '../types';
import { WEEKDAYS } from '../types';
import { maxTrainingDays } from '../utils/planAssumptions';

interface PlanAssumptionsEditorProps {
  assumptions: PlanAssumptions;
  trainingDays: number;
  onChange: (assumptions: PlanAssumptions) => void;
}

export function PlanAssumptionsEditor({ assumptions, trainingDays, onChange }: PlanAssumptionsEditorProps) {
  const availableDays = maxTrainingDays(assumptions);
  const tooFewDays = trainingDays > availableDays;

  const handleLongRunDay = (day: string) => {
    if (assumptions.unavailableDays.includes(day)) return;
    onChange({ ...assumptions, longRunDay: day });
  };

  const toggleUnavailable = (day: string) => {
    const isUnavailable = assumptions.unavailableDays.includes(day);
    const unavailableDays = isUnavailable
      ? assumptions.unavailableDays.filter((other) => other !== day)
      : [...assumptions.unavailableDays, day];

    // Keep the long run off unavailable days: fall back to Saturday, or the
    // first still-available day when Saturday itself is blocked.
    let longRunDay = assumptions.longRunDay;
    if (unavailableDays.includes(longRunDay)) {
      longRunDay = !unavailableDays.includes('Saturday')
        ? 'Saturday'
        : WEEKDAYS.find((weekday) => !unavailableDays.includes(weekday)) ?? 'Saturday';
    }
    onChange({ longRunDay, unavailableDays });
  };

  const chipClass = (selected: boolean, disabled: boolean) => {
    if (disabled) return 'bg-slate-100 text-slate-300 cursor-not-allowed line-through';
    if (selected) return 'bg-gradient-to-r from-violet-400 to-sky-400 text-white';
    return 'bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-600';
  };

  return (
    <section
      aria-label="Schedule preferences"
      className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 p-6 shadow-sm"
    >
      <h3 className="text-xl font-semibold text-slate-700">Schedule Preferences</h3>

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-600">Long run day</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const disabled = assumptions.unavailableDays.includes(day);
            return (
              <button
                key={day}
                onClick={() => handleLongRunDay(day)}
                disabled={disabled}
                aria-pressed={assumptions.longRunDay === day}
                aria-label={`Long run on ${day}`}
                className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${chipClass(
                  assumptions.longRunDay === day,
                  disabled
                )}`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-600">Days you can't run</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const selected = assumptions.unavailableDays.includes(day);
            return (
              <button
                key={day}
                onClick={() => toggleUnavailable(day)}
                aria-pressed={selected}
                aria-label={`${day} unavailable`}
                className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                  selected
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-500'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {tooFewDays && (
        <p role="alert" className="mt-4 text-sm text-amber-600">
          Only {availableDays} days are available, but the plan needs {trainingDays} training days.
          Free up a weekday or reduce your training days.
        </p>
      )}
    </section>
  );
}
