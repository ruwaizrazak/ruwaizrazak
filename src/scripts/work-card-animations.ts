import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Parallax zoom effect on work-card hero images.
 * Images scale from 1.5 → 1 as they scroll through the viewport.
 * Cleans up previous triggers before re-initializing (view-transition safe).
 */
export function initWorkCardAnimations() {
  ScrollTrigger.getAll()
    .filter(st => st.vars.trigger && (st.vars.trigger as Element).classList?.contains('work-card-image'))
    .forEach(st => st.kill());

  document.querySelectorAll('.work-card-image').forEach(img => {
    gsap.fromTo(img, { scale: 1.5 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: img,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });
  });
}
