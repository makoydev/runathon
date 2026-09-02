import type { ExperienceLevel } from '../types';
import { EXPERIENCE_INFO } from '../types';

interface ExperienceLevelSelectorProps {
  experienceLevel: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
}

const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

export function ExperienceLevelSelector({ experienceLevel, onChange }: ExperienceLevelSelectorProps) {
  return (
    <section className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
      <div>
        <h2 id="experience-level-label" className="text-lg font-semibold text-slate-700 dark:text-slate-200">Experience Level</h2>
        <p id="experience-level-description" className="text-sm text-slate-500 dark:text-slate-400">
          We'll scale mileage, long-run growth, and how often hard sessions appear.
        </p>
      </div>
      <div
        role="group"
        aria-labelledby="experience-level-label"
        aria-describedby="experience-level-description"
        className="grid sm:grid-cols-3 gap-3"
      >
        {LEVELS.map((level) => {
          const selected = level === experienceLevel;
          const info = EXPERIENCE_INFO[level];
          return (
            <button
              key={level}
              onClick={() => onChange(level)}
              aria-pressed={selected}
              className={`p-4 rounded-lg text-left border transition-colors ${
                selected
                  ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <span className="block font-semibold">{info.name}</span>
              <span className={`block text-xs mt-1 ${selected ? 'text-violet-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {info.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
