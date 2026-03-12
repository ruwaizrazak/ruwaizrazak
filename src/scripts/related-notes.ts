import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function initRelatedNotes() {
  const section = document.querySelector('.related-notes-section');
  const reveal = document.querySelector('.related-reveal') as HTMLElement;
  const container = document.querySelector('.related-scroll') as HTMLElement;
  const cards = gsap.utils.toArray('.related-card');
  const leftBtn = document.querySelector('.related-arrow-left') as HTMLElement;
  const rightBtn = document.querySelector('.related-arrow-right') as HTMLElement;
  if (!section || !reveal || !container) return;
  if ((section as HTMLElement).dataset.relatedInited === '1') return;
  (section as HTMLElement).dataset.relatedInited = '1';

  // Temporarily make cards visible to measure true height
  (cards as HTMLElement[]).forEach(c => { c.style.opacity = '1'; });
  reveal.style.height = 'auto';
  const fullHeight = reveal.offsetHeight;
  reveal.style.height = '0px';
  (cards as HTMLElement[]).forEach(c => { c.style.opacity = '0'; });

  // Height reveal as section approaches viewport (scrubs = reverses naturally)
  gsap.to(reveal, {
    height: fullHeight,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top 90%',
      end: 'top 50%',
      scrub: true,
    },
  });

  // Card pop-in with reverse support
  const cardTl = gsap.timeline({
    paused: true,
    onComplete() { reveal.style.height = 'auto'; },
    onReverseComplete() { reveal.style.height = fullHeight + 'px'; },
  });
  const shuffled = [...cards].sort(() => Math.random() - 0.5);
  cardTl.fromTo(shuffled,
    { opacity: 0, scale: 0.8, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(1.4)' }
  );

  ScrollTrigger.create({
    trigger: section,
    start: 'top 50%',
    onEnter: () => cardTl.play(),
    onLeaveBack: () => cardTl.reverse(),
  });

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
