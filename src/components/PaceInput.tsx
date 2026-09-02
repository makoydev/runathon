import { useId } from 'react';
import type { Pace } from '../types';

interface PaceInputProps {
  label: string;
  description: string;
  pace: Pace;
  onChange: (pace: Pace) => void;
}

export function PaceInput({ label, description, pace, onChange }: PaceInputProps) {
  const id = useId();

  const parsePacePart = (value: string): number => {
    const sanitized = value.replace(/\D/g, '');
    if (sanitized === '') return 0;

    const parsed = parseInt(sanitized, 10);
    return Math.max(0, Math.min(59, parsed));
  };

  const handleMinutesChange = (value: string) => {
    onChange({ ...pace, minutes: parsePacePart(value) });
  };

  const handleSecondsChange = (value: string) => {
    onChange({ ...pace, seconds: parsePacePart(value) });
  };

  const minutesId = `${id}-minutes`;
  const secondsId = `${id}-seconds`;
  const descriptionId = `${id}-description`;

  return (
    <fieldset className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <legend className="block text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
        {label}
      </legend>
      <p id={descriptionId} className="text-sm text-slate-500 dark:text-slate-400 mb-4">{description}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label htmlFor={minutesId} className="sr-only">{label} minutes</label>
          <input
            id={minutesId}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pace.minutes.toString()}
            onChange={(e) => handleMinutesChange(e.target.value)}
            aria-describedby={descriptionId}
            className="w-full px-4 py-3 text-2xl font-mono text-center border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500 focus:border-violet-300 dark:focus:border-violet-500 outline-none bg-white/80 dark:bg-slate-800/80"
            placeholder="0"
          />
          <div className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1" aria-hidden="true">minutes</div>
        </div>
        <span className="text-3xl font-bold text-slate-300 dark:text-slate-600" aria-hidden="true">:</span>
        <div className="flex-1">
          <label htmlFor={secondsId} className="sr-only">{label} seconds</label>
          <input
            id={secondsId}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pace.seconds.toString()}
            onChange={(e) => handleSecondsChange(e.target.value)}
            aria-describedby={descriptionId}
            className="w-full px-4 py-3 text-2xl font-mono text-center border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500 focus:border-violet-300 dark:focus:border-violet-500 outline-none bg-white/80 dark:bg-slate-800/80"
            placeholder="0"
          />
          <div className="text-xs text-slate-400 dark:text-slate-500 text-center mt-1" aria-hidden="true">seconds</div>
        </div>
        <span className="text-lg text-slate-500 dark:text-slate-400 font-medium" aria-hidden="true">/km</span>
      </div>
    </fieldset>
  );
}
