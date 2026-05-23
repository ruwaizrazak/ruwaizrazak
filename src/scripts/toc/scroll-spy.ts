/**
 * Scroll-spy — IntersectionObserver that fires when the "active" heading
 * changes (i.e. the topmost heading inside the trigger band).
 *
 * Returns a tiny `{ disconnect }` interface so the orchestrator can tear
 * down the observer cleanly before rebuilding on every initTOC call
 * (necessary because article DOM is fresh after a view-transition).
 */

export interface ScrollSpy {
  disconnect: () => void;
}

export function createScrollSpy(
  headings: Element[],
  onActive: (id: string) => void,
): ScrollSpy {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length === 0) return;
      // Of the headings currently in the viewport top-band, pick the
      // topmost one — that's the section the reader is currently in.
      const top = visible.reduce((a, b) =>
        a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
      );
      onActive(top.target.id);
    },
    // LEARN: -60% bottom margin shrinks the trigger zone to the top 40%
    // of the viewport, so a heading isn't "active" until it scrolls
    // comfortably into the upper portion of the page.
    { rootMargin: '0px 0px -60% 0px', threshold: 0 },
  );

  headings.forEach((h) => observer.observe(h));

  return {
    disconnect: () => observer.disconnect(),
  };
}
