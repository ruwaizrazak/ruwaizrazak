import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-driven animations for note post pages:
 * - NoteMain overlaps the hero section as user scrolls down
 * - Hero content fades out on scroll
 * - Hero background zooms out from 1.15 → 1.0
 *
 * Each trigger has a unique ID so we can clean up without
 * affecting other ScrollTriggers (e.g. RelatedNotes).
 */
export function initNotePostAnimations() {
  // Kill only our own ScrollTriggers (not RelatedNotes' ones)
  ['note-hero-overlap', 'note-hero-fade', 'note-hero-zoom'].forEach(id => {
    ScrollTrigger.getById(id)?.kill();
  });

  const heroContent = document.getElementById('note-hero-content');
  const heroBg = document.getElementById('note-hero-bg');
  const mainWrapper = document.querySelector<HTMLElement>('.note-main-wrapper');

  if (!heroContent || !mainWrapper) return;

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

  // Hero content fades out on scroll
  gsap.to(heroContent, {
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      id: 'note-hero-fade',
      trigger: heroContent,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });

  // Hero background zooms out from 1.15 to 1.0
  if (heroBg) {
    gsap.to(heroBg, {
      scale: 1.0,
      ease: 'none',
      scrollTrigger: {
        id: 'note-hero-zoom',
        trigger: heroBg,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
}
