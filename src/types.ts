import type { OptimizedImg } from './utils/optimizeImage';
// Centralized type definitions — extracted from 6+ files where types like
// Maturity and collection names were defined inline in each component.

export type Maturity = 'seed' | 'plant' | 'tree';

export type CollectionName = 'notes' | 'essays' | 'playground' | 'works' | 'live' | 'series' | 'seriesPosts';

export interface ContentCardProps {
  title: string;
  description?: string;
  pubDate: Date;
  /**
   * LEARN: resolved by the .astro parent via optimizeImage(), not by the card.
   * Astro's <Image /> and getImage() are unreachable from a Svelte component
   * (async + astro:assets), so optimization stays on the Astro side and the card
   * receives flat, serialisable attributes.
   */
  image?: OptimizedImg | null;
  url: string;
  imageHeight?: string;
  maturity?: Maturity;
  collection?: string;
  variant?: 'card' | 'compact' | 'wide' | 'series';
  /** Heading level for the card title: 2 directly under a page <h1>, 3 under a section. */
  headingLevel?: 2 | 3;
  transitionName?: string;
  // Series-only (variant='series'): metadata footer + a linked post-preview list.
  // `heroImage` doubles as the series featured image (rendered as a background).
  startedDate?: Date;
  lastUpdated?: Date;
  postCount?: number;
  posts?: { title: string; description: string; url: string }[];
}

/**
 * Browser-safe data for a garden card. Content collection entries also carry the
 * complete source body, file path, and digest; none of those belong in an island's
 * serialized props when the card only renders this small projection.
 */
export interface GardenCardProps {
  id: string;
  collection: CollectionName;
  title: string;
  description: string;
  pubDate: Date;
  tags: string[];
  maturity?: Maturity;
  image: OptimizedImg | null;
  startedDate?: Date;
  lastUpdated?: Date;
  postCount?: number;
  posts?: NonNullable<ContentCardProps['posts']>;
}

// LEARN: WebMention types follow the JF2 format from webmention.io API.
// brid.gy bridges Bluesky/Twitter mentions into this standard format.
export interface WebMentionAuthor {
  type: string;
  name: string;
  photo: string;
  url: string;
}

export interface WebMention {
  type: string;
  author: WebMentionAuthor;
  url: string;
  content?: { html?: string; text?: string };
  published?: string;
  'wm-received': string;
  'wm-id': number;
  'wm-source': string;
  'wm-target': string;
  'wm-property': 'like-of' | 'repost-of' | 'mention-of' | 'in-reply-to' | 'bookmark-of';
  name?: string;
  'in-reply-to'?: string;
  'like-of'?: string;
  'bookmark-of'?: string;
  'mention-of'?: string;
}

export interface WebMentionCache {
  lastFetched: string | null;
  children: WebMention[];
}
