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

const B_MAX = 110;
const CHAR_HEIGHT = 50;
const IDLE_FRAME = 3; // 0–8: which sprite frame to show when not scrolling

export function initGarden() {
  if (!document.querySelector('.garden-body')) return;

  ScrollTrigger.getAll().forEach(st => st.kill());

  const strip = document.querySelector('.garden-strip') as HTMLElement;
  const character = document.querySelector('.character') as HTMLElement;
  const stickyBar = document.getElementById('garden-sticky-bar');
  const grassCanvas = document.querySelector('.grass-canvas') as HTMLCanvasElement;
  const grassCtx = grassCanvas ? initGrassCanvas(grassCanvas) : null;

  let stripCurveB = B_MAX;

  function repositionAll() {
    if (!strip) return;
    positionPlantsAlongCurve(strip, stripCurveB);
    positionTreesAlongCurve(strip, stripCurveB);
    positionFlowersAlongCurve(strip, stripCurveB);
    if (grassCanvas && grassCtx) {
      drawGrass(grassCanvas, grassCtx, strip.offsetWidth, stripCurveB);
    }
  }

  if (strip) {
    repositionAll();

    if (grassCanvas && grassCtx) {
      sizeGrassCanvas(grassCanvas, grassCtx, strip.offsetWidth);
    }

    window.addEventListener('resize', () => {
      if (grassCanvas && grassCtx) {
        sizeGrassCanvas(grassCanvas, grassCtx, strip.offsetWidth);
      }
      repositionAll();
    });
  }

  if (character && strip) {
    character.style.setProperty('--idle-frame', String(IDLE_FRAME));
    gsap.set(character, { x: 30, y: curveY(20 + 30, strip.offsetWidth, B_MAX) - CHAR_HEIGHT });
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
      stripCurveB = B_MAX * (1 - p);

      gsap.set('.garden-strip', {
        height: 220 - 190 * p,
        borderRadius: `${50 * (1 - p)}% ${50 * (1 - p)}% 0 0 / ${110 * (1 - p)}px ${110 * (1 - p)}px 0 0`,
      });

      gsap.set('.garden-description', { opacity: 1 - p });

      repositionAll();

      if (character && strip) {
        const charX = 20 + (gsap.getProperty(character, 'x') as number);
        gsap.set(character, { y: curveY(charX, strip.offsetWidth, stripCurveB) - CHAR_HEIGHT });
      }
    },
  });

  // Character walks left-to-right while scrolling through cards
  if (character) {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    ScrollTrigger.create({
      trigger: '.garden-cards-section',
      start: 'top 50%',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate(self) {
        const p = self.progress;
        const vw = window.innerWidth;
        const charX = 10 + p * (vw - 110);
        const introTrigger = ScrollTrigger.getById('intro-strip');
        const b = introTrigger ? B_MAX * (1 - introTrigger.progress) : B_MAX;
        const y = curveY(20 + charX, vw, b) - CHAR_HEIGHT;

        gsap.set(character, { x: charX, y });

        const velocity = self.getVelocity();
        if (Math.abs(velocity) > 10) {
          character.dataset.walking = 'true';
          character.dataset.facingRight = String(velocity >= 0);
          if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
          idleTimer = setTimeout(() => {
            character.dataset.walking = 'false';
          }, 150);
        }
      },
    });
  }

  ScrollTrigger.refresh();
}
