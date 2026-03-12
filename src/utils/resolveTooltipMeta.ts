/**
 * Resolves all metadata needed to render a link tooltip.
 *
 * Orchestrates two concerns:
 *   1. Fetching title + description (via OG scraping for external links,
 *      or content-collection lookup for internal links)
 *   2. Deriving the favicon URL and display URL shown in the tooltip footer
 *
 * Returns null when there is nothing to show (no title and no description).
 */
import { fetchOgData } from './ogFetcher';
import { resolveInternalLink } from './resolveInternalLink';

export interface TooltipMeta {
  tooltipTitle: string | null;
  tooltipDesc: string | null;
  favicon: string;
  displayUrl: string;
  hasTooltip: boolean;
}

export async function resolveTooltipMeta(
  hrefStr: string,
  isExternal: boolean,
): Promise<TooltipMeta | null> {
  // Fetch title and description from the appropriate source
  let tooltipTitle: string | null = null;
  let tooltipDesc: string | null = null;

  if (isExternal) {
    const og = await fetchOgData(hrefStr);
    tooltipTitle = og.title;
    tooltipDesc = og.description;
  } else {
    const internal = await resolveInternalLink(hrefStr);
    if (internal) {
      tooltipTitle = internal.title;
      tooltipDesc = internal.description;
    }
  }

  const hasTooltip = !!(tooltipTitle || tooltipDesc);
  if (!hasTooltip) return null;

  // Derive favicon and display URL for the tooltip footer
  let favicon = '';
  let displayUrl = '';

  if (isExternal) {
    try {
      const parsed = new URL(hrefStr);
      favicon = 'https://www.google.com/s2/favicons?domain=' + parsed.hostname + '&sz=16';
      displayUrl = parsed.hostname;
    } catch {
      displayUrl = hrefStr;
    }
  } else {
    favicon = '/favicon.ico';
    displayUrl = hrefStr;
  }

  return { tooltipTitle, tooltipDesc, favicon, displayUrl, hasTooltip };
}
