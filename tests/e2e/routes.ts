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
  /**
   * The only long-form routes with a non-empty `heroImage` are the three essays —
   * every published note has `heroImage: ''`. Named separately because the hero
   * figure's geometry is otherwise untestable, and that is exactly how it once
   * shipped unstyled.
   */
  pageWithHeroImage: '/essays/deconstructionofcodm/',
  /** First part of a series: related notes take the "More in <series>" branch. */
  seriesPart: '/series/prototyping-in-code/01-the-problem/',
  /** Renders the inline TocPillDemo component. */
  pageWithTocDemo: '/live/',
  /** The three TocPillDemo variants, plus the real pill on the same page. */
  pageWithTocAnatomy: '/playground/floating-table-of-contents/',
  /** The SeriesCardDemo, shipped and deliberately broken side by side. */
  pageWithSeriesCardDemo: '/playground/series-master-card/',
  /** Full-bleed video breakout. Also carries lightbox-able content images. */
  workWithVideo: '/works/01Farmville3/',
  /** Content images that open the zoomable lightbox. */
  pageWithLightbox: '/works/01Farmville3/',
  /** Garden strip canvas + tag chips over a post grid. */
  pageWithGardenStrip: '/garden/',
  /** Three URL-less books and one web link: the References shelf's books + web groups. */
  pageWithBookReferences: '/essays/aidsingames/',
  /** Five web links: the References shelf with a single group. */
  pageWithWebReferences: '/essays/deconstructionofcodm/',
} as const;
