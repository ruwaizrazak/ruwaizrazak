import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Horizontal scroll effect for the work experience section.
 * On md+ screens, pins the section and converts vertical scroll to horizontal.
 * On mobile, native overflow-x-auto handles horizontal scrolling.
 * Cleans up previous triggers before re-initializing (view-transition safe).
 */
export function initWorkExperienceScroll() {
  // Only on md+ screens
  if (window.innerWidth < 768) return;

  // Cleanup previous trigger (view-transition safe)
  ScrollTrigger.getById('work-experience-pin')?.kill();

  const section = document.getElementById('work-experience');
  const cards = document.getElementById('work-cards');
  if (!section || !cards) return;

  const scrollWidth = cards.scrollWidth - cards.clientWidth;
  if (scrollWidth <= 0) return;

  gsap.to(cards, {
    x: -scrollWidth,
    ease: 'none',
    scrollTrigger: {
      id: 'work-experience-pin',
      trigger: section,
      pin: true,
      scrub: true,
      start: 'center center',
      end: () => `+=${scrollWidth}`,
    },
  });
}
