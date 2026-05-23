/**
 * Morph controller — owns the pill's open/close behavior.
 *
 * The single `morph(direction)` function unifies what used to be separate
 * `expand()` / `collapse()` functions. Per-direction values (durations,
 * eases, target widths/radii) are picked once at the top; the residual
 * structural asymmetry (open uses `.fromTo` for panel + width, close uses
 * `.to`; only open gets scale anticipation) lives in a single `if (isOpen)`
 * branch inside the function.
 *
 * Closure-scoped — no module-level mutable state. Each `createMorphController`
 * call binds to one set of DOM refs and returns a fresh interface.
 */

import gsap from 'gsap';
import {
  reduceMotion,
  OPEN_DURATION,
  CLOSE_DURATION,
  OPEN_EASE_SPRING,
  OPEN_EASE_SMOOTH,
  CLOSE_EASE,
  ROUND_FULL,
  ROUND_2XL,
} from './constants';

export interface MorphRefs {
  pillEl: HTMLElement;
  panelEl: HTMLElement;
  chevronEl: SVGElement;
  toggleEl: HTMLButtonElement;
}

export interface MorphController {
  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;
  isOpen: () => boolean;
}

type Direction = 'open' | 'close';

export function createMorphController(refs: MorphRefs): MorphController {
  const { pillEl, panelEl, chevronEl, toggleEl } = refs;

  // LEARN: bi-directional morph — DI's signature is both width and height
  // growing together. State-driven (not content-driven) so scroll-spy label
  // changes don't jitter the collapsed pill's width. Widths come from CSS
  // custom properties on the pill (defined in TocPill.astro's <style> with
  // @media overrides for lg and xl) — reading them at animation call time
  // means resizing across breakpoints picks up new values on the next
  // open/close, no resize listener required.
  function readWidths(): { compact: string; expanded: string } {
    const cs = getComputedStyle(pillEl);
    return {
      compact: cs.getPropertyValue('--toc-w-compact').trim() || '14rem',
      expanded: cs.getPropertyValue('--toc-w-expanded').trim() || '22rem',
    };
  }

  // LEARN: GPU compositor hints — pill has backdrop-blur which is expensive
  // to repaint each frame. Promote both animated elements while the tween
  // runs, then clear so the hint doesn't leak GPU memory after.
  function setMorphHints(on: boolean) {
    panelEl.style.willChange = on ? 'height' : '';
    pillEl.style.willChange = on ? 'width, border-radius, transform' : '';
  }

  // LEARN: jump to the open/closed end state with zero animation. Shared by
  // the `reduceMotion` paths AND the `reset()` call that initTOC uses on
  // first paint + after every view-transition.
  function applyMorphState(direction: Direction) {
    const { compact, expanded } = readWidths();
    if (direction === 'open') {
      panelEl.style.display = 'block';
      gsap.set(panelEl, { height: 'auto', opacity: 1, clearProps: 'height,willChange' });
      gsap.set(pillEl, { width: expanded, borderRadius: ROUND_2XL, scale: 1, willChange: '' });
      gsap.set(chevronEl, { rotate: 180 });
    } else {
      gsap.set(panelEl, { height: 0, opacity: 0, display: 'none', willChange: '' });
      gsap.set(pillEl, { width: compact, borderRadius: ROUND_FULL, scale: 1, willChange: '' });
      gsap.set(chevronEl, { rotate: 0 });
    }
  }

  function morph(direction: Direction) {
    const isOpen = direction === 'open';

    // 1. Attribute toggle — these drive the CSS crossfade (label, dot)
    //    and ARIA state. Done synchronously so screen readers and the
    //    [data-expanded] style rules pick up the change before any frame
    //    of animation runs.
    if (isOpen) {
      pillEl.setAttribute('data-expanded', '');
      toggleEl.setAttribute('aria-expanded', 'true');
      panelEl.setAttribute('aria-hidden', 'false');
    } else {
      pillEl.removeAttribute('data-expanded');
      toggleEl.setAttribute('aria-expanded', 'false');
      panelEl.setAttribute('aria-hidden', 'true');
    }

    // LEARN: kill any in-flight tweens before starting a new one so a rapid
    // toggle never strands properties at intermediate values.
    gsap.killTweensOf([panelEl, pillEl, chevronEl]);

    if (reduceMotion) {
      applyMorphState(direction);
      return;
    }

    // Direction-parametrised values picked once.
    const duration = isOpen ? OPEN_DURATION : CLOSE_DURATION;
    const widthEase = isOpen ? OPEN_EASE_SPRING : CLOSE_EASE;
    // LEARN: same `smooth` ease drives height/opacity (would otherwise reveal
    // empty space if it overshot `height: 'auto'`) AND borderRadius (would
    // clamp to 0 for a frame if back.out overshot past 16px into negatives).
    const smoothEase = isOpen ? OPEN_EASE_SMOOTH : CLOSE_EASE;
    const chevronEase = isOpen ? OPEN_EASE_SPRING : CLOSE_EASE;
    const chevronTarget = isOpen ? 180 : 0;
    const { compact, expanded } = readWidths();

    if (isOpen) panelEl.style.display = 'block';
    setMorphHints(true);

    const tl = gsap.timeline({
      defaults: { duration },
      onComplete: () => {
        if (isOpen) {
          // LEARN: GSAP leaves panel.height set to the measured natural
          // height (e.g. "382px"). Clearing returns control to CSS so the
          // panel reflows naturally if the viewport or font size changes.
          panelEl.style.height = '';
        } else {
          panelEl.style.display = 'none';
        }
        setMorphHints(false);
      },
    });

    if (isOpen) {
      // SMOOTH ease — height/opacity overshoot would briefly show empty
      // space below content.
      tl.fromTo(
        panelEl,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, ease: smoothEase },
        0,
      );
      // SPRING ease — width morph is the visual hook of the DI feel.
      tl.fromTo(pillEl, { width: compact }, { width: expanded, ease: widthEase }, 0);
      // SMOOTH ease — radius overshoot would push past 16 into negative
      // (9983px delta × ~7% back.out overshoot ≈ -700px), which browsers
      // clamp to 0 → corners flash sharp for a frame.
      tl.fromTo(
        pillEl,
        { borderRadius: ROUND_FULL },
        { borderRadius: ROUND_2XL, ease: smoothEase },
        0,
      );
      // LEARN: scale anticipation — pill "breathes" briefly (1 → 1.02 → 1,
      // squash-and-stretch lite). Single keyframed tween so the two
      // segments read as one logical gesture; each keyframe's ease applies
      // to the segment ending at that keyframe, preserving the original
      // power2.out → back.out(1.4) curve. GSAP composes the resulting
      // transform onto Tailwind's existing translate(-50%).
      tl.to(
        pillEl,
        {
          duration: OPEN_DURATION,
          keyframes: {
            '0%': { scale: 1, ease: 'none' },
            '40%': { scale: 1.02, ease: 'power2.out' },
            '100%': { scale: 1, ease: OPEN_EASE_SPRING },
          },
        },
        0,
      );
    } else {
      // Close uses `.to` for panel + width — GSAP infers the start from the
      // current rendered value, which lets a rapid toggle interrupt
      // gracefully (continues from wherever it was, vs snapping).
      tl.to(panelEl, { height: 0, opacity: 0 }, 0);
      tl.to(pillEl, { width: compact }, 0);
      // Radius STILL needs `.fromTo` — see the ROUND_FULL comment in
      // constants.ts for why we can't read it back.
      tl.fromTo(pillEl, { borderRadius: ROUND_2XL }, { borderRadius: ROUND_FULL }, 0);
    }

    tl.to(chevronEl, { rotate: chevronTarget, ease: chevronEase }, 0);
  }

  return {
    open: () => morph('open'),
    close: () => morph('close'),
    toggle: () => morph(pillEl.hasAttribute('data-expanded') ? 'close' : 'open'),
    reset: () => applyMorphState('close'),
    isOpen: () => pillEl.hasAttribute('data-expanded'),
  };
}
