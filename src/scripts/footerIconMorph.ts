/**
 * Footer contact icons: morph each icon between a diamond outline and its
 * brand symbol on hover, using flubber path interpolation driven by GSAP.
 */
import gsap from 'gsap';
import { interpolate } from 'flubber';

export function initContactIconMorph() {
  const links = document.querySelectorAll('.contact-link');

  links.forEach((link) => {
    const path = link.querySelector('.contact-icon-path') as SVGPathElement | null;
    if (!path) return;

    const diamondD = (link as HTMLElement).dataset.diamond;
    const symbolD = (link as HTMLElement).dataset.symbol;
    if (!diamondD || !symbolD) return;

    // Single interpolator — toSymbol(0) = diamond, toSymbol(1) = symbol
    const morph = interpolate(diamondD, symbolD, { maxSegmentLength: 10 });
    let activeTween: gsap.core.Tween | null = null;
    const progress = { t: 0 };

    link.addEventListener('mouseenter', () => {
      if (activeTween) activeTween.kill();
      activeTween = gsap.to(progress, {
        t: 1,
        duration: 0.4 * (1 - progress.t),
        ease: 'power2.inOut',
        onUpdate: () => path.setAttribute('d', morph(progress.t)),
      });
    });

    link.addEventListener('mouseleave', () => {
      if (activeTween) activeTween.kill();
      activeTween = gsap.to(progress, {
        t: 0,
        duration: 0.4 * progress.t,
        ease: 'power2.inOut',
        onUpdate: () => path.setAttribute('d', morph(progress.t)),
      });
    });
  });
}
