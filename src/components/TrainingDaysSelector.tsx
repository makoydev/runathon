interface TrainingDaysSelectorProps {
  trainingDays: number;
  onChange: (days: number) => void;
}

export function TrainingDaysSelector({ trainingDays, onChange }: TrainingDaysSelectorProps) {
  const options = [3, 4, 5, 6];

  return (
    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-700">Training Days per Week</h2>
          <p className="text-sm text-slate-500">We'll tailor quality vs. easy to match your availability.</p>
        </div>
        <div className="flex gap-2">
          {options.map((option) => {
            const selected = option === trainingDays;
            return (
              <button
                key={option}
                onClick={() => onChange(option)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  selected
                    ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {option}x
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        We prioritize your long run and tempo day; intervals/extra easy runs are removed first when you pick fewer days.
      </p>
    </div>
  );
}
