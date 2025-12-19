import type { TrainingPlan, TrainingWeek } from '../types';
import { DISTANCE_INFO } from '../types';
import { useState } from 'react';

interface TrainingPlanDisplayProps {
  plan: TrainingPlan;
  onReset: () => void;
}

function WeekCard({ week, isExpanded, onToggle }: { week: TrainingWeek; isExpanded: boolean; onToggle: () => void }) {
  const phaseColors: Record<string, string> = {
    'Base Building': 'bg-emerald-100 text-emerald-700',
    'Build Phase': 'bg-amber-100 text-amber-700',
    'Peak Training': 'bg-rose-100 text-rose-700',
    'Taper': 'bg-sky-100 text-sky-700',
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-slate-700">Week {week.week}</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${phaseColors[week.phase] || 'bg-slate-100 text-slate-700'}`}>
            {week.phase}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{week.totalMileage}</span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100">
          {week.days.map((day, idx) => (
            <div
              key={day.day}
              className={`p-4 ${idx !== week.days.length - 1 ? 'border-b border-slate-100' : ''} ${
                day.workout.includes('RACE DAY') ? 'bg-gradient-to-r from-violet-50 to-rose-50' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-500 w-24">{day.day}</span>
                    <span className={`font-semibold ${day.workout.includes('RACE DAY') ? 'text-violet-600 text-lg' : 'text-slate-700'}`}>
                      {day.workout}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 md:ml-[96px]">{day.description}</p>
                </div>
                <div className="flex gap-4 text-sm">
                  {day.pace && (
                    <span className="px-3 py-1 bg-violet-50 text-violet-600 rounded-lg font-mono">
                      {day.pace}
                    </span>
                  )}
                  {day.distance && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">
                      {day.distance}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TrainingPlanDisplay({ plan, onReset }: TrainingPlanDisplayProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const info = DISTANCE_INFO[plan.distance];

  const toggleWeek = (week: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(week)) {
      newExpanded.delete(week);
    } else {
      newExpanded.add(week);
    }
    setExpandedWeeks(newExpanded);
  };

  const expandAll = () => {
    setExpandedWeeks(new Set(plan.weeks.map((w) => w.week)));
  };

  const collapseAll = () => {
    setExpandedWeeks(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-400 via-rose-300 to-sky-400 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold">{info.name} Training Plan</h2>
            <p className="text-white/80 mt-2">{plan.summary}</p>
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium"
          >
            Create New Plan
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="text-sm text-white/70">Current Pace</div>
            <div className="text-xl font-bold font-mono">
              {plan.currentPace.minutes}:{plan.currentPace.seconds.toString().padStart(2, '0')}/km
            </div>
          </div>
          <div>
            <div className="text-sm text-white/70">Target Pace</div>
            <div className="text-xl font-bold font-mono">
              {plan.targetPace.minutes}:{plan.targetPace.seconds.toString().padStart(2, '0')}/km
            </div>
          </div>
          <div>
            <div className="text-sm text-white/70">Duration</div>
            <div className="text-xl font-bold">{info.weeks} weeks</div>
          </div>
          <div>
            <div className="text-sm text-white/70">Training Days</div>
            <div className="text-xl font-bold">{plan.trainingDays} days/week</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-slate-700">Weekly Schedule</h3>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {plan.weeks.map((week) => (
          <WeekCard
            key={week.week}
            week={week}
            isExpanded={expandedWeeks.has(week.week)}
            onToggle={() => toggleWeek(week.week)}
          />
        ))}
      </div>
    </div>
  );
}
