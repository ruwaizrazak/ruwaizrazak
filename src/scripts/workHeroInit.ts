/**
 * Runs the hero scroll-height/blur effect only on work detail pages.
 * WorkLayout is shared, so we gate on the /works/ path before initialising.
 */
import { initHeroScrollHeight } from './work-hero-scroll';

export function initWorkHero() {
  if (window.location.pathname.startsWith('/works/')) {
    initHeroScrollHeight();
  }
}
