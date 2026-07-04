import { initOnLoad } from '../utils/initOnLoad';

const PER_PAGE = 4;
const STAGGER_MS = 70; // gap between each card's entrance

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
  const pageCount = Math.ceil(cards.length / PER_PAGE);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let page = 0;

  // LEARN: hidden cards use display:none so the CSS grid only lays out the
  // visible page of 4. Visible cards cascade in one-by-one via the Web Animations
  // API — re-triggerable on Refresh (unlike a one-shot CSS load animation).
  const render = () => {
    let visiblePos = 0;
    cards.forEach((c, i) => {
      const isVisible = Math.floor(i / PER_PAGE) === page;
      c.classList.toggle('hidden', !isVisible);
      if (!isVisible) return;
      if (!reduceMotion) {
        c.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 300, delay: visiblePos * STAGGER_MS, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' },
        );
      }
      visiblePos++;
    });
  };

  render(); // cascade the initial page in on load / navigation

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
