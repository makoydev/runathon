import type { ReactNode } from 'react';

export type NoticeTone = 'info' | 'warning' | 'error';

interface InlineNoticeProps {
  tone: NoticeTone;
  children: ReactNode;
  // Errors default to an assertive alert; info and warnings to a polite status.
  role?: 'alert' | 'status';
  id?: string;
  className?: string;
}

const TONE_STYLES: Record<NoticeTone, { container: string; icon: string; glyph: string; name: string }> = {
  info: {
    container: 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800 text-slate-600 dark:text-slate-300',
    icon: 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300',
    glyph: 'i',
    name: 'Note',
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    glyph: '!',
    name: 'Warning',
  },
  error: {
    container: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200',
    icon: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
    glyph: '!',
    name: 'Error',
  },
};

// Shared look for form-side messages so warnings read the same everywhere:
// a tinted card with a badge icon, never a bare line of coloured text.
export function InlineNotice({ tone, children, role, id, className = '' }: InlineNoticeProps) {
  const styles = TONE_STYLES[tone];
  return (
    <div
      id={id}
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={`flex gap-3 p-3 rounded-lg border text-sm ${styles.container} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`flex-none w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono ${styles.icon}`}
      >
        {styles.glyph}
      </span>
      <span className="sr-only">{styles.name}:</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
