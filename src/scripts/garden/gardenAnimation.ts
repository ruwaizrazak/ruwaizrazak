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

const BASE_CHAR_HEIGHT = 50;
const IDLE_FRAME = 2; // 0–8: which sprite frame to show when not scrolling
const RUN_THRESHOLD = 250; // px — distance above which character runs
const WALK_SPEED = 100;    // px/s
const RUN_SPEED = 250;     // px/s

function getScale(): number {
  return Math.min(220, window.innerHeight * 0.5) / 220;
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
  let charHeight = BASE_CHAR_HEIGHT * s;
  const stripCurveB = 0; // flat baseline — no oval animation

  function applyScale() {
    s = getScale();
    charHeight = BASE_CHAR_HEIGHT * s;
    if (strip) {
      strip.style.setProperty('--garden-scale', String(s));
      gsap.set(strip, {
        height: 30,
        borderRadius: 0,
      });
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

    if (grassCanvas && grassCtx) {
      sizeGrassCanvas(grassCanvas, grassCtx, strip.offsetWidth, s);
    }

    repositionAll();

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
    gsap.set(character, { x: 30, y: curveY(20 + 30, strip.offsetWidth, 0) - charHeight });
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
            gsap.set(character, { y: curveY(20 + cx, vw, 0) - charHeight });
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
