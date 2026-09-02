import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import type { TrainingPlan } from '../types';
import { DISTANCE_INFO } from '../types';
import { downloadCalendar } from '../utils/calendarExport';
import { formatPaceInUnit, formatDistanceInUnit } from '../utils/units';
import {
  loadPlanProgress,
  setWorkoutStatus,
  clearPlanProgress,
  loadWeekFeedback,
  setWeekFeedback,
  loadWorkoutLog,
  setWorkoutLogEntry,
  dayKey,
} from '../utils/progressStorage';
import type {
  PlanProgress,
  PlanWeekFeedback,
  PlanWorkoutLog,
  WeekFeedback,
  WorkoutLogEntry,
  WorkoutStatus,
} from '../utils/progressStorage';
import { summarizeProgress } from '../utils/progressSummary';
import { buildShareUrl } from '../utils/planShare';
import { applyWeekAdjustments, nextFeedbackWeek } from '../utils/weekAdjustment';
import { firstOpenWeek, weekCompletion } from '../utils/planView';
import { ProgressSummaryCard } from './ProgressSummaryCard';
import { WeekCheckInCard } from './WeekCheckInCard';
import { WeekOverviewChart } from './plan/WeekOverviewChart';
import { WeekNavigator } from './plan/WeekNavigator';
import { DayCard } from './plan/DayCard';
import { PrintSchedule } from './plan/PrintSchedule';

interface TrainingPlanDisplayProps {
  plan: TrainingPlan;
  planId: string;
  onReset: () => void;
}

const ACTION_BUTTON =
  'px-3 py-1.5 text-sm font-medium rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors print:hidden';

export function TrainingPlanDisplay({ plan, planId, onReset }: TrainingPlanDisplayProps) {
  const [progress, setProgress] = useState<PlanProgress>(() => loadPlanProgress(planId));
  const [feedback, setFeedback] = useState<PlanWeekFeedback>(() => loadWeekFeedback(planId));
  const [log, setLog] = useState<PlanWorkoutLog>(() => loadWorkoutLog(planId));
  // Open on the week the runner is up to, not always week 1.
  const [selectedWeek, setSelectedWeek] = useState<number>(() => firstOpenWeek(plan, loadPlanProgress(planId)));
  const [shareCopied, setShareCopied] = useState(false);
  const info = DISTANCE_INFO[plan.distance];
  const unit = plan.unit ?? 'km';

  // The stored plan stays untouched; check-in feedback derives an adjusted view.
  const effectivePlan = applyWeekAdjustments(plan, feedback, progress);
  const summary = summarizeProgress(effectivePlan, progress);
  const checkInWeek = nextFeedbackWeek(effectivePlan, progress, feedback);
  const totalWeeks = effectivePlan.weeks.length;
  const week = effectivePlan.weeks.find((candidate) => candidate.week === selectedWeek) ?? effectivePlan.weeks[0];
  const completion = weekCompletion(week, progress);

  const goToWeek = (target: number) => {
    setSelectedWeek(Math.min(totalWeeks, Math.max(1, target)));
  };

  const handleStatusToggle = (key: string, status: WorkoutStatus) => {
    // Clicking the active status again clears the mark.
    setProgress(setWorkoutStatus(planId, key, progress[key] === status ? null : status));
  };

  const handleCheckInAnswer = (checkedWeek: number, answer: WeekFeedback) => {
    setFeedback(setWeekFeedback(planId, checkedWeek, answer));
    // The week is wrapped up, so move on to the one it may have adjusted.
    goToWeek(checkedWeek + 1);
  };

  const handleLogChange = (key: string, entry: WorkoutLogEntry) => {
    setLog(setWorkoutLogEntry(planId, key, entry));
  };

  const handleResetProgress = () => {
    clearPlanProgress(planId);
    setProgress({});
    setFeedback({});
    setLog({});
    goToWeek(1);
  };

  // Sharing encodes the plan inputs; the recipient's app regenerates the plan.
  const handleShare = async () => {
    const url = buildShareUrl(plan);
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt('Copy this link to share your plan:', url);
    }
  };

  // Arrow keys page through weeks unless the runner is typing in a field.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToWeek(selectedWeek - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToWeek(selectedWeek + 1);
    }
  };

  const stats: Array<{ label: string; value: string }> = [
    { label: 'Pace', value: `${formatPaceInUnit(plan.currentPace, unit)} → ${formatPaceInUnit(plan.targetPace, unit)}` },
    { label: 'Duration', value: `${info.weeks} weeks` },
    { label: 'Training Days', value: `${plan.trainingDays} days/week` },
  ];
  if (plan.currentWeeklyMileage) {
    stats.push({ label: 'Current Load', value: `${formatDistanceInUnit(plan.currentWeeklyMileage, unit)}/week` });
  }
  if (plan.longestRecentRun) {
    stats.push({ label: 'Longest Recent Run', value: formatDistanceInUnit(plan.longestRecentRun, unit) });
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-violet-500 via-rose-400 to-sky-500 rounded-2xl p-5 sm:p-6 text-white shadow-lg print:bg-none print:bg-white print:text-slate-800 print:border print:border-slate-300 print:shadow-none">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold">{info.name} Training Plan</h2>
            <details className="mt-2 text-sm text-white/85 print:text-slate-600 print:open">
              <summary className="cursor-pointer select-none font-medium print:hidden">Plan notes</summary>
              <p className="mt-2 max-w-2xl">{plan.summary}</p>
            </details>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={handleShare} aria-label="Copy a shareable link to this plan" title="Copies a link that opens this plan for anyone" className={ACTION_BUTTON}>
              {shareCopied ? 'Link Copied!' : 'Share'}
            </button>
            <button onClick={() => downloadCalendar(effectivePlan)} aria-label="Export plan as a calendar file, starting next Monday" title="Downloads an .ics file with the plan starting next Monday" className={ACTION_BUTTON}>
              Export .ics
            </button>
            <button onClick={() => window.print()} aria-label="Print this training plan" className={ACTION_BUTTON}>
              Print
            </button>
            <button onClick={onReset} aria-label="Create a new training plan" className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-white text-violet-600 hover:bg-violet-50 transition-colors print:hidden">
              New Plan
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3 mt-5 pt-4 border-t border-white/20 print:border-slate-200">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <dt className="text-xs uppercase tracking-wide text-white/70 print:text-slate-500">{stat.label}</dt>
              <dd className="text-base sm:text-lg font-bold font-mono break-words">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ProgressSummaryCard summary={summary} unit={unit} onResetProgress={handleResetProgress} />

      {checkInWeek !== null && (
        <WeekCheckInCard week={checkInWeek} onAnswer={(answer) => handleCheckInAnswer(checkInWeek, answer)} />
      )}

      <WeekOverviewChart
        weeks={effectivePlan.weeks}
        progress={progress}
        selectedWeek={week.week}
        unit={unit}
        onSelect={goToWeek}
      />

      <section aria-label="Weekly schedule" onKeyDown={handleKeyDown} className="space-y-4 print:hidden">
        <WeekNavigator
          week={week}
          totalWeeks={totalWeeks}
          completion={completion}
          onPrev={() => goToWeek(week.week - 1)}
          onNext={() => goToWeek(week.week + 1)}
        />
        {week.adjustmentNote && (
          <p className="px-4 py-2 text-sm rounded-lg text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800">
            {week.adjustmentNote}
          </p>
        )}
        <div
          role="region"
          aria-label={`Week ${week.week} schedule`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {week.days.map((day, index) => {
            const key = dayKey(week.week, index);
            return (
              <DayCard
                key={`${week.week}-${day.day}`}
                weekNumber={week.week}
                day={day}
                status={progress[key]}
                logEntry={log[key]}
                onStatusToggle={(status) => handleStatusToggle(key, status)}
                onLogChange={(entry) => handleLogChange(key, entry)}
              />
            );
          })}
        </div>
        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
          Tip: use ← → to move between weeks, or click a bar in the overview.
        </p>
      </section>

      <PrintSchedule plan={effectivePlan} />
    </div>
  );
}
