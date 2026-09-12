/**
 * Report when an element enters/leaves the viewport.
 *
 * LEARN: replaces the hand-rolled IntersectionObserver setup that
 * related-notes.ts and otherWorksAnimation.ts each built themselves. As an
 * action the observer is disconnected automatically when the element goes away,
 * so there is nothing to guard against re-initialisation.
 */
export interface IntersectOptions {
  /** Called with the latest intersection state. */
  onChange: (entry: IntersectionObserverEntry) => void;
  /** Stop observing after the first intersection. */
  once?: boolean;
  threshold?: number | number[];
  rootMargin?: string;
}

export function intersect(node: Element, options: IntersectOptions) {
  let current = options;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        current.onChange(entry);
        if (current.once && entry.isIntersecting) observer.disconnect();
      }
    },
    { threshold: current.threshold ?? 0, rootMargin: current.rootMargin },
  );
  observer.observe(node);

  return {
    update(next: IntersectOptions) {
      current = next;
    },
    destroy() {
      observer.disconnect();
    },
  };
}
