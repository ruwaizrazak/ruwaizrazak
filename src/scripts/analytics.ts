// LEARN: We declare gtag on window since GA4's gtag.js defines it globally
// via BaseHead.astro — this lets TypeScript see it without a full @types package
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

/**
 * Track clicks on contact links (LinkedIn, email, resume) across
 * the navigation dropdown and footer.
 */
export function initContactTracking() {
  document.querySelectorAll<HTMLElement>('[data-contact]').forEach((el) => {
    el.addEventListener('click', () => {
      const method = el.dataset.contact;          // linkedin | email | resume
      const location = el.closest('footer, #Contact') ? 'footer' : 'nav';
      window.gtag('event', 'contact_click', { method, location });
    });
  });
}

/**
 * Fire scroll_depth events as the reader progresses through an article.
 * Essays: 25%, 50%, 75%  ·  Notes: 50% only.
 *
 * Uses a scroll listener on the window that measures progress through
 * the <article> element relative to the viewport.
 */
export function initScrollDepth() {
  const main = document.querySelector<HTMLElement>('main[data-collection]');
  if (!main) return;

  const collection = main.dataset.collection;
  const thresholds = collection === 'essays' ? [25, 50, 75] : [50];
  const fired = new Set<number>();

  // LEARN: We measure how far through the <article> the user has scrolled.
  // Using the article element (not the full page) avoids counting header/footer
  // height, giving a more accurate reading-progress percentage.
  const article = document.querySelector('article');
  if (!article) return;

  const title = document.title;

  function onScroll() {
    const rect = article!.getBoundingClientRect();
    const articleTop = rect.top + window.scrollY;
    const articleHeight = rect.height;
    if (articleHeight === 0) return;

    const scrolled = window.scrollY + window.innerHeight - articleTop;
    const percent = Math.min(100, (scrolled / articleHeight) * 100);

    for (const threshold of thresholds) {
      if (percent >= threshold && !fired.has(threshold)) {
        fired.add(threshold);
        window.gtag('event', 'scroll_depth', {
          depth: String(threshold),
          collection,
          title,
        });
      }
    }

    // All thresholds fired — stop listening
    if (fired.size === thresholds.length) {
      window.removeEventListener('scroll', onScroll);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}
