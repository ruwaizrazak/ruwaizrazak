import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createScrubReveal } from '../utils/scrubReveal';
import { initDotNav, setActiveDot, setVisibleDotCount } from './dot-nav';
gsap.registerPlugin(ScrollTrigger);

export function initRelatedNotes() {
  const section = document.querySelector('.related-notes-section') as HTMLElement;
  const reveal = document.querySelector('.related-reveal') as HTMLElement;
  const track = document.querySelector('.related-track') as HTMLElement;
  const cards = gsap.utils.toArray('.related-card') as HTMLElement[];
  const nav = document.getElementById('related-nav');
  if (!section || !reveal || !track) return;

  // Card pop-in timeline (built before reveal so it can be triggered)
  const cardTl = gsap.timeline({ paused: true });

  // Pagination state
  let currentPage = 0;
  let paginationReady = false;

  function getCardWidth(): number {
    const card = cards[0];
    if (!card) return 320;
    return card.getBoundingClientRect().width;
  }

  function getGap(): number {
    return parseFloat(getComputedStyle(track).gap) || 24;
  }

  function getCardsPerPage(): number {
    const trackWidth = track.parentElement?.clientWidth ?? track.clientWidth;
    const cardW = getCardWidth();
    const gap = getGap();
    return Math.max(1, Math.floor((trackWidth + gap) / (cardW + gap)));
  }

  function getPageCount(): number {
    return Math.ceil(cards.length / getCardsPerPage());
  }

  function goToPage(page: number) {
    const pageCount = getPageCount();
    if (pageCount === 0) return;
    currentPage = Math.max(0, Math.min(page, pageCount - 1));

    const cardW = getCardWidth();
    const gap = getGap();
    const offset = currentPage * getCardsPerPage() * (cardW + gap);
    track.style.transform = `translateX(-${offset}px)`;

    if (nav) {
      setActiveDot(nav, currentPage);
      setVisibleDotCount(nav, pageCount);
    }
  }

  function initPagination() {
    if (paginationReady || !nav) return;
    paginationReady = true;

    const cleanupNav = initDotNav(nav);

    nav.addEventListener('dotnav:prev', () => goToPage(currentPage - 1));
    nav.addEventListener('dotnav:next', () => goToPage(currentPage + 1));
    nav.addEventListener('dotnav:dotclick', ((e: CustomEvent) => {
      goToPage(e.detail.index);
    }) as EventListener);

    goToPage(0);

    window.addEventListener('resize', () => goToPage(currentPage));
  }

  const fullHeight = createScrubReveal({
    section,
    reveal,
    initFlag: 'relatedInited',
    start: 'top 90%',
    end: 'top 50%',
    beforeMeasure: () => cards.forEach(c => { c.style.opacity = '1'; }),
    afterMeasure: () => cards.forEach(c => { c.style.opacity = '0'; }),
    onRevealed: (h) => {
      reveal.style.height = 'auto';
      cardTl.play();
      // Defer pagination init until cards have layout
      requestAnimationFrame(() => initPagination());
    },
    onHidden: (h) => {
      reveal.style.height = h + 'px';
      cardTl.reverse();
    },
  });
  if (fullHeight === null) return;

  // Card pop-in with reverse support
  cardTl.eventCallback('onComplete', () => { reveal.style.height = 'auto'; });
  cardTl.eventCallback('onReverseComplete', () => { reveal.style.height = fullHeight + 'px'; });

  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  cardTl.fromTo(shuffled,
    { opacity: 0, scale: 0.8, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(1.4)' }
  );
}
