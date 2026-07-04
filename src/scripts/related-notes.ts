import { initOnLoad } from '../utils/initOnLoad';

const PER_PAGE = 4;
// LEARN: match the garden/listing card reveal (listingFilters.ts) so both card grids
// appear identically — 40ms stagger, 300ms, translateY(8px), and the site's --ease-snappy.
const STAGGER_MS = 40; // gap between each card's entrance
// --ease-snappy from global.css:57 — the site's designated enter/exit curve. WAAPI can't
// read CSS custom properties, so mirror its value here (keep in sync with the token).
const EASE_SNAPPY = 'cubic-bezier(0.23, 1, 0.32, 1)';

function initRelatedNotes() {
  const grid = document.querySelector('.related-grid');
  const btn = document.querySelector<HTMLButtonElement>('.related-refresh');
  if (!grid) return;
  // LEARN: idempotent per-DOM guard (motion skill §4.2) — initOnLoad can fire
  // twice on first load, which would double-bind the button and make Refresh
  // jump two pages. A fresh page (view transition) has a new grid, so it re-inits.
  if (grid.hasAttribute('data-related-inited')) return;
  grid.setAttribute('data-related-inited', '');

  const cards = Array.from(grid.querySelectorAll<HTMLElement>('.related-card'));
  // Series lists show every subsequent part at once (no Refresh); regular notes page by 4.
  const isSeries = grid.hasAttribute('data-series');
  const perPage = isSeries ? cards.length : PER_PAGE;
  const pageCount = Math.ceil(cards.length / perPage);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let page = 0;

  // LEARN: hidden cards use display:none so the CSS grid only lays out the
  // visible page of 4. Visible cards cascade in one-by-one via the Web Animations
  // API — re-triggerable on Refresh (unlike a one-shot CSS load animation).
  const render = () => {
    let visiblePos = 0;
    cards.forEach((c, i) => {
      const isVisible = Math.floor(i / perPage) === page;
      c.classList.toggle('hidden', !isVisible);
      if (!isVisible) return;
      if (!reduceMotion) {
        c.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 300, delay: visiblePos * STAGGER_MS, easing: EASE_SNAPPY, fill: 'both' },
        );
      }
      visiblePos++;
    });
  };

  // LEARN: the entrance cascade now waits until the grid scrolls into view
  // (IntersectionObserver) instead of firing on load — the section sits at the
  // bottom of the article, so triggering on-view makes the reveal feel intentional.
  if (reduceMotion) {
    render(); // reduced motion: lay out the visible page immediately, no cascade
  } else {
    // Pre-hide so cards don't flash their final state before the cascade runs.
    // (WAAPI's fill:both in render() then holds them visible afterward.)
    cards.forEach((c) => { c.style.opacity = '0'; });
    const io = new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) {
        render();
        obs.disconnect(); // one-shot — cascade only on first reveal
      }
    }, { threshold: 0.15 });
    io.observe(grid);
  }

  btn?.addEventListener('click', () => {
    page = (page + 1) % pageCount; // cycle in order, wrap to start
    render();
  });
}

initOnLoad(initRelatedNotes);

// Flag clicks from RelatedNotes so the destination page uses the slide transition
// (read in notesPost.astro). Registered once at module scope — the document
// persists across view-transition navigations, so binding here avoids stacking.
document.addEventListener(
  'click',
  (e) => {
    const card = (e.target as Element).closest('.related-notes-section a');
    if (card) {
      sessionStorage.setItem('nav-from-related', '1');
    }
  },
  true,
);
