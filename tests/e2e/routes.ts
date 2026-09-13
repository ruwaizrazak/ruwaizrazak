/**
 * Representative routes, named once so a slug change is a one-line fix.
 * Each is chosen for a specific property, noted alongside.
 */
export const ROUTES = {
  home: '/',
  about: '/about/',
  garden: '/garden/',
  notesIndex: '/notes/',
  essaysIndex: '/essays/',
  seriesIndex: '/series/',
  worksIndex: '/works/',
  live: '/live/',

  /** 24 article headings — the TOC pill's proving ground. Also has related notes. */
  pageWithToc: '/essays/deconstructionofcodm/',
  /** Five related cards, proving the full set renders without pagination. */
  pageWithRelated: '/essays/deconstructionofcodm/',
  /** 9 tooltip-bearing links. */
  pageWithTooltips: '/essays/deconstructionofcodm/',
  /** Carries the fixture webmentions — see tests/fixtures/webmentions.sample.json. */
  pageWithWebmentions: '/notes/whythissite/',
  /** First part of a series: related notes take the "More in <series>" branch. */
  seriesPart: '/series/prototyping-in-code/01-the-problem/',
  /** Renders the inline TocPillDemo component. */
  pageWithTocDemo: '/live/',
  /** Full-bleed video breakout. Also carries lightbox-able content images. */
  workWithVideo: '/works/01Farmville3/',
  /** Content images that open the zoomable lightbox. */
  pageWithLightbox: '/works/01Farmville3/',
  /** Garden strip canvas + tag chips over a post grid. */
  pageWithGardenStrip: '/garden/',
} as const;
