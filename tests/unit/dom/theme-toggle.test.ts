// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTheme,
  setTheme,
  applyTheme,
  cycleTheme,
  initThemeListener,
} from '../../../src/scripts/theme-toggle';

// NOTE: the initThemeToggle() suite that used to live at the bottom of this file
// is gone along with the function. It existed to prove the double-fire guards
// worked (initOnLoad ran the wiring twice, so the button could collect two click
// listeners and skip a state). ThemeToggle.svelte owns its own lifecycle now, so
// there is no second invocation to guard against. The user-visible behaviour it
// protected — one state per click — is covered by tests/e2e/theme.spec.ts.

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
