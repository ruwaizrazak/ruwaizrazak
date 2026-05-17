/**
 * Floating TOC pill: scroll-spy + click-to-toggle expansion.
 * Headings are scraped from the rendered article DOM so the script
 * works for both MDX and HTML content.
 *
 * Idempotent: initOnLoad fires on both DOMContentLoaded and astro:page-load,
 * so this can run multiple times per page. Event listeners are wired exactly
 * once (gated by `wired`); per-page state (heading list + IntersectionObserver)
 * is rebuilt on every call so view-transition navigation picks up the new article.
 */

let wired = false;
let observer: IntersectionObserver | null = null;
let pillEl: HTMLElement | null = null;
let panelEl: HTMLElement | null = null;
let toggleEl: HTMLButtonElement | null = null;
let labelEl: HTMLElement | null = null;
let listEl: HTMLElement | null = null;
let currentHeadings: Element[] = [];

function expand() {
  if (!pillEl || !toggleEl || !panelEl) return;
  pillEl.setAttribute('data-expanded', '');
  toggleEl.setAttribute('aria-expanded', 'true');
  panelEl.classList.remove('hidden');
  panelEl.setAttribute('aria-hidden', 'false');
}
function collapse() {
  if (!pillEl || !toggleEl || !panelEl) return;
  pillEl.removeAttribute('data-expanded');
  toggleEl.setAttribute('aria-expanded', 'false');
  panelEl.classList.add('hidden');
  panelEl.setAttribute('aria-hidden', 'true');
}
function toggle() {
  if (!pillEl) return;
  if (pillEl.hasAttribute('data-expanded')) collapse();
  else expand();
}

function buildTOCList(container: HTMLElement, headings: Element[]) {
  container.innerHTML = '';
  headings.forEach((heading) => {
    const id = heading.id;
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = heading.textContent ?? '';
    btn.dataset.tocLink = id;
    btn.className = [
      'block w-full text-left',
      'px-3 py-1.5 rounded-lg',
      'text-sm font-sans leading-snug',
      'text-white/50 hover:text-white hover:bg-white/5',
      'transition-colors duration-150',
      'cursor-pointer',
    ].join(' ');
    btn.addEventListener('click', () => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      collapse();
    });
    li.appendChild(btn);
    container.appendChild(li);
  });
}

function setActive(id: string) {
  if (!listEl || !labelEl) return;
  listEl.querySelectorAll<HTMLElement>('[data-toc-link]').forEach((el) => {
    const isActive = el.dataset.tocLink === id;
    el.classList.toggle('!text-white', isActive);
    el.classList.toggle('bg-white/10', isActive);
    el.classList.toggle('font-medium', isActive);
  });
  const match = currentHeadings.find((h) => h.id === id);
  if (match) labelEl.textContent = match.textContent ?? '';
}

export function initTOC() {
  const article = document.querySelector('.note-layout article');
  if (!article) return;

  const pill = document.querySelector('[data-toc-pill]') as HTMLElement | null;
  if (!pill) return;

  // Reparent once to escape any GSAP transform stacking context.
  if (pill.parentNode !== document.body) document.body.appendChild(pill);

  pillEl = pill;
  toggleEl = pill.querySelector('[data-toc-toggle]') as HTMLButtonElement | null;
  panelEl = pill.querySelector('[data-toc-panel]') as HTMLElement | null;
  listEl = pill.querySelector('[data-toc-list]') as HTMLElement | null;
  labelEl = pill.querySelector('[data-toc-current]') as HTMLElement | null;
  if (!toggleEl || !panelEl || !listEl || !labelEl) return;

  // Collect H1/H2/H3, auto-generate IDs.
  const rawHeadings = Array.from(article.querySelectorAll('h1, h2, h3'));
  rawHeadings.forEach((h) => {
    if (!h.id) {
      h.id = (h.textContent ?? '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
    }
  });
  currentHeadings = rawHeadings.filter((h) => h.id);

  if (currentHeadings.length === 0) {
    pill.hidden = true;
    observer?.disconnect();
    observer = null;
    return;
  }
  pill.hidden = false;

  // Rebuild list + reset collapsed label to first heading.
  buildTOCList(listEl, currentHeadings);
  labelEl.textContent = currentHeadings[0].textContent ?? 'On this page';
  // Reset to collapsed in case a prior page left it expanded.
  collapse();

  // Refresh scroll-spy observer for the new article.
  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length === 0) return;
      const top = visible.reduce((a, b) =>
        a.boundingClientRect.top < b.boundingClientRect.top ? a : b
      );
      setActive(top.target.id);
    },
    { rootMargin: '0px 0px -60% 0px', threshold: 0 }
  );
  currentHeadings.forEach((h) => observer!.observe(h));

  // Wire listeners exactly once across the lifetime of the page.
  if (wired) return;
  wired = true;

  toggleEl.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });
  document.addEventListener('click', (e) => {
    if (!pillEl?.hasAttribute('data-expanded')) return;
    if (e.target instanceof Node && pillEl.contains(e.target)) return;
    collapse();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pillEl?.hasAttribute('data-expanded')) collapse();
  });
}
