export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_KEY = 'runathon.theme.v1';

export function loadThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function storeThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, preference);
    }
  } catch {
    // Persistence is a convenience; ignore storage failures.
  }
}

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return preference;
}

// The `dark` class on <html> drives Tailwind's dark: variant (see index.css).
export function applyTheme(preference: ThemePreference): void {
  const theme = resolveTheme(preference);
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

// Printed plans should always come out light, whatever the screen theme.
export function initPrintThemeReset(): void {
  window.addEventListener('beforeprint', () => {
    document.documentElement.classList.remove('dark');
  });
  window.addEventListener('afterprint', () => {
    applyTheme(loadThemePreference());
  });
}
