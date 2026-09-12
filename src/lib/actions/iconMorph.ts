/**
 * Morph a footer contact icon between a diamond outline and its brand symbol
 * on hover, using flubber path interpolation driven by GSAP.
 *
 * LEARN: gsap and flubber are BOTH imported dynamically, inside the action, and
 * that is not optional. A Svelte island's <script> is evaluated on the SERVER
 * during SSR, and `import { interpolate } from 'flubber'` is a CommonJS named
 * export — importing it at module scope fails in dev SSR with
 * "Named export 'interpolate' not found". Deferring the import to the action's
 * body keeps it strictly client-side.
 *
 * LEARN: GSAP earns its place here (CLAUDE.md's tool order is CSS -> Svelte
 * built-ins -> GSAP). The morph must be interruptible mid-flight and resume
 * proportionally — `duration: 0.4 * (1 - t)` — which a CSS transition on a path
 * `d` cannot express, and flubber has no CSS equivalent at all.
 */
export interface IconMorphOptions {
  diamond: string;
  symbol: string;
}

export function iconMorph(node: HTMLElement, options: IconMorphOptions) {
  const path = node.querySelector<SVGPathElement>('.contact-icon-path');
  if (!path || !options.diamond || !options.symbol) return;

  let disposed = false;
  let cleanup: (() => void) | undefined;

  (async () => {
    const [{ default: gsap }, flubber] = await Promise.all([
      import('gsap'),
      import('flubber'),
    ]);
    if (disposed) return;

    // Single interpolator — morph(0) = diamond, morph(1) = symbol
    const morph = flubber.interpolate(options.diamond, options.symbol, {
      maxSegmentLength: 10,
    });
    const progress = { t: 0 };
    let activeTween: gsap.core.Tween | null = null;

    const tweenTo = (t: number) => {
      activeTween?.kill();
      activeTween = gsap.to(progress, {
        t,
        duration: 0.4 * Math.abs(t - progress.t),
        ease: 'power2.inOut',
        onUpdate: () => path.setAttribute('d', morph(progress.t)),
      });
    };

    const onEnter = () => tweenTo(1);
    const onLeave = () => tweenTo(0);

    node.addEventListener('mouseenter', onEnter);
    node.addEventListener('mouseleave', onLeave);

    cleanup = () => {
      activeTween?.kill();
      node.removeEventListener('mouseenter', onEnter);
      node.removeEventListener('mouseleave', onLeave);
    };
  })();

  return {
    destroy() {
      disposed = true;
      cleanup?.();
    },
  };
}
