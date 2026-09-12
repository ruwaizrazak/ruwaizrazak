/**
 * Run a function on initial page load and again after every Astro
 * view-transition navigation — exactly once per page view.
 *
 * LEARN: the original implementation was two lines:
 *
 *     document.addEventListener('DOMContentLoaded', fn);
 *     document.addEventListener('astro:page-load', fn);
 *
 * With ClientRouter mounted, `astro:page-load` ALSO fires on the initial load,
 * so `fn` ran TWICE on every first page view. That single bug is why nearly
 * every script in src/scripts/ grew an idempotency guard — dataset flags,
 * hasAttribute checks, module-level booleans, in three inconsistent styles — and
 * why the ones that forgot had real defects: the theme toggle skipped a state,
 * Refresh jumped two pages, and contact clicks sent duplicate GA4 events.
 *
 * The Svelte migration removed the need for this in components, which own their
 * own lifecycle. What remains are page-level scripts in .astro layouts, which
 * are not components and legitimately still need it — so fix the cause rather
 * than keep guarding the symptom.
 *
 * The first `astro:page-load` is swallowed because the initial run has already
 * happened; every later one is a real navigation and re-runs `fn`.
 *
 * LEARN: `fn` may return a cleanup function, the way a Svelte $effect does. It is
 * called before the next run and on `astro:before-swap`, which is the last moment
 * the outgoing page's DOM still exists. Without this, page-level scripts that add
 * window listeners leaked a fresh pair on every client-side navigation — the
 * elements they were bound to were replaced, but the listeners were not.
 */
type Cleanup = void | (() => void);

export function initOnLoad(fn: () => Cleanup): void {
  let initialDone = false;
  let cleanup: Cleanup;

  const dispose = () => {
    if (typeof cleanup === 'function') cleanup();
    cleanup = undefined;
  };

  const runInitial = () => {
    if (initialDone) return;
    initialDone = true;
    cleanup = fn();
  };

  document.addEventListener('astro:before-swap', dispose);

  // A module script can be evaluated after DOMContentLoaded has already fired.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInitial, { once: true });
  } else {
    runInitial();
  }

  let seenFirstPageLoad = false;
  document.addEventListener('astro:page-load', () => {
    if (!seenFirstPageLoad) {
      seenFirstPageLoad = true;
      // Covers the no-ClientRouter-yet case where this fires before DOMContentLoaded.
      runInitial();
      return;
    }
    dispose();
    cleanup = fn();
  });
}
