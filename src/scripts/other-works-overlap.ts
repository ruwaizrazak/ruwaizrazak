import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * "Other works" section slides up to overlap the article content
 * as the user scrolls towards the bottom of a work detail page.
 * Respects prefers-reduced-motion and guards against duplicate init.
 */
export function initOtherWorksOverlap() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const wrapper = document.querySelector<HTMLElement>('[data-other-works-wrapper]');
  if (!wrapper || wrapper.dataset.overlapInited === '1') return;
  wrapper.dataset.overlapInited = '1';

  gsap.to(wrapper, {
    y: -200,
    ease: 'none',
    scrollTrigger: {
      trigger: wrapper,
      start: 'top bottom',
      end: 'top 60%',
      scrub: true,
    },
  });
}
