/**
 * Shared MDX component registry.
 *
 * LEARN: MDX's `components` prop accepts CUSTOM NAMES, not just HTML element
 * overrides — so `<Callout>` resolves inside a .mdx file with no import line in
 * that file at all. Registering everything here removed 31 import statements
 * from 22 content files and makes a component move a one-line change.
 *
 * The keys are the names content authors write in MDX, which is why a few differ
 * from their filenames (References -> references.svelte, TargetAudience ->
 * targetedAudience.svelte, SideBySide -> SideBySideView via sideBySide.astro).
 *
 * LEARN: entries are a mix of .svelte and .astro on purpose:
 *  - .svelte  — static components, rendered with zero client JS.
 *  - .astro   — either a resolver that must await astro:assets (Image, ImagesLeft,
 *               sideBySide) or a build-time fetch (Link), OR a thin wrapper that
 *               mounts a hydrated island. A component passed through this map
 *               cannot itself carry a client:* directive (astro#5853), but an
 *               .astro component used in MDX can — which is what the wrappers are for.
 */

// Resolver shells (.astro — async / astro:assets / build-time fetch)
import Link from './Link.astro';
import Image from './Image.astro';
import ImagesLeft from './ImagesLeft.astro';
import SideBySide from './sideBySide.astro';

// Interactive (.astro for now — these become island wrappers in Phase 4)
import VideoBreakout from '../VideoBreakout.astro';
import TocPillDemo from './TocPillDemo.astro';

// Static Svelte components — zero JS
import Callout from './Callout.svelte';
import SideNote from './SideNote.svelte';
import WorkSection from './WorkSection.svelte';
import WorkImageGrid from './WorkImageGrid.svelte';
import ProjectOverview from './ProjectOverview.svelte';
import References from './references.svelte';
import TargetAudience from './targetedAudience.svelte';
import Quote from './Quote.svelte';
import EngagementBarChart from './EngagementBarChart.svelte';
import AppStoreBadge from '../AppStoreBadge.svelte';
import GooglePlayBadge from '../GooglePlayBadge.svelte';

export const mdxComponents = {
  // HTML element override: every markdown link becomes a tooltip-bearing Link.
  a: Link,

  /**
   * LEARN: a `#` heading inside a post is a SECTION of that post, not the page
   * title — the layout already renders the title as the page's one <h1>. Several
   * posts authored top-level sections with `#`, which produced 6 h1s on one essay
   * and broke both the "exactly one h1" and heading-hierarchy rules in CLAUDE.md.
   *
   * Remapping here makes that structural: authors can keep writing `#` for a
   * top-level section and it lands at the correct level, rather than every future
   * post having to remember the convention. Pages that nest content deeper
   * override this (see live/index.astro).
   */
  h1: 'h2',

  // Custom names, exactly as content authors write them.
  Link,
  Image,
  ImagesLeft,
  SideBySide,
  VideoBreakout,
  TocPillDemo,
  Callout,
  SideNote,
  WorkSection,
  WorkImageGrid,
  ProjectOverview,
  References,
  TargetAudience,
  Quote,
  EngagementBarChart,
  AppStoreBadge,
  GooglePlayBadge,
};
