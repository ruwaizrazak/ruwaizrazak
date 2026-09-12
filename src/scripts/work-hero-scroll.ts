/**
 * Scroll-driven hero image height & blur effect for work detail pages.
 * As the user scrolls down, the hero image shrinks and gains a blur filter.
 * Pure vanilla JS — no GSAP dependency.
 *
 * LEARN: the `hero.dataset.heroScrollInited` guard that used to sit here existed
 * only because initOnLoad fired twice on first load. initOnLoad runs its callback
 * once per page view now, so the guard is gone — and this returns a cleanup
 * instead, which fixes the actual leak: the guard never removed the window
 * listeners, so every client-side navigation stacked another scroll/resize pair.
 */
export function initHeroScrollHeight(): (() => void) | void {
  const hero = document.getElementById('hero-image');
  if (!hero) return;

  // LEARN: Match the CSS breakpoint — 50vh below 768px, 80vh at md+.
  const isMobile = window.innerWidth < 768;
  let initialHeightPx = (isMobile ? 0.5 : 0.8) * window.innerHeight;
  let ticking = false;
  const maxBlurPx = 8;

  function updateHeight() {
    if (!hero) return;
    const top = hero.getBoundingClientRect().top;
    const heightPx = Math.max(0, initialHeightPx + top);
    hero.style.height = heightPx + 'px';

    // Blur increases as the hero shrinks (0 at full height, maxBlurPx at 0 height)
    const shrinkRatio = 1 - heightPx / initialHeightPx;
    const blurPx = Math.max(0, shrinkRatio * maxBlurPx);
    hero.style.filter = blurPx > 0 ? 'blur(' + blurPx + 'px)' : 'none';
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        updateHeight();
        ticking = false;
      });
    }
  }

  function onResize() {
    const mobile = window.innerWidth < 768;
    initialHeightPx = (mobile ? 0.5 : 0.8) * window.innerHeight;
    updateHeight();
  }

  updateHeight();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
  };
}
