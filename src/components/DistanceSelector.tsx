import type { RaceDistance } from '../types';
import { DISTANCE_INFO } from '../types';

interface DistanceSelectorProps {
  selected: RaceDistance | null;
  onSelect: (distance: RaceDistance) => void;
}

export function DistanceSelector({ selected, onSelect }: DistanceSelectorProps) {
  const distances: RaceDistance[] = ['5k', '10k', 'half', 'full'];

  const cardColors: Record<RaceDistance, { bg: string; border: string; text: string }> = {
    '5k': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-300 dark:border-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' },
    '10k': { bg: 'bg-sky-50 dark:bg-sky-900/30', border: 'border-sky-300 dark:border-sky-500', text: 'text-sky-600 dark:text-sky-300' },
    'half': { bg: 'bg-violet-50 dark:bg-violet-900/40', border: 'border-violet-300 dark:border-violet-500', text: 'text-violet-600 dark:text-violet-300' },
    'full': { bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-300 dark:border-rose-500', text: 'text-rose-600 dark:text-rose-300' },
  };

  return (
    <div className="space-y-4">
      <h2 id="distance-selector-label" className="text-xl font-semibold text-slate-700 dark:text-slate-200">Choose Your Race Distance</h2>
      <div
        role="group"
        aria-labelledby="distance-selector-label"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {distances.map((distance) => {
          const info = DISTANCE_INFO[distance];
          const isSelected = selected === distance;
          const colors = cardColors[distance];

          return (
            <button
              key={distance}
              onClick={() => onSelect(distance)}
              aria-pressed={isSelected}
              aria-label={`${info.name}, ${info.km} kilometers, ${info.weeks} week plan`}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? `${colors.border} ${colors.bg} shadow-lg scale-105`
                  : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <div className={`text-2xl font-bold ${isSelected ? colors.text : 'text-slate-700 dark:text-slate-200'}`}>
                {info.name}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {info.km} km / {info.miles} mi
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {info.weeks} week plan
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
