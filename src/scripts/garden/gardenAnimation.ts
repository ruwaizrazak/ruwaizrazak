import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { curveY } from './curveUtils';
import { setupGardenStrip, BASE_CHAR_HEIGHT, IDLE_FRAME } from './gardenSetup';

gsap.registerPlugin(ScrollTrigger);

const RUN_THRESHOLD = 250; // px — distance above which character runs
const WALK_SPEED = 100;    // px/s
const RUN_SPEED = 250;     // px/s

export function initGarden() {
  if (!document.querySelector('.garden-body')) return;

  ScrollTrigger.getAll().forEach(st => st.kill());

  const container = document.querySelector('.garden-strip')?.parentElement;
  if (!container) return;

  const handle = setupGardenStrip({
    container,
    curveB: 0,
    positionPlants: true,
  });
  if (!handle) return;

  const { strip } = handle;
  const character = document.querySelector('.character') as HTMLElement;
  const stickyBar = document.getElementById('garden-sticky-bar');

  if (character && strip) {
    character.style.setProperty('--idle-frame', String(IDLE_FRAME));
    gsap.set(character, {
      x: 30,
      y: curveY(20 + 30, strip.offsetWidth, 0) - handle.charHeight(),
    });
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
            gsap.set(character, { y: curveY(20 + cx, vw, 0) - handle.charHeight() });
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
