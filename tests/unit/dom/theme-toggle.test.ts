// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTheme,
  setTheme,
  applyTheme,
  cycleTheme,
  initThemeListener,
  initThemeToggle,
} from '../../../src/scripts/theme-toggle';

/** jsdom has no matchMedia; this stub also lets tests fire an OS theme change. */
function stubMatchMedia(prefersDark: boolean) {
  const listeners: Array<() => void> = [];
  let dark = prefersDark;
  (window as any).matchMedia = (query: string) => ({
    get matches() {
      return query.includes('prefers-color-scheme: dark') ? dark : false;
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, cb: () => void) => listeners.push(cb),
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
  return {
    setOsDark(next: boolean) {
      dark = next;
      listeners.forEach((cb) => cb());
    },
  };
}

const isDark = () => document.documentElement.classList.contains('dark');

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  stubMatchMedia(false);
});

describe('getTheme', () => {
  it('falls back to system when nothing is stored', () => {
    expect(getTheme()).toBe('system');
  });

  it('falls back to system for an unrecognised stored value', () => {
    localStorage.setItem('theme', 'sepia');
    expect(getTheme()).toBe('system');
  });

  it('returns a valid stored preference', () => {
    localStorage.setItem('theme', 'dark');
    expect(getTheme()).toBe('dark');
  });
});

describe('applyTheme', () => {
  it('adds .dark for an explicit dark choice', () => {
    applyTheme('dark');
    expect(isDark()).toBe(true);
  });

  it('removes .dark for an explicit light choice, even when the OS is dark', () => {
    stubMatchMedia(true);
    document.documentElement.classList.add('dark');
    applyTheme('light');
    expect(isDark()).toBe(false);
  });

  it('derives from the OS when set to system', () => {
    stubMatchMedia(true);
    applyTheme('system');
    expect(isDark()).toBe(true);

    stubMatchMedia(false);
    applyTheme('system');
    expect(isDark()).toBe(false);
  });
});

describe('setTheme', () => {
  it('persists the choice and applies it in one step', () => {
    setTheme('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(isDark()).toBe(true);
  });
});

describe('cycleTheme', () => {
  // Three states are intentional: light -> dark -> system -> light.
  it('walks the full three-state ring and returns to the start', () => {
    setTheme('light');
    expect(cycleTheme()).toBe('dark');
    expect(cycleTheme()).toBe('system');
    expect(cycleTheme()).toBe('light');
  });

  it('treats an unset preference as system, so the first click gives light', () => {
    expect(cycleTheme()).toBe('light');
  });

  it('persists each step', () => {
    setTheme('light');
    cycleTheme();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('re-derives from the OS when it lands on system', () => {
    stubMatchMedia(true);
    setTheme('dark');
    cycleTheme(); // -> system, OS says dark
    expect(getTheme()).toBe('system');
    expect(isDark()).toBe(true);
  });
});

describe('initThemeListener', () => {
  it('follows OS changes while the preference is system', () => {
    const mm = stubMatchMedia(false);
    setTheme('system');
    initThemeListener();
    expect(isDark()).toBe(false);

    mm.setOsDark(true);
    expect(isDark()).toBe(true);
  });

  it('ignores OS changes once the reader has chosen explicitly', () => {
    const mm = stubMatchMedia(false);
    setTheme('light');
    initThemeListener();

    mm.setOsDark(true);
    expect(isDark()).toBe(false);
  });
});

describe('initThemeToggle', () => {
  const button = () => document.getElementById('theme-toggle')!;

  it('advances exactly one state per click when init runs twice', () => {
    // Regression: initOnLoad fires on DOMContentLoaded AND astro:page-load, so
    // this runs twice on first load. Without the per-element guard the button
    // collected two listeners and one click ran cycleTheme() twice — a fresh
    // visitor's first click jumped system -> dark, skipping light entirely.
    document.body.innerHTML = '<button id="theme-toggle"></button>';
    initThemeToggle();
    initThemeToggle();

    setTheme('light');
    button().click();
    expect(getTheme()).toBe('dark');
  });

  it('still binds a fresh button after a view transition', () => {
    document.body.innerHTML = '<button id="theme-toggle"></button>';
    initThemeToggle();

    // A view transition replaces the document — the new button must get wired.
    document.body.innerHTML = '<button id="theme-toggle"></button>';
    initThemeToggle();

    setTheme('light');
    button().click();
    expect(getTheme()).toBe('dark');
  });

  it('reflects the current theme on the button', () => {
    document.body.innerHTML = '<button id="theme-toggle"></button>';
    setTheme('dark');
    initThemeToggle();
    expect(button().classList.contains('theme-toggle--toggled')).toBe(true);

    setTheme('light');
    button().click(); // -> dark
    expect(button().classList.contains('theme-toggle--toggled')).toBe(true);
  });

  it('does not throw on a page with no toggle button', () => {
    document.body.innerHTML = '';
    expect(() => initThemeToggle()).not.toThrow();
  });
});
