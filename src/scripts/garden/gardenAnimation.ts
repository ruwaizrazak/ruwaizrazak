/**
 * Garden character walk — drives the sprite along the curve as the reader
 * scrolls the card grid.
 *
 * LEARN: this module MUST be imported dynamically, from inside onMount. It calls
 * gsap.registerPlugin(ScrollTrigger) at module scope, and ScrollTrigger needs
 * `window` — a Svelte island's <script> is evaluated on the server during SSR, so
 * a top-level import here crashes the build with
 * "gsap.registerPlugin is not a function".
 *
 * LEARN: it no longer reaches into the DOM for its own elements or writes the
 * sprite's data attributes itself. The island passes its elements in and receives
 * motion/facing through callbacks, so Svelte stays the single owner of those
 * attributes. It also returns a cleanup that kills only the ScrollTrigger and
 * tween IT created — the previous version opened with
 * `ScrollTrigger.getAll().forEach(st => st.kill())`, destroying every
 * ScrollTrigger on the page including ones other features owned.
 */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { curveY } from './curveUtils';
import { setupGardenStrip, IDLE_FRAME } from './gardenSetup';

gsap.registerPlugin(ScrollTrigger);

const RUN_THRESHOLD = 250; // px — distance above which character runs
const WALK_SPEED = 100; // px/s
const RUN_SPEED = 250; // px/s

export type CharacterMotion = 'idle' | 'walk' | 'run';

export interface GardenOptions {
  /** The .garden-strip element rendered by the island. */
  strip: HTMLElement;
  /** The .character element inside it. */
  character: HTMLElement;
  /** Selector for the section whose scroll drives the walk. */
  triggerSelector: string;
  onMotion: (motion: CharacterMotion) => void;
  onFacing: (facingRight: boolean) => void;
}

export function initGarden(options: GardenOptions): () => void {
  const { strip, character, triggerSelector, onMotion, onFacing } = options;
  const container = strip.parentElement;
  if (!container) return () => {};

  const handle = setupGardenStrip({ container, curveB: 0, positionPlants: true });
  if (!handle) return () => {};

  character.style.setProperty('--idle-frame', String(IDLE_FRAME));
  gsap.set(character, {
    x: 30,
    y: curveY(20 + 30, handle.strip.offsetWidth, 0) - handle.charHeight(),
  });

  let walkTween: gsap.core.Tween | null = null;

  // Character walks toward the scroll-defined target position.
  const trigger = ScrollTrigger.create({
    trigger: triggerSelector,
    start: 'top 50%',
    end: 'bottom bottom',
    onUpdate(self) {
      const p = self.progress;
      const vw = window.innerWidth;
      const targetX = 10 + p * (vw - 110);

      const currentX = gsap.getProperty(character, 'x') as number;
      const distance = Math.abs(targetX - currentX);
      if (distance < 5) return;

      onFacing(targetX > currentX);
      const isRunning = distance > RUN_THRESHOLD;
      onMotion(isRunning ? 'run' : 'walk');

      walkTween?.kill();

      const speed = isRunning ? RUN_SPEED : WALK_SPEED;
      const duration = Math.max(0.3, Math.min(2, distance / speed));

      walkTween = gsap.to(character, {
        x: targetX,
        duration,
        ease: 'none',
        onUpdate() {
          const cx = gsap.getProperty(character, 'x') as number;
          gsap.set(character, { y: curveY(20 + cx, vw, 0) - handle.charHeight() });
        },
        onComplete() {
          onMotion('idle');
          walkTween = null;
        },
      });
    },
  });

  ScrollTrigger.refresh();

  return () => {
    walkTween?.kill();
    trigger.kill();
    handle.cleanup?.();
  };
}
