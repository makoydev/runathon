import type { RaceDistance, TrainingMethod } from '../types';
import { DISTANCE_INFO, EXTENDED_PLAN_WEEKS, supportsExtendedPlan } from '../types';
import { RUN_WALK_PRESETS, autoRunWalkRatio, ratioShortLabel } from '../utils/runWalk';
import type { PlanLengthChoice, RunWalkChoice } from '../utils/runWalk';

interface TrainingMethodSelectorProps {
  method: TrainingMethod;
  ratioChoice: RunWalkChoice;
  planLength: PlanLengthChoice;
  distance: RaceDistance | null;
  currentPaceSecondsPerKm: number;
  onMethodChange: (method: TrainingMethod) => void;
  onRatioChange: (choice: RunWalkChoice) => void;
  onPlanLengthChange: (choice: PlanLengthChoice) => void;
}

const METHODS: Array<{ id: TrainingMethod; name: string; description: string }> = [
  { id: 'continuous', name: 'Continuous running', description: 'Classic easy, tempo, interval, and long-run structure' },
  { id: 'runwalk', name: 'Run-Walk (Galloway)', description: 'Walk breaks from the first minute; long runs every other week' },
];

export function TrainingMethodSelector({
  method,
  ratioChoice,
  planLength,
  distance,
  currentPaceSecondsPerKm,
  onMethodChange,
  onRatioChange,
  onPlanLengthChange,
}: TrainingMethodSelectorProps) {
  const autoRatio = autoRunWalkRatio(currentPaceSecondsPerKm);
  const extendedAvailable = distance === null || supportsExtendedPlan(distance);
  const lengthOptions: Array<{ id: PlanLengthChoice; label: string; disabled: boolean }> = [
    { id: 'standard', label: distance ? `${DISTANCE_INFO[distance].weeks} weeks` : 'Standard', disabled: false },
    { id: 'extended', label: `${EXTENDED_PLAN_WEEKS} weeks`, disabled: !extendedAvailable },
  ];
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

      {method === 'runwalk' && (
        <div>
          <p id="plan-length-label" className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Plan length
          </p>
          <div role="group" aria-labelledby="plan-length-label" className="mt-2 flex flex-wrap gap-2">
            {lengthOptions.map((option) => {
              const selected = option.id === planLength && !option.disabled;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onPlanLengthChange(option.id)}
                  disabled={option.disabled}
                  aria-pressed={selected}
                  aria-label={`${option.id === 'extended' ? 'Extended' : 'Standard'} plan, ${option.label}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-violet-500 text-white'
                      : option.disabled
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/40 hover:text-violet-600 dark:hover:text-violet-300'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            {extendedAvailable
              ? `The ${EXTENDED_PLAN_WEEKS}-week plan grows the long run more gently and still reaches race distance, with the last long run the same distance from race day.`
              : `The ${EXTENDED_PLAN_WEEKS}-week plan is offered for half and full marathons; shorter races use the standard length.`}
          </p>
        </div>
      )}
    </section>
  );
}
