import { useState, useEffect } from 'react';
import type { Pace } from '../types';

interface PaceInputProps {
  label: string;
  description: string;
  pace: Pace;
  onChange: (pace: Pace) => void;
}

export function PaceInput({ label, description, pace, onChange }: PaceInputProps) {
  const [minutesInput, setMinutesInput] = useState(pace.minutes.toString());
  const [secondsInput, setSecondsInput] = useState(pace.seconds.toString());

  useEffect(() => {
    setMinutesInput(pace.minutes.toString());
    setSecondsInput(pace.seconds.toString());
  }, [pace.minutes, pace.seconds]);

  const handleMinutesChange = (value: string) => {
    setMinutesInput(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      onChange({ ...pace, minutes: Math.max(0, Math.min(59, parsed)) });
    }
  };

  const handleSecondsChange = (value: string) => {
    setSecondsInput(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      onChange({ ...pace, seconds: Math.max(0, Math.min(59, parsed)) });
    }
  };

  const handleMinutesBlur = () => {
    const parsed = parseInt(minutesInput);
    if (isNaN(parsed) || minutesInput === '') {
      setMinutesInput(pace.minutes.toString());
    }
  };

  const handleSecondsBlur = () => {
    const parsed = parseInt(secondsInput);
    if (isNaN(parsed) || secondsInput === '') {
      setSecondsInput(pace.seconds.toString());
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 shadow-sm">
      <label className="block text-lg font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <p className="text-sm text-slate-500 mb-4">{description}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={minutesInput}
            onChange={(e) => handleMinutesChange(e.target.value)}
            onBlur={handleMinutesBlur}
            className="w-full px-4 py-3 text-2xl font-mono text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-white/80"
            placeholder="0"
          />
          <div className="text-xs text-slate-400 text-center mt-1">minutes</div>
        </div>
        <span className="text-3xl font-bold text-slate-300">:</span>
        <div className="flex-1">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={secondsInput}
            onChange={(e) => handleSecondsChange(e.target.value)}
            onBlur={handleSecondsBlur}
            className="w-full px-4 py-3 text-2xl font-mono text-center border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-300 focus:border-violet-300 outline-none bg-white/80"
            placeholder="0"
          />
          <div className="text-xs text-slate-400 text-center mt-1">seconds</div>
        </div>
        <span className="text-lg text-slate-500 font-medium">/km</span>
      </div>
    </div>
  );
}
