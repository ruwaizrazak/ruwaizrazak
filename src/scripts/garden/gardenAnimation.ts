import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import {
  curveY,
  positionPlantsAlongCurve,
  positionTreesAlongCurve,
  positionFlowersAlongCurve,
} from './curveUtils';
import { initGrassCanvas, sizeGrassCanvas, drawGrass } from './grassCanvas';

gsap.registerPlugin(ScrollTrigger);

const BASE_HEIGHT = 220;
const BASE_B = 110;
const BASE_CHAR_HEIGHT = 50;
const IDLE_FRAME = 2; // 0–8: which sprite frame to show when not scrolling
const RUN_THRESHOLD = 250; // px — distance above which character runs
const WALK_SPEED = 100;    // px/s
const RUN_SPEED = 250;     // px/s

function getScale(): number {
  return Math.min(BASE_HEIGHT, window.innerHeight * 0.5) / BASE_HEIGHT;
}

export function initGarden() {
  if (!document.querySelector('.garden-body')) return;

  ScrollTrigger.getAll().forEach(st => st.kill());

  const strip = document.querySelector('.garden-strip') as HTMLElement;
  const character = document.querySelector('.character') as HTMLElement;
  const stickyBar = document.getElementById('garden-sticky-bar');
  const grassCanvas = document.querySelector('.grass-canvas') as HTMLCanvasElement;
  const grassCtx = grassCanvas ? initGrassCanvas(grassCanvas) : null;

  let s = getScale();
  let bMax = BASE_B * s;
  let charHeight = BASE_CHAR_HEIGHT * s;
  let stripCurveB = bMax;

  function applyScale() {
    s = getScale();
    bMax = BASE_B * s;
    charHeight = BASE_CHAR_HEIGHT * s;
    if (strip) {
      strip.style.setProperty('--garden-scale', String(s));
      // Update strip dimensions when not mid-scroll
      const introTrigger = ScrollTrigger.getById('intro-strip');
      if (!introTrigger || introTrigger.progress === 0) {
        stripCurveB = bMax;
        gsap.set(strip, {
          height: BASE_HEIGHT * s,
          borderRadius: `50% 50% 0 0 / ${bMax}px ${bMax}px 0 0`,
        });
      }
    }
  }

  function repositionAll() {
    if (!strip) return;
    positionPlantsAlongCurve(strip, stripCurveB);
    positionTreesAlongCurve(strip, stripCurveB);
    positionFlowersAlongCurve(strip, stripCurveB);
    if (grassCanvas && grassCtx) {
      drawGrass(grassCanvas, grassCtx, strip.offsetWidth, stripCurveB, s);
    }
  }

  if (strip) {
    applyScale();
    repositionAll();

    if (grassCanvas && grassCtx) {
      sizeGrassCanvas(grassCanvas, grassCtx, strip.offsetWidth, s);
    }

    window.addEventListener('resize', () => {
      applyScale();
      if (grassCanvas && grassCtx) {
        sizeGrassCanvas(grassCanvas, grassCtx, strip.offsetWidth, s);
      }
      repositionAll();
    });
  }

  if (character && strip) {
    character.style.setProperty('--idle-frame', String(IDLE_FRAME));
    gsap.set(character, { x: 30, y: curveY(20 + 30, strip.offsetWidth, bMax) - charHeight });
  }

  // Sticky bar: fades in when cards section enters viewport center
  if (stickyBar) {
    ScrollTrigger.create({
      trigger: '.garden-cards-section',
      start: 'top center',
      end: 'top top',
      onEnter: () => {
        stickyBar.classList.remove('opacity-0', 'pointer-events-none');
        stickyBar.classList.add('opacity-100');
      },
      onLeaveBack: () => {
        stickyBar.classList.add('opacity-0', 'pointer-events-none');
        stickyBar.classList.remove('opacity-100');
      },
    });
  }

  // Strip shrinks + curve flattens as user scrolls through intro
  ScrollTrigger.create({
    id: 'intro-strip',
    trigger: '.intro-section',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate(self) {
      const p = self.progress;
      const baseH = BASE_HEIGHT * s;
      const minH = 30;
      stripCurveB = bMax * (1 - p);

      gsap.set('.garden-strip', {
        height: baseH - (baseH - minH) * p,
        borderRadius: `${50 * (1 - p)}% ${50 * (1 - p)}% 0 0 / ${bMax * (1 - p)}px ${bMax * (1 - p)}px 0 0`,
      });

      gsap.set('.garden-description', { opacity: 1 - p });

      repositionAll();

      if (character && strip) {
        const charX = 20 + (gsap.getProperty(character, 'x') as number);
        gsap.set(character, { y: curveY(charX, strip.offsetWidth, stripCurveB) - charHeight });
      }
    },
  });

  // Character walks toward scroll-defined target position
  if (character) {
    let walkTween: gsap.core.Tween | null = null;

    ScrollTrigger.create({
      trigger: '.garden-cards-section',
      start: 'top 50%',
      end: 'bottom bottom',
      onUpdate(self) {
        const p = self.progress;
        const vw = window.innerWidth;
        const targetX = 10 + p * (vw - 110);
        const introTrigger = ScrollTrigger.getById('intro-strip');
        const b = introTrigger ? bMax * (1 - introTrigger.progress) : bMax;

        const currentX = gsap.getProperty(character, 'x') as number;
        const distance = Math.abs(targetX - currentX);

        if (distance < 5) return;

        character.dataset.facingRight = String(targetX > currentX);
        const isRunning = distance > RUN_THRESHOLD;
        character.dataset.motion = isRunning ? 'run' : 'walk';

        if (walkTween) walkTween.kill();

        const speed = isRunning ? RUN_SPEED : WALK_SPEED;
        const duration = Math.max(0.3, Math.min(2, distance / speed));

        walkTween = gsap.to(character, {
          x: targetX,
          duration,
          ease: 'none',
          onUpdate() {
            const cx = gsap.getProperty(character, 'x') as number;
            gsap.set(character, { y: curveY(20 + cx, vw, b) - charHeight });
          },
          onComplete() {
            character.dataset.motion = 'idle';
            walkTween = null;
          },
        });
      },
    });
  }

  ScrollTrigger.refresh();
}
