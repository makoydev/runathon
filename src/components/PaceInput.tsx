import type { Pace } from '../types';

interface PaceInputProps {
  label: string;
  description: string;
  pace: Pace;
  onChange: (pace: Pace) => void;
}

export function PaceInput({ label, description, pace, onChange }: PaceInputProps) {
  const handleMinutesChange = (value: string) => {
    const minutes = parseInt(value) || 0;
    onChange({ ...pace, minutes: Math.max(0, Math.min(59, minutes)) });
  };

  const handleSecondsChange = (value: string) => {
    const seconds = parseInt(value) || 0;
    onChange({ ...pace, seconds: Math.max(0, Math.min(59, seconds)) });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <label className="block text-lg font-semibold text-gray-800 mb-1">
        {label}
      </label>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="number"
            min="0"
            max="59"
            value={pace.minutes}
            onChange={(e) => handleMinutesChange(e.target.value)}
            className="w-full px-4 py-3 text-2xl font-mono text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="0"
          />
          <div className="text-xs text-gray-400 text-center mt-1">minutes</div>
        </div>
        <span className="text-3xl font-bold text-gray-400">:</span>
        <div className="flex-1">
          <input
            type="number"
            min="0"
            max="59"
            value={pace.seconds}
            onChange={(e) => handleSecondsChange(e.target.value)}
            className="w-full px-4 py-3 text-2xl font-mono text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="0"
          />
          <div className="text-xs text-gray-400 text-center mt-1">seconds</div>
        </div>
        <span className="text-lg text-gray-500 font-medium">/km</span>
      </div>
    </div>
  );
}
