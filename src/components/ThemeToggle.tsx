import { useEffect, useState } from 'react';
import type { ThemePreference } from '../utils/theme';
import { applyTheme, loadThemePreference, storeThemePreference } from '../utils/theme';

const OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

// Self-contained (state lives in localStorage) so it can sit on any screen
// without prop drilling.
export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(loadThemePreference);

  useEffect(() => {
    applyTheme(preference);
    storeThemePreference(preference);
  }, [preference]);

  // Track OS theme changes while following the system preference.
  useEffect(() => {
    if (preference !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, [preference]);

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden print:hidden"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === preference;
        return (
          <button
            key={option.value}
            onClick={() => setPreference(option.value)}
            aria-pressed={selected}
            aria-label={`Use ${option.label.toLowerCase()} theme`}
            className={`px-3 py-2 text-sm font-semibold transition-colors ${
              selected
                ? 'bg-violet-500 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
