// Reusable scroll-scrubbed height reveal animation.
// Measures the reveal element's full height, collapses it,
// then uses a GSAP ScrollTrigger to scrub the height on scroll.

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export interface ScrubRevealOptions {
  section: HTMLElement;
  reveal: HTMLElement;
  initFlag: string;
  start?: string;
  end?: string;
  onRevealed?: (fullHeight: number) => void;
  onHidden?: (fullHeight: number) => void;
  beforeMeasure?: () => void;
  afterMeasure?: () => void;
}

export function createScrubReveal(opts: ScrubRevealOptions): number | null {
  const {
    section,
    reveal,
    initFlag,
    start = 'top 90%',
    end = 'top 50%',
    onRevealed,
    onHidden,
    beforeMeasure,
    afterMeasure,
  } = opts;

  if (section.dataset[initFlag] === '1') return null;
  section.dataset[initFlag] = '1';

  // Measure full height
  if (beforeMeasure) beforeMeasure();
  reveal.style.height = 'auto';
  const fullHeight = reveal.offsetHeight;
  reveal.style.height = '0px';
  if (afterMeasure) afterMeasure();

  // Scrubbed height animation
  gsap.to(reveal, {
    height: fullHeight,
    ease: 'none',
    scrollTrigger: { trigger: section, start, end, scrub: true },
  });

  // Post-reveal callback
  ScrollTrigger.create({
    trigger: section,
    start: end,
    onEnter: () => {
      reveal.style.height = 'auto';
      onRevealed?.(fullHeight);
    },
    onLeaveBack: () => {
      reveal.style.height = fullHeight + 'px';
      onHidden?.(fullHeight);
    },
  });

  return fullHeight;
}
