// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { initNavigation } from '../../../src/scripts/navigation';

const CLOSED = 'hidden opacity-0 scale-95 pointer-events-none';

/** Minimal stand-in for Navigation.astro — only the ids the script reaches for. */
function renderNav() {
  document.body.innerHTML = `
    <button id="desktop-menu-button">Garden</button>
    <div id="desktop-dropdown" class="${CLOSED}"><a href="/notes/">Notes</a></div>
    <svg id="desktop-chevron"></svg>

    <button id="about-menu-button">About</button>
    <div id="about-dropdown" class="${CLOSED}"></div>
    <svg id="about-chevron"></svg>

    <button id="mobile-menu-button"></button>
    <span id="mobile-menu-icon"></span>
    <span id="mobile-close-icon" class="hidden"></span>
    <div id="mobile-overlay" class="hidden"></div>
    <aside id="mobile-sidebar" class="translate-x-full"><a href="/about/">About</a></aside>
    <button id="mobile-close-button"></button>
    <main id="outside">body</main>`;
  initNavigation();
  return {
    gardenBtn: document.getElementById('desktop-menu-button')!,
    gardenDrop: document.getElementById('desktop-dropdown')!,
    gardenChevron: document.getElementById('desktop-chevron')!,
    aboutBtn: document.getElementById('about-menu-button')!,
    aboutDrop: document.getElementById('about-dropdown')!,
    mobileBtn: document.getElementById('mobile-menu-button')!,
    sidebar: document.getElementById('mobile-sidebar')!,
    overlay: document.getElementById('mobile-overlay')!,
    closeBtn: document.getElementById('mobile-close-button')!,
    outside: document.getElementById('outside')!,
  };
}

const isOpen = (el: Element) => el.classList.contains('pointer-events-auto');

beforeEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

describe('desktop dropdowns', () => {
  it('opens on click and flips the chevron', () => {
    const { gardenBtn, gardenDrop, gardenChevron } = renderNav();
    gardenBtn.click();

    expect(isOpen(gardenDrop)).toBe(true);
    expect(gardenDrop.classList.contains('hidden')).toBe(false);
    expect(gardenChevron.classList.contains('rotate-180')).toBe(true);
  });

  it('closes on a second click', () => {
    const { gardenBtn, gardenDrop } = renderNav();
    gardenBtn.click();
    gardenBtn.click();
    expect(isOpen(gardenDrop)).toBe(false);
  });

  it('closes when a click lands outside it', () => {
    const { gardenBtn, gardenDrop, outside } = renderNav();
    gardenBtn.click();
    outside.click();
    expect(isOpen(gardenDrop)).toBe(false);
  });

  it('stays open when the click is inside the dropdown itself', () => {
    const { gardenBtn, gardenDrop } = renderNav();
    gardenBtn.click();
    gardenDrop.querySelector('a')!.click();
    expect(isOpen(gardenDrop)).toBe(true);
  });

  it('closes the other dropdown when one is opened', () => {
    const { gardenBtn, gardenDrop, aboutBtn, aboutDrop } = renderNav();
    gardenBtn.click();
    aboutBtn.click();

    expect(isOpen(aboutDrop)).toBe(true);
    expect(isOpen(gardenDrop)).toBe(false);
  });

  it('does not re-bind when init runs twice on the same DOM', () => {
    // initOnLoad double-fires on first load; a second binding would toggle
    // twice per click and the menu would never open.
    const { gardenBtn, gardenDrop } = renderNav();
    initNavigation();

    gardenBtn.click();
    expect(isOpen(gardenDrop)).toBe(true);
  });
});

describe('mobile sidebar', () => {
  it('slides in and locks body scroll', () => {
    const { mobileBtn, sidebar, overlay } = renderNav();
    mobileBtn.click();

    expect(sidebar.classList.contains('translate-x-full')).toBe(false);
    expect(overlay.classList.contains('hidden')).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('swaps the menu icon for the close icon', () => {
    const { mobileBtn } = renderNav();
    mobileBtn.click();

    expect(document.getElementById('mobile-menu-icon')!.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('mobile-close-icon')!.classList.contains('hidden')).toBe(false);
  });

  it('restores body scroll when closed', () => {
    const { mobileBtn, closeBtn } = renderNav();
    mobileBtn.click();
    closeBtn.click();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes when the overlay is tapped', () => {
    const { mobileBtn, overlay, sidebar } = renderNav();
    mobileBtn.click();
    overlay.click();
    expect(sidebar.classList.contains('translate-x-full')).toBe(true);
  });

  it('closes when a link inside it is followed', () => {
    const { mobileBtn, sidebar } = renderNav();
    mobileBtn.click();
    sidebar.querySelector('a')!.click();
    expect(sidebar.classList.contains('translate-x-full')).toBe(true);
  });

  it('closes when the viewport grows past the md breakpoint', () => {
    const { mobileBtn, sidebar } = renderNav();
    mobileBtn.click();

    (window as any).innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));
    expect(sidebar.classList.contains('translate-x-full')).toBe(true);
  });

  it('closes desktop dropdowns when the viewport shrinks below md', () => {
    const { gardenBtn, gardenDrop } = renderNav();
    gardenBtn.click();

    (window as any).innerWidth = 500;
    window.dispatchEvent(new Event('resize'));
    expect(isOpen(gardenDrop)).toBe(false);
  });
});
