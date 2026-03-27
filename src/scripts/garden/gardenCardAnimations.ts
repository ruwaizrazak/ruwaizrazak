import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Parallax zoom on garden card hero images.
 * Images scale from 1.3 → 1 as they scroll through the viewport.
 * Mirrors initWorkCardAnimations but uses a subtler scale for smaller cards.
 */
export function initGardenCardAnimations() {
  ScrollTrigger.getAll()
    .filter(st => (st.vars.trigger as Element)?.classList?.contains('garden-card-image'))
    .forEach(st => st.kill());

  document.querySelectorAll('.garden-card-image').forEach(img => {
    gsap.fromTo(img, { scale: 1.3 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: img,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
}
