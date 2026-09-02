import type { DistanceUnit } from '../types';
import type { PlanOptionStats } from '../utils/planComparison';
import { formatDistanceInUnit } from '../utils/units';

interface PlanComparisonCardProps {
  options: PlanOptionStats[];
  selectedDays: number;
  unit: DistanceUnit;
  onSelect: (trainingDays: number) => void;
}

export function PlanComparisonCard({ options, selectedDays, unit, onSelect }: PlanComparisonCardProps) {
  const rows: Array<{ label: string; value: (option: PlanOptionStats) => string }> = [
    { label: 'Total mileage', value: (o) => formatDistanceInUnit(o.totalMileageKm, unit) },
    { label: 'Quality sessions', value: (o) => `${o.qualityDays}` },
    { label: 'Longest run', value: (o) => formatDistanceInUnit(o.longestRunKm, unit) },
    { label: 'Race-week runs', value: (o) => `${o.raceWeekRunDays} days` },
  ];

  return (
    <section
      aria-label="Training schedule comparison"
      className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"
    >
      <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Compare Schedules</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        The same goal at each training frequency. Pick a column to use that schedule.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr>
              <th scope="col" className="text-left font-medium text-slate-500 dark:text-slate-400 p-2" />
              {options.map((option) => {
                const isSelected = option.trainingDays === selectedDays;
                return (
                  <th key={option.trainingDays} scope="col" className="p-2">
                    <button
                      onClick={() => onSelect(option.trainingDays)}
                      aria-pressed={isSelected}
                      aria-label={`Use the ${option.trainingDays}-day schedule`}
                      className={`w-full px-3 py-2 rounded-lg font-semibold transition-colors ${
                        isSelected
                          ? 'bg-gradient-to-r from-violet-400 to-sky-400 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/40 hover:text-violet-600 dark:hover:text-violet-300'
                      }`}
                    >
                      {option.trainingDays} days
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-slate-100 dark:border-slate-700">
                <th scope="row" className="text-left font-medium text-slate-500 dark:text-slate-400 p-2 whitespace-nowrap">
                  {row.label}
                </th>
                {options.map((option) => (
                  <td
                    key={option.trainingDays}
                    className={`p-2 text-center ${
                      option.trainingDays === selectedDays
                        ? 'font-semibold text-slate-700 dark:text-slate-200'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {row.value(option)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
