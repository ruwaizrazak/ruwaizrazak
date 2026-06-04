// Related-notes carousel. The reveal is now driven by an IntersectionObserver
// + a plain GSAP height tween (no ScrollTrigger) so post pages no longer ship the
// 44 KB ScrollTrigger chunk. The card pop-in timeline + pagination are unchanged.
import gsap from 'gsap';
import { initDotNav, setActiveDot, setVisibleDotCount } from './dot-nav';

export function initRelatedNotes() {
  const section = document.querySelector('.related-notes-section') as HTMLElement;
  const reveal = document.querySelector('.related-reveal') as HTMLElement;
  const track = document.querySelector('.related-track') as HTMLElement;
  const cards = gsap.utils.toArray('.related-card') as HTMLElement[];
  const nav = document.getElementById('related-nav');
  if (!section || !reveal || !track) return;

  // Guard against double-init (View Transitions re-run this on navigation).
  if (section.dataset.relatedInited === '1') return;
  section.dataset.relatedInited = '1';

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

    initDotNav(nav);

    nav.addEventListener('dotnav:prev', () => goToPage(currentPage - 1));
    nav.addEventListener('dotnav:next', () => goToPage(currentPage + 1));
    nav.addEventListener('dotnav:dotclick', ((e: CustomEvent) => {
      goToPage(e.detail.index);
    }) as EventListener);

    goToPage(0);

    window.addEventListener('resize', () => goToPage(currentPage));
  }

  // Measure the natural height (cards are opacity:0 via CSS but still take layout),
  // then collapse — same dance the old createScrubReveal did, minus ScrollTrigger.
  reveal.style.height = 'auto';
  const fullHeight = reveal.offsetHeight;
  reveal.style.height = '0px';

  // Card pop-in with reverse support (unchanged)
  cardTl.eventCallback('onComplete', () => { reveal.style.height = 'auto'; });
  cardTl.eventCallback('onReverseComplete', () => { reveal.style.height = fullHeight + 'px'; });

  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  cardTl.fromTo(shuffled,
    { opacity: 0, scale: 0.8, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(1.4)' }
  );

  // Reduced motion: skip the reveal/pop-in, just show everything.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveal.style.height = 'auto';
    cards.forEach((c) => { c.style.opacity = '1'; });
    requestAnimationFrame(() => initPagination());
    return;
  }

  let revealed = false;
  function doReveal() {
    if (revealed) return;
    revealed = true;
    gsap.to(reveal, {
      height: fullHeight,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => { reveal.style.height = 'auto'; },
    });
    cardTl.play();
    requestAnimationFrame(() => initPagination());
  }
  function doHide() {
    if (!revealed) return;
    revealed = false;
    reveal.style.height = fullHeight + 'px';
    gsap.to(reveal, { height: 0, duration: 0.4, ease: 'power2.in' });
    cardTl.reverse();
  }

  // LEARN: replaces ScrollTrigger 'top 90% → top 50%'. rootMargin -40% bottom makes
  // the observer fire when the section reaches roughly the lower-middle of the
  // viewport; reverse when it's scrolled back above the top.
  const io = new IntersectionObserver((entries) => {
    const e = entries[0];
    if (!e) return;
    if (e.isIntersecting) doReveal();
    else if (e.boundingClientRect.top < 0) doHide();
  }, { rootMargin: '0px 0px -40% 0px', threshold: 0 });

  io.observe(section);
}
