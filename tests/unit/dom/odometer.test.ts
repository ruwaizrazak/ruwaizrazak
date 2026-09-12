// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * The odometer reads prefers-reduced-motion at MODULE LOAD, and drives the Web
 * Animations API — neither of which jsdom provides. So each test installs the
 * stubs first and then imports the module fresh.
 */
interface FakeAnimation {
  keyframes: Keyframe[];
  onfinish: (() => void) | null;
  cancel: () => void;
  cancelled: boolean;
}

let animations: FakeAnimation[] = [];

function installStubs(reduceMotion: boolean) {
  animations = [];

  (window as any).matchMedia = (query: string) => ({
    matches: reduceMotion && query.includes('prefers-reduced-motion: reduce'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });

  (Element.prototype as any).animate = function (keyframes: Keyframe[]) {
    const anim: FakeAnimation = {
      keyframes,
      onfinish: null,
      cancelled: false,
      cancel() {
        this.cancelled = true;
      },
    };
    animations.push(anim);
    return anim;
  };

  // The odometer calls getAnimations({ subtree: true }) to cancel in-flight work.
  (Element.prototype as any).getAnimations = () => animations.filter((a) => !a.cancelled);
}

async function loadOdometer(reduceMotion = false) {
  vi.resetModules();
  installStubs(reduceMotion);
  return await import('../../../src/scripts/toc/odometer');
}

function makeLabel() {
  document.body.innerHTML = '<span id="label"></span>';
  return document.getElementById('label') as HTMLElement;
}

const texts = (el: HTMLElement) => [...el.children].map((c) => c.textContent);

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('createOdometer', () => {
  it('sets the first label instantly, with no animation', async () => {
    const { createOdometer } = await loadOdometer();
    const label = makeLabel();
    const odo = createOdometer(label, () => 1);

    odo.setText('Opening Notes', false);

    expect(texts(label)).toEqual(['Opening Notes']);
    expect(animations).toHaveLength(0);
  });

  it('replaces rather than stacks when animate is false', async () => {
    const { createOdometer } = await loadOdometer();
    const label = makeLabel();
    const odo = createOdometer(label, () => 1);

    odo.setText('One', false);
    odo.setText('Two', false);

    expect(texts(label)).toEqual(['Two']);
  });

  it('animates the incoming label in while the outgoing one exits', async () => {
    const { createOdometer } = await loadOdometer();
    const label = makeLabel();
    const odo = createOdometer(label, () => 1);

    odo.setText('One', false);
    odo.setText('Two', true);

    // Both spans coexist during the roll; the new one is appended last so it
    // paints on top.
    expect(texts(label)).toEqual(['One', 'Two']);
    expect(animations).toHaveLength(2);
  });

  it('removes the outgoing span once its exit animation finishes', async () => {
    const { createOdometer } = await loadOdometer();
    const label = makeLabel();
    const odo = createOdometer(label, () => 1);

    odo.setText('One', false);
    odo.setText('Two', true);

    const exit = animations[1];
    exit.onfinish?.();

    expect(texts(label)).toEqual(['Two']);
  });

  it('rolls upward when the reader is scrolling down', async () => {
    const { createOdometer } = await loadOdometer();
    const label = makeLabel();
    const odo = createOdometer(label, () => 1);

    odo.setText('One', false);
    odo.setText('Two', true);

    const [enter, exit] = animations;
    expect(enter.keyframes[0].transform).toBe('translateY(100%)');
    expect(exit.keyframes[1].transform).toBe('translateY(-100%)');
  });

  it('reverses the roll when the reader is scrolling up', async () => {
    const { createOdometer } = await loadOdometer();
    const label = makeLabel();
    const odo = createOdometer(label, () => -1);

    odo.setText('One', false);
    odo.setText('Two', true);

    const [enter, exit] = animations;
    expect(enter.keyframes[0].transform).toBe('translateY(-100%)');
    expect(exit.keyframes[1].transform).toBe('translateY(100%)');
  });

  it('reads the direction at animation time, not at construction time', async () => {
    // The orchestrator owns scroll direction; the odometer must see the latest
    // value, not whatever it was when the scroll-spy observer happened to fire.
    const { createOdometer } = await loadOdometer();
    const label = makeLabel();
    let direction: 1 | -1 = 1;
    const odo = createOdometer(label, () => direction);

    odo.setText('One', false);
    direction = -1;
    odo.setText('Two', true);

    expect(animations[0].keyframes[0].transform).toBe('translateY(-100%)');
  });

  it('cancels in-flight animations so an interrupted roll strands nothing', async () => {
    const { createOdometer } = await loadOdometer();
    const label = makeLabel();
    const odo = createOdometer(label, () => 1);

    odo.setText('One', false);
    odo.setText('Two', true);
    const firstPair = animations.slice(0, 2);

    odo.setText('Three', true);

    expect(firstPair.every((a) => a.cancelled)).toBe(true);
    expect(label.children.length).toBeLessThanOrEqual(2);
    expect(texts(label)).toContain('Three');
  });

  it('skips animation entirely under prefers-reduced-motion', async () => {
    const { createOdometer } = await loadOdometer(true);
    const label = makeLabel();
    const odo = createOdometer(label, () => 1);

    odo.setText('One', false);
    odo.setText('Two', true);

    expect(animations).toHaveLength(0);
    expect(texts(label)).toEqual(['Two']);
  });
});
