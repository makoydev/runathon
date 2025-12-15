import type { RaceDistance } from '../types';
import { DISTANCE_INFO } from '../types';

interface DistanceSelectorProps {
  selected: RaceDistance | null;
  onSelect: (distance: RaceDistance) => void;
}

export function DistanceSelector({ selected, onSelect }: DistanceSelectorProps) {
  const distances: RaceDistance[] = ['5k', '10k', 'half', 'full'];

  const cardColors: Record<RaceDistance, { bg: string; border: string; text: string }> = {
    '5k': { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-600' },
    '10k': { bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-600' },
    'half': { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-600' },
    'full': { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-600' },
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-700">Choose Your Race Distance</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {distances.map((distance) => {
          const info = DISTANCE_INFO[distance];
          const isSelected = selected === distance;
          const colors = cardColors[distance];

          return (
            <button
              key={distance}
              onClick={() => onSelect(distance)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? `${colors.border} ${colors.bg} shadow-lg scale-105`
                  : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:shadow-md hover:bg-white'
              }`}
            >
              <div className={`text-2xl font-bold ${isSelected ? colors.text : 'text-slate-700'}`}>
                {info.name}
              </div>
              <div className="text-sm text-slate-500 mt-2">
                {info.km} km / {info.miles} mi
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {info.weeks} week plan
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
