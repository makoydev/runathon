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

  const canGenerate = selectedDistance !== null &&
    (currentPace.minutes > 0 || currentPace.seconds > 0) &&
    (targetPace.minutes > 0 || targetPace.seconds > 0);

  const handleGenerate = () => {
    if (!selectedDistance) return;
    const newPlan = generateTrainingPlan(selectedDistance, currentPace, targetPace);
    setPlan(newPlan);
  };

  const handleReset = () => {
    setPlan(null);
    setSelectedDistance(null);
    setCurrentPace({ minutes: 6, seconds: 0 });
    setTargetPace({ minutes: 5, seconds: 30 });
  };

  if (plan) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <TrainingPlanDisplay plan={plan} onReset={handleReset} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Runathon
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Generate your personalized running training plan
          </p>
        </div>

        <DistanceSelector selected={selectedDistance} onSelect={setSelectedDistance} />

        <div className="grid md:grid-cols-2 gap-6">
          <PaceInput
            label="Current Pace"
            description="Your current average pace per kilometer"
            pace={currentPace}
            onChange={setCurrentPace}
          />
          <PaceInput
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
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Generate Training Plan
          </button>
        </div>

        {!selectedDistance && (
          <p className="text-center text-gray-500 text-sm">
            Select a race distance to get started
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
