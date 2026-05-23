/**
 * List rendering — populates the expanded panel with one button per heading.
 *
 * Pure function — no closure-scoped state. The orchestrator passes an
 * `onSelect` callback so this module doesn't need to know about morph or
 * scrolling behavior.
 */

import { TOC_BTN_CLASS } from './constants';

export function buildList(
  container: HTMLElement,
  headings: Element[],
  onSelect: (id: string) => void,
) {
  // LEARN: blowing away innerHTML implicitly removes the child buttons'
  // event listeners (no manual removeEventListener needed) since the nodes
  // themselves are garbage-collected.
  container.innerHTML = '';

  headings.forEach((heading) => {
    const id = heading.id;
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.tocLink = id;
    btn.className = TOC_BTN_CLASS;

    // Timeline slot — outlined ring on every row; the active row's slot
    // contains the pulsating dot (CSS pseudo-element on [data-active]).
    const slot = document.createElement('span');
    slot.className = 'toc-slot';
    slot.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'toc-text truncate flex-1 min-w-0';
    text.textContent = heading.textContent ?? '';

    btn.appendChild(slot);
    btn.appendChild(text);

    btn.addEventListener('click', () => onSelect(id));

    li.appendChild(btn);
    container.appendChild(li);
  });
}
