import { useState } from 'react';
import { DistanceSelector } from './components/DistanceSelector';
import { PaceInput } from './components/PaceInput';
import { TrainingPlanDisplay } from './components/TrainingPlanDisplay';
import { TrainingDaysSelector } from './components/TrainingDaysSelector';
import { CurrentLoadInputs } from './components/CurrentLoadInputs';
import { ExperienceLevelSelector } from './components/ExperienceLevelSelector';
import { GoalFeasibilityCard } from './components/GoalFeasibilityCard';
import { SavedPlansList } from './components/SavedPlansList';
import { generateTrainingPlan } from './utils/planGenerator';
import { assessGoalFeasibility } from './utils/goalFeasibility';
import { loadSavedPlans, savePlan, deleteSavedPlan, loadActivePlanId, storeActivePlanId } from './utils/planStorage';
import type { SavedPlan } from './utils/planStorage';
import type { RaceDistance, Pace, TrainingPlan, ExperienceLevel } from './types';

function App() {
  const [selectedDistance, setSelectedDistance] = useState<RaceDistance | null>(null);
  const [currentPace, setCurrentPace] = useState<Pace>({ minutes: 6, seconds: 0 });
  const [targetPace, setTargetPace] = useState<Pace>({ minutes: 5, seconds: 30 });
  const [currentWeeklyMileage, setCurrentWeeklyMileage] = useState<number>(25);
  const [longestRecentRun, setLongestRecentRun] = useState<number>(8);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');
  const [trainingDays, setTrainingDays] = useState<number>(5);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(loadSavedPlans);
  const [plan, setPlan] = useState<TrainingPlan | null>(() => {
    const activeId = loadActivePlanId();
    if (!activeId) return null;
    return loadSavedPlans().find((saved) => saved.id === activeId)?.plan ?? null;
  });

  const hasValidPaces =
    (currentPace.minutes > 0 || currentPace.seconds > 0) &&
    (targetPace.minutes > 0 || targetPace.seconds > 0);
  const currentSeconds = currentPace.minutes * 60 + currentPace.seconds;
  const targetSeconds = targetPace.minutes * 60 + targetPace.seconds;
  const targetNotFaster = targetSeconds >= currentSeconds;
  const hasValidTrainingLoad =
    currentWeeklyMileage > 0 &&
    longestRecentRun > 0 &&
    longestRecentRun <= currentWeeklyMileage;

  const canGenerate = selectedDistance !== null && hasValidPaces && hasValidTrainingLoad;

  const feasibility = canGenerate
    ? assessGoalFeasibility(selectedDistance, currentPace, targetPace, currentWeeklyMileage, longestRecentRun)
    : null;

  const handleGenerate = () => {
    if (!selectedDistance || !hasValidPaces || !hasValidTrainingLoad) return;
    const newPlan = generateTrainingPlan(
      selectedDistance,
      currentPace,
      targetPace,
      trainingDays,
      currentWeeklyMileage,
      longestRecentRun,
      experienceLevel
    );
    const saved = savePlan(newPlan);
    storeActivePlanId(saved.id);
    setSavedPlans(loadSavedPlans());
    setPlan(newPlan);
  };

  const handleViewSaved = (saved: SavedPlan) => {
    storeActivePlanId(saved.id);
    setPlan(saved.plan);
  };

  const handleDeleteSaved = (saved: SavedPlan) => {
    setSavedPlans(deleteSavedPlan(saved.id));
    if (loadActivePlanId() === saved.id) {
      storeActivePlanId(null);
    }
  };

  const handleReset = () => {
    storeActivePlanId(null);
    setPlan(null);
    setSelectedDistance(null);
    setCurrentPace({ minutes: 6, seconds: 0 });
    setTargetPace({ minutes: 5, seconds: 30 });
    setCurrentWeeklyMileage(25);
    setLongestRecentRun(8);
    setExperienceLevel('intermediate');
    setTrainingDays(5);
  };

  if (plan) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-rose-50 via-sky-50 to-violet-50 py-8 px-4 print:bg-none print:bg-white">
        <div className="max-w-4xl mx-auto">
          <TrainingPlanDisplay plan={plan} onReset={handleReset} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-sky-50 to-violet-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
            Runathon
          </h1>
          <p className="mt-2 text-lg text-slate-500">
            Generate your personalized running training plan
          </p>
        </header>

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

        <CurrentLoadInputs
          currentWeeklyMileage={currentWeeklyMileage}
          longestRecentRun={longestRecentRun}
          onCurrentWeeklyMileageChange={setCurrentWeeklyMileage}
          onLongestRecentRunChange={setLongestRecentRun}
        />

        <ExperienceLevelSelector experienceLevel={experienceLevel} onChange={setExperienceLevel} />

        <TrainingDaysSelector trainingDays={trainingDays} onChange={setTrainingDays} />

        {feasibility && <GoalFeasibilityCard feasibility={feasibility} />}

        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            aria-disabled={!canGenerate}
            aria-label={canGenerate ? 'Generate your personalized training plan' : 'Complete the required training details to generate a plan'}
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
          <p role="alert" className="text-center text-amber-600 text-sm">
            Target pace is not faster than your current pace. The plan will focus on maintenance unless you set a quicker goal.
          </p>
        )}

        {!selectedDistance && (
          <p role="status" className="text-center text-slate-400 text-sm">
            Select a race distance to get started
          </p>
        )}

        <SavedPlansList savedPlans={savedPlans} onView={handleViewSaved} onDelete={handleDeleteSaved} />
      </div>
    </main>
  );
}

export default App;
