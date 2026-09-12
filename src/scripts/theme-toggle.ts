export type Theme = 'light' | 'dark' | 'system';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('theme') as Theme | null;
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme', theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = theme === 'dark' || (theme === 'system' && prefersDark);
  if (shouldBeDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Follow OS theme changes while the reader's preference is "system".
 *
 * LEARN: returns a cleanup function. That return is what replaced the old
 * module-level `mediaListenerWired` flag — instead of guarding against being
 * called twice, the caller (ThemeToggle.svelte's onMount) simply undoes it when
 * the island unmounts, so a view transition can't stack duplicate listeners.
 *
 * `onApplied` lets the caller mirror the new state onto its own UI.
 */
export function initThemeListener(onApplied?: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    if (getTheme() === 'system') {
      applyTheme('system');
      onApplied?.();
    }
  };
  media.addEventListener('change', handleChange);
  return () => media.removeEventListener('change', handleChange);
}

export function cycleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
  setTheme(next);
  return next;
}
