/**
 * Thin utility module for DotNav component.
 * Wires click events as custom DOM events and provides imperative helpers.
 */

export function initDotNav(el: HTMLElement): () => void {
  const prevBtn = el.querySelector<HTMLElement>('.dot-nav-prev');
  const nextBtn = el.querySelector<HTMLElement>('.dot-nav-next');
  const playPauseBtn = el.querySelector<HTMLElement>('.dot-nav-playpause');
  const dots = el.querySelectorAll<HTMLElement>('.dot-nav-dot');

  const handlers: [EventTarget, string, EventListener][] = [];

  function on(target: EventTarget, event: string, handler: EventListener) {
    target.addEventListener(event, handler);
    handlers.push([target, event, handler]);
  }

  if (prevBtn) {
    on(prevBtn, 'click', () => el.dispatchEvent(new CustomEvent('dotnav:prev')));
  }
  if (nextBtn) {
    on(nextBtn, 'click', () => el.dispatchEvent(new CustomEvent('dotnav:next')));
  }
  if (playPauseBtn) {
    on(playPauseBtn, 'click', () => el.dispatchEvent(new CustomEvent('dotnav:playpause')));
  }
  dots.forEach((dot) => {
    on(dot, 'click', () => {
      const index = Number(dot.dataset.dotIndex);
      if (!isNaN(index)) {
        el.dispatchEvent(new CustomEvent('dotnav:dotclick', { detail: { index } }));
      }
    });
  });

  return () => {
    handlers.forEach(([target, event, handler]) => target.removeEventListener(event, handler));
  };
}

export function setActiveDot(nav: HTMLElement, index: number): void {
  const dots = nav.querySelectorAll<HTMLElement>('.dot-nav-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
    const progress = dot.querySelector<HTMLElement>('.dot-nav-progress');
    if (progress) progress.style.width = '0%';
  });
}

export function setDotProgress(nav: HTMLElement, index: number, pct: number): void {
  const dots = nav.querySelectorAll<HTMLElement>('.dot-nav-dot');
  const dot = dots[index];
  if (!dot) return;
  const progress = dot.querySelector<HTMLElement>('.dot-nav-progress');
  if (progress) progress.style.width = `${pct}%`;
}

export function setVisibleDotCount(nav: HTMLElement, count: number): void {
  const dots = nav.querySelectorAll<HTMLElement>('.dot-nav-dot');
  dots.forEach((dot, i) => {
    dot.style.display = i < count ? '' : 'none';
  });
}
