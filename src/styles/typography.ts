// ============================================================================
// Card typography — single source of truth.
// ----------------------------------------------------------------------------
// LEARN: every card on the site (ContentCard, WorkCard, WorkCardCompact,
// SeriesPostCard, SeriesCard) used to hard-code its own font sizes, so the same
// "role" drifted between components (titles ranged text-4xl→text-5xl, dates
// text-xs→text-base, meta text-xs→text-base). These tokens centralise the four
// roles so the scale — and its responsive breakpoints — lives in ONE place.
//
// Each token owns ONLY typographic properties: font-family, size (+ md/lg/xl
// breakpoints), weight, line-height, letter-spacing, transform. Colour,
// opacity, margins, hover/group state, and layout stay inline in the component
// so the same token works in any context (light/dark, hover, etc.).
//
// Usage: class={`${cardType.title} text-syoro group-hover:text-link mb-4`}
// ============================================================================

export const cardType = {
  // Header / card title.
  // Breakpoints: text-xl → md:2xl → lg:3xl → xl:4xl.
  title: 'font-serif text-2xl lg:text-2xl xl:text-3xl 3xl:text-5xl leading-tight font-medium',

  // Body description / excerpt.
  // Breakpoints: text-base → lg:xl → xl:2xl.
  description: 'font-serif text-base lg:text-xl xl:text-2xl 3xl:text-3xl',

  // Publish date line. Single size, no breakpoints.
  date: 'font-sans text-base xl:text-lg',

  // Eyebrow labels, tags, role, company·duration, maturity, info lines.
  // Single size, no breakpoints.
  meta: 'font-sans text-base xl:text-lg uppercase tracking-widest',
} as const;

export type CardType = typeof cardType;

// ============================================================================
// Page / layout typography — single source of truth.
// ----------------------------------------------------------------------------
// LEARN: page-level type (hero titles, lead paragraphs, section headings, the
// post metadata row) was scattered across PageHero, NotePostHero, the About
// page, the live index, and the homepage — so the same role drifted (the live
// "Then" h1 was text-7xl while every other page title was text-9xl). These
// tokens centralise the page roles the same way cardType does for cards.
//
// As with cardType, each token owns ONLY typographic properties. Colour,
// opacity, margins, max-width, and layout stay inline in the component
// (PageHero passes them via class:list arrays).
// ============================================================================

export const pageType = {
  // Page title / hero h1. Breakpoints: 5xl → sm:6xl → md:7xl → lg:9xl.
  header: 'font-sans text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-medium md:leading-16 lg:leading-26 -tracking-wider',

  // Hero subtitle / lead line. Breakpoints: 2xl → md:3xl → lg:4xl.
  description: 'font-serif text-xl md:text-2xl lg:text-3xl 3xl:text-4xl',

  // Large in-page secondary heading (e.g. live month headings).
  // Breakpoints: 3xl → md:5xl → lg:6xl.
  subtitle: 'font-sans text-3xl md:text-5xl lg:text-6xl font-medium',

  // Eyebrow / section label ("Work Experience", "Selected Works"). Single size.
  sectionLabel: 'font-sans text-xl font-semibold uppercase tracking-widest',

  // Post metadata / date row. Single size.
  date: 'font-sans text-lg uppercase',
} as const;

export type PageType = typeof pageType;
