import gsap from 'gsap';
import { interpolate } from 'flubber';

type CursorState = 'default' | 'text' | 'button' | 'work-card' | 'essay-card' | 'image-card';
type IconState = 'default' | 'text' | 'pointer';

const TEXT_TAGS = new Set([
  'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'SPAN', 'LI', 'BLOCKQUOTE', 'LABEL',
  'EM', 'STRONG', 'B', 'I', 'U', 'SMALL', 'MARK',
]);

const CURSOR_PATHS: Record<IconState, string> = {
  default: 'M12,0 A12,12,0,1,1,12,24 A12,12,0,1,1,12,0Z',
  text: 'M9 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-1.5v14H14a1 1 0 1 1 0 2h-4a1 1 0 1 1 0-2h1.5V5H10a1 1 0 0 1-1-1Z',
  pointer: 'M19.4,21.6c-.3.5-.8.8-1.2,1.2-1.5,1.2-3.5,1.3-5.3,1s-1.7-.5-2.5-1-1-.7-1.3-1.2c-.7-.8-1.1-1.4-1.6-2.4s-.6-.8-.9-1.2l-1.1-1.2-1.1-1.2-1.1-1.2c-.3-.4-.6-.8-.5-1.3s.3-.8.7-1.1.8-.3,1.1,0c.6.3,1,.9,1.4,1.4l1,1.1c.3.3.9.4,1.2,0s.3-.4.3-.6V1.3c0-.7,1-1.7,1.8-1.2s.9.7.9,1.3v10.2c0,.2.2.3.3.3.2,0,.3-.1.3-.3v-3.4c0-.3.1-.6.3-.9.5-.7,1.5-.7,2,0s.4.5.4.8v3.6c0,.1.2.3.3.3s.3-.1.3-.3v-2.8c0-.7.7-1.3,1.3-1.3s1.3.6,1.3,1.3v2.8c0,.1.2.3.3.3s.3-.1.3-.3v-1.7c0-.7.6-1.3,1.3-1.3s1.3.6,1.3,1.3v7.7c0,1-.4,2-.8,2.9s-.5.8-.7,1.2Z',
};

function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function isTextElement(el: Element): boolean {
  return TEXT_TAGS.has(el.tagName);
}

// Interpolator cache for smooth transitions
type MorphKey = `${IconState}->${IconState}`;
const interpolatorCache = new Map<MorphKey, (t: number) => string>();

function getInterpolator(from: IconState, to: IconState): (t: number) => string {
  const key: MorphKey = `${from}->${to}`;
  let fn = interpolatorCache.get(key);
  if (!fn) {
    fn = interpolate(CURSOR_PATHS[from], CURSOR_PATHS[to], { maxSegmentLength: 2 });
    interpolatorCache.set(key, fn);
  }
  return fn;
}

let cursor: HTMLElement | null = null;
let dot: HTMLElement | null = null;
let label: HTMLElement | null = null;
let morphSvg: SVGSVGElement | null = null;
let morphPath: SVGPathElement | null = null;
let state: CursorState = 'default';
let currentIconState: IconState = 'default';
let morphTween: gsap.core.Tween | null = null;
let mouseX = -100;
let mouseY = -100;
let curX = -100;
let curY = -100;
let hasMoved = false;
let initialized = false;

const SVG_NS = 'http://www.w3.org/2000/svg';

function createCursorDOM(): void {
  let existing = document.getElementById('custom-cursor');
  if (existing) {
    if (!existing.parentNode) {
      document.body.appendChild(existing);
    }
    cursor = existing;
    dot = cursor.querySelector('.cursor-dot');
    label = cursor.querySelector('.cursor-label');
    morphSvg = cursor.querySelector('.cursor-morph-svg');
    morphPath = cursor.querySelector('.cursor-morph-path');
    return;
  }

  cursor = document.createElement('div');
  cursor.id = 'custom-cursor';

  dot = document.createElement('div');
  dot.className = 'cursor-dot';

  label = document.createElement('div');
  label.className = 'cursor-label';

  morphSvg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  morphSvg.setAttribute('viewBox', '0 0 24 24');
  morphSvg.classList.add('cursor-morph-svg');

  morphPath = document.createElementNS(SVG_NS, 'path') as SVGPathElement;
  morphPath.classList.add('cursor-morph-path');
  morphPath.setAttribute('d', CURSOR_PATHS.default);
  morphPath.setAttribute('fill', 'var(--color-cursor)');

  morphSvg.appendChild(morphPath);
  dot.appendChild(label);
  dot.appendChild(morphSvg);
  cursor.appendChild(dot);
  document.body.appendChild(cursor);
}

function morphToIcon(target: IconState): void {
  if (!morphPath || !morphSvg) return;
  if (currentIconState === target && !morphTween) return;

  const toPath = CURSOR_PATHS[target];
  let interp: (t: number) => string;

  if (morphTween) {
    // Mid-morph interruption: interpolate from current path state
    morphTween.kill();
    morphTween = null;
    const currentD = morphPath.getAttribute('d')!;
    interp = interpolate(currentD, toPath, { maxSegmentLength: 2 });
  } else {
    interp = getInterpolator(currentIconState, target);
  }

  currentIconState = target;
  const progress = { t: 0 };

  morphTween = gsap.to(progress, {
    t: 1,
    duration: 0.3,
    ease: 'power2.out',
    onUpdate: () => {
      morphPath!.setAttribute('d', interp(progress.t));
    },
    onComplete: () => {
      morphTween = null;
    },
  });
}

function setState(newState: CursorState): void {
  if (state === newState || !dot || !label || !morphSvg || !morphPath) return;
  state = newState;

  switch (newState) {
    case 'default':
      gsap.to(dot, {
        width: 18,
        height: 18,
        borderRadius: '50%',
        backgroundColor: 'transparent',
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(label, { opacity: 0, duration: 0.15 });
      gsap.to(morphSvg, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
      morphToIcon('default');
      break;

    case 'text':
      gsap.to(dot, {
        width: 28,
        height: 28,
        borderRadius: '50%',
        backgroundColor: 'transparent',
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(label, { opacity: 0, duration: 0.15 });
      gsap.to(morphSvg, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
      morphToIcon('text');
      break;

    case 'button':
      gsap.to(dot, {
        width: 28,
        height: 28,
        borderRadius: '50%',
        backgroundColor: 'transparent',
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(label, { opacity: 0, duration: 0.15 });
      gsap.to(morphSvg, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' });
      morphToIcon('pointer');
      break;

    case 'work-card':
      morphToPill('Read more...');
      break;

    case 'essay-card':
      morphToPill('Read Essay');
      break;

    case 'image-card':
      morphToPill('view image');
      break;
  }
}

function morphToPill(text: string): void {
  if (!dot || !label || !morphSvg) return;
  label.textContent = text;

  gsap.to(dot, {
    width: 160,
    height: 40,
    borderRadius: '20px',
    backgroundColor: 'var(--color-cursor)',
    duration: 0.3,
    ease: 'power2.out',
  });
  gsap.to(morphSvg, { opacity: 0, scale: 0.5, duration: 0.2, ease: 'power2.in' });
  gsap.to(label, {
    opacity: 1,
    duration: 0.25,
    delay: 0.1,
    ease: 'power2.out',
  });
}

function handleMouseOver(e: MouseEvent): void {
  const target = e.target as Element;
  if (!target || !target.closest) return;

  if (target.closest('.work-card-container')) {
    setState('work-card');
    return;
  }
  if (target.closest('.essay-card-link')) {
    setState('essay-card');
    return;
  }
  if (target.closest('.image-card')) {
    setState('image-card');
    return;
  }

  if (target.closest('a, button, [role="button"]')) {
    setState('button');
    return;
  }

  if (isTextElement(target)) {
    setState('text');
    return;
  }
}

function handleMouseOut(e: MouseEvent): void {
  const target = e.target as Element;
  const related = e.relatedTarget as Element | null;
  if (!target || !target.closest) return;

  if (target.closest('.work-card-container') && (!related || !related.closest?.('.work-card-container'))) {
    setState('default');
    return;
  }
  if (target.closest('.essay-card-link') && (!related || !related.closest?.('.essay-card-link'))) {
    setState('default');
    return;
  }
  if (target.closest('.image-card') && (!related || !related.closest?.('.image-card'))) {
    setState('default');
    return;
  }

  const buttonEl = target.closest('a, button, [role="button"]');
  if (buttonEl && (!related || !related.closest('a, button, [role="button"]'))) {
    if (related && isTextElement(related)) {
      setState('text');
    } else {
      setState('default');
    }
    return;
  }

  if (isTextElement(target)) {
    if (related && (related.closest?.('.work-card-container') || related.closest?.('.essay-card-link') || related.closest?.('.image-card'))) return;
    if (related && related.closest?.('a, button, [role="button"]')) return;
    if (related && isTextElement(related)) return;
    setState('default');
  }
}

function onMouseMove(e: MouseEvent): void {
  mouseX = e.clientX;
  mouseY = e.clientY;

  if (!hasMoved && cursor) {
    hasMoved = true;
    curX = mouseX;
    curY = mouseY;
    gsap.set(cursor, { x: curX, y: curY });
    gsap.to(cursor, { opacity: 1, duration: 0.3 });
  }

  if (e.buttons === 1 && state === 'text') return;
}

function tick(): void {
  if (!cursor || !hasMoved) return;
  const speed = 0.15;
  curX += (mouseX - curX) * speed;
  curY += (mouseY - curY) * speed;
  gsap.set(cursor, { x: curX, y: curY });
}

function onDocumentLeave(): void {
  if (cursor) gsap.to(cursor, { opacity: 0, duration: 0.3 });
}

function onDocumentEnter(): void {
  if (cursor && hasMoved) gsap.to(cursor, { opacity: 1, duration: 0.3 });
}

export function initCustomCursor(): void {
  if (isTouchDevice()) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  createCursorDOM();

  // Restore cursor visibility on re-init (hasMoved persists across navigations)
  if (hasMoved && cursor) {
    gsap.set(cursor, { opacity: 1 });
  }

  if (initialized) return;
  initialized = true;

  gsap.ticker.add(tick);

  document.addEventListener('mousemove', onMouseMove);

  document.body.addEventListener('mouseover', handleMouseOver);
  document.body.addEventListener('mouseout', handleMouseOut);

  document.documentElement.addEventListener('mouseleave', onDocumentLeave);
  document.documentElement.addEventListener('mouseenter', onDocumentEnter);
}
