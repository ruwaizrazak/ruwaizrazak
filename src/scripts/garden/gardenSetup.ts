// Shared garden strip setup: scaling, positioning, grass, and resize handling.
// Used by both gardenAnimation.ts (index page) and Footer.astro.

import gsap from 'gsap';
import {
  positionPlantsAlongCurve,
  positionTreesAlongCurve,
  positionFlowersAlongCurve,
} from './curveUtils';
import { initGrassCanvas, sizeGrassCanvas, drawGrass } from './grassCanvas';

export const BASE_CHAR_HEIGHT = 50;
export const IDLE_FRAME = 2;

export function getScale(): number {
  return Math.min(220, window.innerHeight * 0.5) / 220;
}

export interface GardenStripOptions {
  container: HTMLElement;
  curveB?: number;
  positionPlants?: boolean;
}

export interface GardenStripHandle {
  strip: HTMLElement;
  scale: () => number;
  charHeight: () => number;
  cleanup: () => void;
}

export function setupGardenStrip(opts: GardenStripOptions): GardenStripHandle | null {
  const { container, curveB = 0, positionPlants = false } = opts;
  const strip = container.querySelector('.garden-strip') as HTMLElement;
  if (!strip) return null;

  const grassCanvas = container.querySelector('.grass-canvas') as HTMLCanvasElement;
  const grassCtx = grassCanvas ? initGrassCanvas(grassCanvas) : null;

  let s = getScale();
  let charHeight = BASE_CHAR_HEIGHT * s;

  function layout() {
    s = getScale();
    charHeight = BASE_CHAR_HEIGHT * s;
    strip.style.setProperty('--garden-scale', String(s));
    gsap.set(strip, { height: 30, borderRadius: 0 });

    if (grassCanvas && grassCtx) {
      sizeGrassCanvas(grassCanvas, grassCtx, strip.offsetWidth, s);
      drawGrass(grassCanvas, grassCtx, strip.offsetWidth, curveB, s);
    }
    if (positionPlants) positionPlantsAlongCurve(strip, curveB);
    positionTreesAlongCurve(strip, curveB);
    positionFlowersAlongCurve(strip, curveB);
  }

  // Initial layout
  layout();

  // Debounced resize
  let rafId: number | null = null;
  const onResize = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      layout();
    });
  };
  window.addEventListener('resize', onResize);

  return {
    strip,
    scale: () => s,
    charHeight: () => charHeight,
    cleanup() {
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    },
  };
}
