import type { ExperienceLevel } from '../types';
import { EXPERIENCE_INFO } from '../types';

interface ExperienceLevelSelectorProps {
  experienceLevel: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
}

const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

export function ExperienceLevelSelector({ experienceLevel, onChange }: ExperienceLevelSelectorProps) {
  return (
    <section className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <div>
        <h2 id="experience-level-label" className="text-lg font-semibold text-slate-700">Experience Level</h2>
        <p id="experience-level-description" className="text-sm text-slate-500">
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
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="block font-semibold">{info.name}</span>
              <span className={`block text-xs mt-1 ${selected ? 'text-violet-100' : 'text-slate-400'}`}>
                {info.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
