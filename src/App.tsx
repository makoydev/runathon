import { useState } from 'react';
import { DistanceSelector } from './components/DistanceSelector';
import { PaceInput } from './components/PaceInput';
import { TrainingPlanDisplay } from './components/TrainingPlanDisplay';
import { generateTrainingPlan } from './utils/planGenerator';
import type { RaceDistance, Pace, TrainingPlan } from './types';

function App() {
  const [selectedDistance, setSelectedDistance] = useState<RaceDistance | null>(null);
  const [currentPace, setCurrentPace] = useState<Pace>({ minutes: 6, seconds: 0 });
  const [targetPace, setTargetPace] = useState<Pace>({ minutes: 5, seconds: 30 });
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [formVersion, setFormVersion] = useState(0);

  const hasValidPaces =
    (currentPace.minutes > 0 || currentPace.seconds > 0) &&
    (targetPace.minutes > 0 || targetPace.seconds > 0);
  const currentSeconds = currentPace.minutes * 60 + currentPace.seconds;
  const targetSeconds = targetPace.minutes * 60 + targetPace.seconds;
  const targetNotFaster = targetSeconds >= currentSeconds;

  const canGenerate = selectedDistance !== null && hasValidPaces;

  const handleGenerate = () => {
    if (!selectedDistance || !hasValidPaces) return;
    const newPlan = generateTrainingPlan(selectedDistance, currentPace, targetPace);
    setPlan(newPlan);
  };

  const handleReset = () => {
    setPlan(null);
    setSelectedDistance(null);
    setCurrentPace({ minutes: 6, seconds: 0 });
    setTargetPace({ minutes: 5, seconds: 30 });
    setFormVersion((version) => version + 1);
  };

  if (plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-sky-50 to-violet-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <TrainingPlanDisplay plan={plan} onReset={handleReset} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-sky-50 to-violet-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
            Runathon
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            Generate your personalized running training plan
          </p>
        </div>

        <DistanceSelector selected={selectedDistance} onSelect={setSelectedDistance} />

        <div className="grid md:grid-cols-2 gap-6">
          <PaceInput
            key={`current-${formVersion}`}
            label="Current Pace"
            description="Your current average pace per kilometer"
            pace={currentPace}
            onChange={setCurrentPace}
          />
          <PaceInput
            key={`target-${formVersion}`}
            label="Target Pace"
            description="Your goal pace for race day"
            pace={targetPace}
            onChange={setTargetPace}
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200 ${
              canGenerate
                ? 'bg-gradient-to-r from-violet-400 to-sky-400 hover:from-violet-500 hover:to-sky-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Generate Training Plan
          </button>
        </div>

        {hasValidPaces && targetNotFaster && (
          <p className="text-center text-amber-600 text-sm">
            Target pace is not faster than your current pace. The plan will focus on maintenance unless you set a quicker goal.
          </p>
        )}

        {!selectedDistance && (
          <p className="text-center text-slate-400 text-sm">
            Select a race distance to get started
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
