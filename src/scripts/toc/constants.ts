/**
 * Motion timing + immutable config shared by every TOC module.
 * Pure data only — no DOM, no side effects beyond the one-time
 * `prefers-reduced-motion` media-query sample.
 */

// LEARN: a11y — respect prefers-reduced-motion. Sampled once at module load
// (the user is unlikely to flip the OS setting mid-session); every GSAP path
// short-circuits to an instant `gsap.set` when this is true.
export const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// LEARN: morph timing matches iOS Dynamic Island character — slightly longer
// open so the spring overshoot has time to read, snappier close. ~420ms gives
// back.out room to feel "alive"; at 300ms a spring just reads as jitter.
export const OPEN_DURATION = 0.42;
export const CLOSE_DURATION = 0.28;

// LEARN: mixed eases on a single timeline. SPRING (back.out) for the visual
// silhouette — width/radius/scale overshoot harmlessly. SMOOTH (power3.out)
// for height + opacity — overshooting `height: 'auto'` would briefly reveal
// empty space below the content. Close mirrors with power3.in because
// reverse-springs feel weird on dismissal.
export const OPEN_EASE_SPRING = 'back.out(1.4)';
export const OPEN_EASE_SMOOTH = 'power3.out';
export const CLOSE_EASE = 'power3.in';

// LEARN: string form with explicit px units. GSAP's CSSPlugin can fail to
// interpolate the `borderRadius` shorthand from a unitless number, and
// Tailwind v4's `rounded-full` resolves to `calc(infinity * 1px)` which GSAP
// can't read back as a finite starting value — fromTo() forces both endpoints.
export const ROUND_FULL = '9999px';
export const ROUND_2XL = '16px';

// LEARN: button className for every TOC row, hoisted to module scope so the
// long string is allocated once at module load instead of per-heading on each
// initTOC rebuild. Pure visual config — no dynamic bits depend on the heading.
export const TOC_BTN_CLASS = [
  // Flex row so the timeline slot (outlined ring) and the heading text align
  // horizontally. `truncate` lives on the text child so the slot doesn't get
  // clipped on long headings.
  'flex items-center gap-2.5 w-full text-left',
  'px-3 py-2 rounded-lg',
  'text-base font-sans leading-snug',
  // Pill inverts from page theme — list colors invert with it.
  // Light mode (dark pill) → white text. Dark mode (light pill) → black text.
  'text-white/50 hover:text-white hover:bg-white/5',
  'dark:text-black/50 dark:hover:text-black dark:hover:bg-black/5',
  // Press feedback: `motion-safe:active:scale-95` gives click/tap feedback
  // without needing hover (so touch users see it). `transition-all` (not just
  // colors) so the scale animates back on release. `touch-manipulation`
  // removes iOS Safari's 300ms tap delay.
  'motion-safe:active:scale-95 motion-safe:transform-gpu',
  'touch-manipulation transition-all duration-150',
  'cursor-pointer',
].join(' ');
