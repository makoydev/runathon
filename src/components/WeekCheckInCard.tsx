import type { WeekFeedback } from '../utils/progressStorage';

interface WeekCheckInCardProps {
  week: number;
  onAnswer: (feedback: WeekFeedback) => void;
}

const OPTIONS: Array<{ feedback: WeekFeedback; label: string; description: string }> = [
  { feedback: 'fresh', label: 'Felt fresh', description: 'Workouts felt comfortable' },
  { feedback: 'normal', label: 'About normal', description: 'Tired but recovering fine' },
  { feedback: 'tired', label: 'Very fatigued', description: 'Struggling to recover' },
];

export function WeekCheckInCard({ week, onAnswer }: WeekCheckInCardProps) {
  return (
    <section
      aria-label={`Week ${week} check-in`}
      className="bg-gradient-to-r from-sky-50 to-violet-50 rounded-xl border border-sky-200 p-6 shadow-sm print:hidden"
    >
      <h3 className="text-xl font-semibold text-slate-700">Week {week} check-in</h3>
      <p className="mt-1 text-sm text-slate-500">
        You finished marking week {week}. How did it feel? A hard week conservatively reduces next
        week's volume; a good week keeps the plan as written.
      </p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.feedback}
            onClick={() => onAnswer(option.feedback)}
            aria-label={`Week ${week} felt: ${option.label}`}
            className="p-3 rounded-lg border border-slate-200 bg-white/70 hover:border-sky-300 hover:bg-sky-50 transition-colors text-left"
          >
            <div className="font-semibold text-slate-700">{option.label}</div>
            <div className="text-sm text-slate-500">{option.description}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
