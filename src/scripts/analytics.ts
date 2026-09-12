// LEARN: We declare gtag on window since GA4's gtag.js defines it globally
// via BaseHead.astro — this lets TypeScript see it without a full @types package
declare global {
  interface Window {
    // Optional on purpose: gtag.js is a third-party script and is simply absent
    // whenever it fails to load.
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Send a GA4 event, or do nothing if gtag never loaded.
 *
 * LEARN: gtag.js is blocked for a large share of real readers — ad blockers,
 * privacy browsers, corporate proxies, offline. Calling window.gtag() directly
 * threw an uncaught TypeError for every one of them, and the scroll listener
 * fired it repeatedly while reading. Analytics must never break the page.
 */
function track(event: string, params: Record<string, unknown>): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
}

/**
 * Track clicks on contact links (LinkedIn, email, resume) across
 * the navigation dropdown and footer.
 */
export function initContactTracking(): () => void {
  // LEARN: one delegated listener, and it returns its own teardown. The previous
  // version attached a listener to every [data-contact] element and had no
  // idempotency guard at all — initOnLoad fired it twice on first load, so each
  // link was double-bound and a single click sent two contact_click events.
  const onClick = (event: MouseEvent) => {
    const el = (event.target as Element | null)?.closest<HTMLElement>('[data-contact]');
    if (!el) return;
    const method = el.dataset.contact;            // linkedin | email | resume
    const location = el.closest('footer, #Contact') ? 'footer' : 'nav';
    track('contact_click', { method, location });
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

/**
 * Fire a work_view event when a user lands on a work case study page.
 */
export function initWorkView() {
  track('work_view', {
    title: document.title,
    path: location.pathname,
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
        track('scroll_depth', {
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
