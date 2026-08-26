import type { DistanceUnit } from '../types';

interface UnitToggleProps {
  unit: DistanceUnit;
  onChange: (unit: DistanceUnit) => void;
}

const OPTIONS: Array<{ value: DistanceUnit; label: string }> = [
  { value: 'km', label: 'Kilometers' },
  { value: 'mi', label: 'Miles' },
];

export function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Distance units"
      className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === unit;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            aria-label={`Use ${option.label.toLowerCase()}`}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              selected
                ? 'bg-violet-500 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {option.value}
          </button>
        );
      })}
    </div>
  );
}
