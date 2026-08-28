import type { WorkoutLogEntry } from '../utils/progressStorage';
import { MIN_RPE, MAX_RPE } from '../utils/progressStorage';

interface WorkoutLogControlsProps {
  label: string; // e.g. "week 1 Tuesday Interval Training"
  entry: WorkoutLogEntry | undefined;
  onChange: (entry: WorkoutLogEntry) => void;
}

const RPE_HINTS: Record<number, string> = {
  1: 'very easy',
  3: 'easy',
  5: 'moderate',
  7: 'hard',
  10: 'max effort',
};

function rpeLabel(value: number): string {
  return RPE_HINTS[value] ? `${value} - ${RPE_HINTS[value]}` : `${value}`;
}

export function WorkoutLogControls({ label, entry, onChange }: WorkoutLogControlsProps) {
  const rpeValues = Array.from({ length: MAX_RPE - MIN_RPE + 1 }, (_, i) => MIN_RPE + i);

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-2 md:ml-[96px] print:hidden">
      <label className="flex items-center gap-2 text-sm text-slate-500">
        Effort
        <select
          value={entry?.rpe ?? ''}
          onChange={(e) =>
            onChange({ ...entry, rpe: e.target.value === '' ? undefined : Number(e.target.value) })
          }
          aria-label={`Perceived effort for ${label}`}
          className="px-2 py-1 rounded-lg border border-slate-200 bg-white/70 text-slate-600"
        >
          <option value="">RPE</option>
          {rpeValues.map((value) => (
            <option key={value} value={value}>
              {rpeLabel(value)}
            </option>
          ))}
        </select>
      </label>
      {/* Uncontrolled with commit-on-blur: storage trims notes, so a controlled
          input would strip the space the user just typed between words. */}
      <input
        type="text"
        defaultValue={entry?.note ?? ''}
        onBlur={(e) => {
          if ((e.target.value.trim() || undefined) !== entry?.note) {
            onChange({ ...entry, note: e.target.value });
          }
        }}
        placeholder="Notes - terrain, weather, how it felt"
        aria-label={`Notes for ${label}`}
        maxLength={200}
        className="flex-1 px-3 py-1 text-sm rounded-lg border border-slate-200 bg-white/70 text-slate-600 placeholder:text-slate-400"
      />
    </div>
  );
}
