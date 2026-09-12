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

export function initThemeListener() {
  if (typeof window === 'undefined') return;
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'system') applyTheme('system');
  });
}

export function cycleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
  setTheme(next);
  return next;
}

/**
 * Wire the toggle button. Moved out of ThemeToggle.astro's inline script, which
 * had grown past the 10-line limit in CLAUDE.md.
 *
 * LEARN: initOnLoad fires this on BOTH DOMContentLoaded and astro:page-load, so
 * it runs twice on first load. Without a guard the button collected two click
 * listeners and each click ran cycleTheme() twice — the toggle skipped a state
 * (a fresh visitor's first click jumped straight from system to dark).
 *
 * Two different guards, because the two listeners have different lifetimes:
 *  - the button is a FRESH element after every view transition, so it is
 *    guarded per element (same as the TOC toggle in scripts/toc/toc.ts);
 *  - the matchMedia listener lives on window, which survives navigation, so it
 *    is wired once ever (same as the `wired` flag in scripts/toc/toc.ts).
 */
let mediaListenerWired = false;

export function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');

  if (!mediaListenerWired) {
    mediaListenerWired = true;
    initThemeListener();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      setTimeout(syncToggleState, 0);
    });
  }

  syncToggleState();

  if (btn && btn.dataset.themeToggleBound !== '1') {
    btn.dataset.themeToggleBound = '1';
    btn.addEventListener('click', () => {
      cycleTheme();
      syncToggleState();
    });
  }
}

/** Mirror the document's dark state onto the button's own toggled class. */
export function syncToggleState() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.classList.toggle('theme-toggle--toggled', document.documentElement.classList.contains('dark'));
}
