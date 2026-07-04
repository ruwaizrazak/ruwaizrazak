/**
 * "Other works" card stagger-reveal for work detail pages.
 * Cards fade/slide/scale in on a GSAP timeline that plays when the section
 * scrolls into view and reverses when it scrolls back above the viewport.
 */
import gsap from 'gsap';

export function initOtherWorksAnimation() {
  const section = document.querySelector<HTMLElement>('[data-other-works]');
  const cards = section?.querySelectorAll<HTMLElement>('[data-other-works-card]');
  if (!section || !cards?.length) return;
  if (section.dataset.inited === '1') return;
  section.dataset.inited = '1';

  const cardDelay = 0.2;
  const cardDuration = 0.4;

  gsap.set(cards, { opacity: 0, y: 24, scale: 0.92 });

  const tl = gsap.timeline({ paused: true });
  cards.forEach((card, i) => {
    tl.to(
      card,
      { opacity: 1, y: 0, scale: 1, duration: cardDuration, ease: 'power2.out' },
      `+=${i === 0 ? 0 : cardDelay}`
    );
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (!e || !section) return;
      const rect = section.getBoundingClientRect();
      const isAbove = rect.top < 0;

      if (e.isIntersecting) {
        tl.play();
      } else if (isAbove) {
        tl.reverse();
      }
    },
    { threshold: 0.1 }
  );
  observer.observe(section);
}
