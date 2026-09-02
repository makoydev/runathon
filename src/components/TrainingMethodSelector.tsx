import type { RunWalkRatio, TrainingMethod } from '../types';
import { RUN_WALK_PRESETS, autoRunWalkRatio, ratioShortLabel } from '../utils/runWalk';

export type RunWalkChoice = 'auto' | string;

interface TrainingMethodSelectorProps {
  method: TrainingMethod;
  ratioChoice: RunWalkChoice;
  currentPaceSecondsPerKm: number;
  onMethodChange: (method: TrainingMethod) => void;
  onRatioChange: (choice: RunWalkChoice) => void;
}

const METHODS: Array<{ id: TrainingMethod; name: string; description: string }> = [
  { id: 'continuous', name: 'Continuous running', description: 'Classic easy, tempo, interval, and long-run structure' },
  { id: 'runwalk', name: 'Run-Walk (Galloway)', description: 'Walk breaks from the first minute; long runs every other week' },
];

export function resolveRunWalkRatio(choice: RunWalkChoice, currentPaceSecondsPerKm: number): RunWalkRatio {
  const preset = RUN_WALK_PRESETS.find((candidate) => candidate.id === choice);
  return preset ? preset.ratio : autoRunWalkRatio(currentPaceSecondsPerKm);
}

export function TrainingMethodSelector({
  method,
  ratioChoice,
  currentPaceSecondsPerKm,
  onMethodChange,
  onRatioChange,
}: TrainingMethodSelectorProps) {
  const autoRatio = autoRunWalkRatio(currentPaceSecondsPerKm);
  const options: Array<{ id: RunWalkChoice; label: string }> = [
    { id: 'auto', label: `Auto (${ratioShortLabel(autoRatio)})` },
    ...RUN_WALK_PRESETS.map((preset) => ({ id: preset.id, label: ratioShortLabel(preset.ratio) })),
  ];

  return (
    <section className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
      <div>
        <h2 id="training-method-label" className="text-lg font-semibold text-slate-700 dark:text-slate-200">Training Method</h2>
        <p id="training-method-description" className="text-sm text-slate-500 dark:text-slate-400">
          Run-walk plans follow Jeff Galloway's approach: short midweek sessions, a Magic Mile every third week, and long runs that build toward race distance.
        </p>
      </div>
      <div
        role="group"
        aria-labelledby="training-method-label"
        aria-describedby="training-method-description"
        className="grid sm:grid-cols-2 gap-3"
      >
        {METHODS.map((option) => {
          const selected = option.id === method;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onMethodChange(option.id)}
              aria-pressed={selected}
              aria-label={`Train with ${option.name}`}
              className={`p-4 rounded-lg text-left border transition-colors ${
                selected
                  ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <span className="block font-semibold">{option.name}</span>
              <span className={`block text-xs mt-1 ${selected ? 'text-violet-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      {method === 'runwalk' && (
        <div>
          <p id="run-walk-ratio-label" className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Run / walk ratio
          </p>
          <div role="group" aria-labelledby="run-walk-ratio-label" className="mt-2 flex flex-wrap gap-2">
            {options.map((option) => {
              const selected = option.id === ratioChoice;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onRatioChange(option.id)}
                  aria-pressed={selected}
                  aria-label={`Run-walk ratio ${option.label}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-violet-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/40 hover:text-violet-600 dark:hover:text-violet-300'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Auto picks the ratio Galloway suggests for your current pace. Pick a shorter run segment on hot days or when you are tired.
          </p>
        </div>
      )}
    </section>
  );
}
