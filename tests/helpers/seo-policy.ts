/**
 * The SEO rules from CLAUDE.md, expressed once so the integrity suite and any
 * future check share a single definition of "correct".
 */

export const DESCRIPTION_MAX = 160;

/**
 * /embed/** is an iframe embed target: it deliberately mirrors the title,
 * description and body of /works/<slug>, and carries no header or footer.
 * Holding it to the uniqueness/canonical/OG rules would report duplicates that
 * are by design, so it is exempt.
 *
 * Note: these routes ARE still emitted into the sitemap (see
 * utils/sitemapData.mjs) — a known, accepted duplication.
 */
export function isSeoExempt(route: string): boolean {
  return route.startsWith('/embed/');
}

/** Routes that exist for machines, not readers. */
export function isUtilityRoute(route: string): boolean {
  return route.startsWith('/og/') || route.endsWith('.png/') || route === '/404/';
}

/** Reader-facing pages — the set the full checklist applies to. */
export function isContentRoute(route: string): boolean {
  return !isSeoExempt(route) && !isUtilityRoute(route);
}

/** Heading levels must descend one step at a time (h2 → h3, never h2 → h4). */
export function findHeadingJumps(levels: number[]): Array<{ from: number; to: number }> {
  const jumps: Array<{ from: number; to: number }> = [];
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) jumps.push({ from: levels[i - 1], to: levels[i] });
  }
  return jumps;
}
