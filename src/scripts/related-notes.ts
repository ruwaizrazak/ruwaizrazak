import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createScrubReveal } from '../utils/scrubReveal';
gsap.registerPlugin(ScrollTrigger);

export function initRelatedNotes() {
  const section = document.querySelector('.related-notes-section') as HTMLElement;
  const reveal = document.querySelector('.related-reveal') as HTMLElement;
  const container = document.querySelector('.related-scroll') as HTMLElement;
  const cards = gsap.utils.toArray('.related-card') as HTMLElement[];
  const leftBtn = document.querySelector('.related-arrow-left') as HTMLElement;
  const rightBtn = document.querySelector('.related-arrow-right') as HTMLElement;
  if (!section || !reveal || !container) return;

  // Card pop-in timeline (built before reveal so it can be triggered)
  const cardTl = gsap.timeline({ paused: true });

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

  // Smart arrow visibility based on overflow
  function updateArrows() {
    if (!leftBtn || !rightBtn) return;
    const overflows = container.scrollWidth > container.clientWidth;
    leftBtn.style.display = overflows ? 'flex' : 'none';
    rightBtn.style.display = overflows ? 'flex' : 'none';
  }
  updateArrows();
  window.addEventListener('resize', updateArrows);

  // Arrow click handlers
  if (leftBtn && rightBtn) {
    const scrollAmount = 340;
    leftBtn.addEventListener('click', () => container.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    rightBtn.addEventListener('click', () => container.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
  }
}
