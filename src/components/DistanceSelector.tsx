import type { RaceDistance } from '../types';
import { DISTANCE_INFO } from '../types';

interface DistanceSelectorProps {
  selected: RaceDistance | null;
  onSelect: (distance: RaceDistance) => void;
}

export function DistanceSelector({ selected, onSelect }: DistanceSelectorProps) {
  const distances: RaceDistance[] = ['5k', '10k', 'half', 'full'];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Choose Your Race Distance</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {distances.map((distance) => {
          const info = DISTANCE_INFO[distance];
          const isSelected = selected === distance;

          return (
            <button
              key={distance}
              onClick={() => onSelect(distance)}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className={`text-2xl font-bold ${isSelected ? 'text-blue-600' : 'text-gray-800'}`}>
                {info.name}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {info.km} km / {info.miles} mi
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {info.weeks} week plan
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
