import { useState } from 'react';
import { DistanceSelector } from './components/DistanceSelector';
import { PaceInput } from './components/PaceInput';
import { TrainingPlanDisplay } from './components/TrainingPlanDisplay';
import { TrainingDaysSelector } from './components/TrainingDaysSelector';
import { CurrentLoadInputs } from './components/CurrentLoadInputs';
import { ExperienceLevelSelector } from './components/ExperienceLevelSelector';
import { GoalFeasibilityCard } from './components/GoalFeasibilityCard';
import { PlanComparisonCard } from './components/PlanComparisonCard';
import { PlanAssumptionsEditor } from './components/PlanAssumptionsEditor';
import { SavedPlansList } from './components/SavedPlansList';
import { UnitToggle } from './components/UnitToggle';
import { ThemeToggle } from './components/ThemeToggle';
import { TrainingMethodSelector } from './components/TrainingMethodSelector';
import { resolveRunWalkRatio, resolvePlanWeeks } from './utils/runWalk';
import type { RunWalkChoice, PlanLengthChoice } from './utils/runWalk';
import { generateTrainingPlan } from './utils/planGenerator';
import { assessGoalFeasibility } from './utils/goalFeasibility';
import { loadSavedPlans, savePlan, deleteSavedPlan, loadActivePlanId, storeActivePlanId } from './utils/planStorage';
import type { SavedPlan } from './utils/planStorage';
import { clearPlanProgress } from './utils/progressStorage';
import { decodeShareParams, sameInputs } from './utils/planShare';
import { comparePlanOptions } from './utils/planComparison';
import { applyPlanAssumptions, maxTrainingDays, DEFAULT_ASSUMPTIONS } from './utils/planAssumptions';
import { loadUnit, storeUnit, convertPace, unitToKm, kmToUnit } from './utils/units';
import type { RaceDistance, Pace, ExperienceLevel, DistanceUnit, PlanAssumptions, TrainingMethod } from './types';

// Form defaults, expressed in km and converted for display when miles are active.
const DEFAULTS = {
  currentPace: { minutes: 6, seconds: 0 },
  targetPace: { minutes: 5, seconds: 30 },
  currentWeeklyMileage: 25,
  longestRecentRun: 8,
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

// Opening a share link regenerates the plan from the URL's inputs, saves it
// (reusing an identical already-saved plan), and makes it active. The query is
// then stripped so a refresh doesn't re-import.
function importSharedPlan(): void {
  const inputs = decodeShareParams(window.location.search);
  if (!inputs) return;
  const plan = applyPlanAssumptions(
    generateTrainingPlan(
      inputs.distance,
      inputs.currentPace,
      inputs.targetPace,
      inputs.trainingDays,
      inputs.currentWeeklyMileage ?? 0,
      inputs.longestRecentRun ?? 0,
      inputs.experienceLevel,
      inputs.unit,
      inputs.runWalk ?? null,
      inputs.planWeeks
    ),
    inputs.assumptions
  );
  const existing = loadSavedPlans().find((saved) => sameInputs(saved.plan, plan));
  const record = existing ?? savePlan(plan);
  storeActivePlanId(record.id);
  window.history.replaceState(null, '', window.location.pathname);
}

function App() {
  const [unit, setUnit] = useState<DistanceUnit>(loadUnit);
  const [selectedDistance, setSelectedDistance] = useState<RaceDistance | null>(null);
  const [currentPace, setCurrentPace] = useState<Pace>(() => convertPace(DEFAULTS.currentPace, 'km', loadUnit()));
  const [targetPace, setTargetPace] = useState<Pace>(() => convertPace(DEFAULTS.targetPace, 'km', loadUnit()));
  const [currentWeeklyMileage, setCurrentWeeklyMileage] = useState<number>(() =>
    round1(kmToUnit(DEFAULTS.currentWeeklyMileage, loadUnit())));
  const [longestRecentRun, setLongestRecentRun] = useState<number>(() =>
    round1(kmToUnit(DEFAULTS.longestRecentRun, loadUnit())));
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');
  const [trainingDays, setTrainingDays] = useState<number>(5);
  const [showComparison, setShowComparison] = useState(false);
  const [assumptions, setAssumptions] = useState<PlanAssumptions>(DEFAULT_ASSUMPTIONS);
  const [method, setMethod] = useState<TrainingMethod>('continuous');
  const [runWalkChoice, setRunWalkChoice] = useState<RunWalkChoice>('auto');
  const [planLength, setPlanLength] = useState<PlanLengthChoice>('standard');
  // The share-link import runs inside this initializer so the saved list and
  // the active-plan initializer below both see its result on first render.
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
    importSharedPlan();
    return loadSavedPlans();
  });
  // Progress tracking is keyed by the saved plan's id, so keep the full saved record active.
  const [activePlan, setActivePlan] = useState<SavedPlan | null>(() => {
    const activeId = loadActivePlanId();
    if (!activeId) return null;
    return loadSavedPlans().find((saved) => saved.id === activeId) ?? null;
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

  const hasValidSchedule = trainingDays <= maxTrainingDays(assumptions);

  const canGenerate = selectedDistance !== null && hasValidPaces && hasValidTrainingLoad && hasValidSchedule;

  // Inputs are edited in the display unit; convert to canonical km at this boundary.
  const currentPaceKm = convertPace(currentPace, unit, 'km');
  const targetPaceKm = convertPace(targetPace, unit, 'km');
  const weeklyMileageKm = unitToKm(currentWeeklyMileage, unit);
  const longestRunKm = unitToKm(longestRecentRun, unit);
  const currentPaceSeconds = currentPaceKm.minutes * 60 + currentPaceKm.seconds;
  const runWalk = method === 'runwalk' ? resolveRunWalkRatio(runWalkChoice, currentPaceSeconds) : null;
  const planWeeks = resolvePlanWeeks(planLength, method, selectedDistance);

  const feasibility = canGenerate
    ? assessGoalFeasibility(selectedDistance, currentPaceKm, targetPaceKm, weeklyMileageKm, longestRunKm, unit, planWeeks)
    : null;

  const comparisonOptions = showComparison && canGenerate
    ? comparePlanOptions(selectedDistance, currentPaceKm, targetPaceKm, weeklyMileageKm, longestRunKm, experienceLevel, unit, runWalk, planWeeks)
    : null;

  const handleUnitChange = (nextUnit: DistanceUnit) => {
    if (nextUnit === unit) return;
    setCurrentPace(convertPace(currentPace, unit, nextUnit));
    setTargetPace(convertPace(targetPace, unit, nextUnit));
    setCurrentWeeklyMileage(round1(kmToUnit(unitToKm(currentWeeklyMileage, unit), nextUnit)));
    setLongestRecentRun(round1(kmToUnit(unitToKm(longestRecentRun, unit), nextUnit)));
    setUnit(nextUnit);
    storeUnit(nextUnit);
  };

  const handleGenerate = () => {
    if (!selectedDistance || !canGenerate) return;
    const newPlan = applyPlanAssumptions(
      generateTrainingPlan(
        selectedDistance,
        currentPaceKm,
        targetPaceKm,
        trainingDays,
        weeklyMileageKm,
        longestRunKm,
        experienceLevel,
        unit,
        runWalk,
        planWeeks
      ),
      assumptions
    );
    const saved = savePlan(newPlan);
    storeActivePlanId(saved.id);
    setSavedPlans(loadSavedPlans());
    setActivePlan(saved);
  };

  const handleViewSaved = (saved: SavedPlan) => {
    storeActivePlanId(saved.id);
    setActivePlan(saved);
  };

  const handleDeleteSaved = (saved: SavedPlan) => {
    setSavedPlans(deleteSavedPlan(saved.id));
    clearPlanProgress(saved.id);
    if (loadActivePlanId() === saved.id) {
      storeActivePlanId(null);
    }
  };

  const handleReset = () => {
    storeActivePlanId(null);
    setActivePlan(null);
    setSelectedDistance(null);
    setCurrentPace(convertPace(DEFAULTS.currentPace, 'km', unit));
    setTargetPace(convertPace(DEFAULTS.targetPace, 'km', unit));
    setCurrentWeeklyMileage(round1(kmToUnit(DEFAULTS.currentWeeklyMileage, unit)));
    setLongestRecentRun(round1(kmToUnit(DEFAULTS.longestRecentRun, unit)));
    setExperienceLevel('intermediate');
    setTrainingDays(5);
    setAssumptions(DEFAULT_ASSUMPTIONS);
    setMethod('continuous');
    setRunWalkChoice('auto');
    setPlanLength('standard');
  };

  if (activePlan) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-rose-50 via-sky-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 px-4 print:bg-none print:bg-white">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex justify-end print:hidden">
            <ThemeToggle />
          </div>
          {/* Keyed by plan id so switching plans reloads that plan's tracked progress. */}
          <TrainingPlanDisplay
            key={activePlan.id}
            plan={activePlan.plan}
            planId={activePlan.id}
            onReset={handleReset}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-sky-50 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
            Runathon
          </h1>
          <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
            Generate your personalized running training plan
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <UnitToggle unit={unit} onChange={handleUnitChange} />
            <ThemeToggle />
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="space-y-6 min-w-0">
            <DistanceSelector selected={selectedDistance} onSelect={setSelectedDistance} />

            <div className="grid md:grid-cols-2 gap-6">
              <PaceInput
                label="Current Pace"
                description={`Your current average pace per ${unit === 'mi' ? 'mile' : 'kilometer'}`}
                pace={currentPace}
                onChange={setCurrentPace}
              />
              <PaceInput
                label="Target Pace"
                description={`Your goal pace per ${unit === 'mi' ? 'mile' : 'kilometer'} for race day`}
                pace={targetPace}
                onChange={setTargetPace}
              />
            </div>

            <CurrentLoadInputs
              currentWeeklyMileage={currentWeeklyMileage}
              longestRecentRun={longestRecentRun}
              unit={unit}
              onCurrentWeeklyMileageChange={setCurrentWeeklyMileage}
              onLongestRecentRunChange={setLongestRecentRun}
            />

            <ExperienceLevelSelector experienceLevel={experienceLevel} onChange={setExperienceLevel} />

            <TrainingMethodSelector
              method={method}
              ratioChoice={runWalkChoice}
              planLength={planLength}
              distance={selectedDistance}
              currentPaceSecondsPerKm={currentPaceSeconds}
              onMethodChange={setMethod}
              onRatioChange={setRunWalkChoice}
              onPlanLengthChange={setPlanLength}
            />

            <TrainingDaysSelector trainingDays={trainingDays} onChange={setTrainingDays} />

            <PlanAssumptionsEditor
              assumptions={assumptions}
              trainingDays={trainingDays}
              onChange={setAssumptions}
            />

            {canGenerate && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  aria-expanded={showComparison}
                  aria-label={showComparison ? 'Hide the schedule comparison' : 'Compare 3 to 6 day schedules side by side'}
                  className="px-4 py-2 text-sm text-violet-600 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/40 rounded-lg transition-colors font-medium"
                >
                  {showComparison ? 'Hide Comparison' : 'Compare Schedules'}
                </button>
              </div>
            )}

            {comparisonOptions && (
              <PlanComparisonCard
                options={comparisonOptions}
                selectedDays={trainingDays}
                unit={unit}
                onSelect={setTrainingDays}
              />
            )}
          </div>

          {/* Sticky on large screens so the goal check and generate button stay in view while editing. */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            {feasibility && <GoalFeasibilityCard feasibility={feasibility} />}

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              aria-disabled={!canGenerate}
              aria-label={canGenerate ? 'Generate your personalized training plan' : 'Complete the required training details to generate a plan'}
              className={`w-full px-6 py-4 text-lg font-semibold rounded-xl transition-all duration-200 ${
                canGenerate
                  ? 'bg-gradient-to-r from-violet-400 to-sky-400 hover:from-violet-500 hover:to-sky-500 text-white shadow-lg hover:shadow-xl'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              Generate Training Plan
            </button>

            {hasValidPaces && targetNotFaster && (
              <p role="alert" className="text-center text-amber-600 dark:text-amber-300 text-sm">
                Target pace is not faster than your current pace. The plan will focus on maintenance unless you set a quicker goal.
              </p>
            )}

            {!selectedDistance && (
              <p role="status" className="text-center text-slate-400 dark:text-slate-500 text-sm">
                Select a race distance to get started
              </p>
            )}

            <SavedPlansList savedPlans={savedPlans} onView={handleViewSaved} onDelete={handleDeleteSaved} />
          </aside>
        </div>
      </div>
    </main>
  );
}

export default App;
