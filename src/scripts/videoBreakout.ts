/**
 * Full-bleed video breakout: keeps the wrapper at a 16:9 height of the viewport
 * width and shrinks it as it scrolls past the top, clipping the iframe.
 */
export function initVideoBreakouts() {
  const wrappers = document.querySelectorAll<HTMLElement>('[data-video-breakout]');
  wrappers.forEach((el) => {
    if (el.dataset.videoBreakoutInited === '1') return;
    el.dataset.videoBreakoutInited = '1';

    // 16:9 height for full viewport width
    let initialHeightPx = 0.5625 * window.innerWidth;
    let ticking = false;

    function updateHeight() {
      const top = el.getBoundingClientRect().top;
      const heightPx = Math.max(0, initialHeightPx + top);
      el.style.height = heightPx + 'px';
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          updateHeight();
          ticking = false;
        });
      }
    }

    function onResize() {
      initialHeightPx = 0.5625 * window.innerWidth; // 16:9 of viewport width
      updateHeight();
    }

    updateHeight();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
  });
}
