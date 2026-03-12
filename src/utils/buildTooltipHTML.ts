/**
 * Builds the HTML string for a link tooltip.
 *
 * Uses string concatenation instead of template literals because the Astro
 * compiler misparses backtick-based HTML that contains nested tags. This is
 * a known constraint — do not refactor to template literals without verifying
 * the Astro build still passes.
 */

/** SVG icon shown in tooltip header for external links (arrow pointing outward). */
const EXTERNAL_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>';

/** SVG icon shown in tooltip header for internal links (left-pointing chevron). */
const INTERNAL_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>';

export interface TooltipHTMLInput {
  title: string | null;
  description: string | null;
  favicon: string;
  displayUrl: string;
  isExternal: boolean;
}

/**
 * Returns the tooltip's inner HTML, or an empty string if there is
 * nothing meaningful to display (no title and no description).
 */
export function buildTooltipHTML({
  title,
  description,
  favicon,
  displayUrl,
  isExternal,
}: TooltipHTMLInput): string {
  if (!title && !description) return '';

  const icon = isExternal ? EXTERNAL_SVG : INTERNAL_SVG;

  let html = '<div class="link-tooltip">';

  if (title) {
    html +=
      '<div class="link-tooltip-header">' +
      icon +
      '<span class="link-tooltip-title">' +
      title +
      '</span></div>';
  }

  if (description) {
    html += '<p class="link-tooltip-description">' + description + '</p>';
  }

  html +=
    '<div class="link-tooltip-footer">' +
    '<img src="' + favicon + '" width="14" height="14" alt="" />' +
    '<span class="link-tooltip-url">' + displayUrl + '</span>' +
    '</div>';

  html += '</div>';
  return html;
}
