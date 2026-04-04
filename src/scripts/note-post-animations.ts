import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-driven animations for note post pages:
 * - NoteMain overlaps the hero section as user scrolls down
 * (Hero fade + background zoom removed for minimalist hero)
 *
 * Each trigger has a unique ID so we can clean up without
 * affecting other ScrollTriggers (e.g. RelatedNotes).
 */
export function initNotePostAnimations() {
  // Kill only our own ScrollTriggers (not RelatedNotes' ones)
  ScrollTrigger.getById('note-hero-overlap')?.kill();

  const mainWrapper = document.querySelector<HTMLElement>('.note-main-wrapper');

  if (!mainWrapper) return;

  // NoteMain overlaps hero as user scrolls
  gsap.to(mainWrapper, {
    y: -120,
    ease: 'none',
    scrollTrigger: {
      id: 'note-hero-overlap',
      trigger: mainWrapper,
      start: 'top bottom',
      end: 'top 40%',
      scrub: true,
    },
  });

}
