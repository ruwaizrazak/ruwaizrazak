// Centralized type definitions — extracted from 6+ files where types like
// Maturity and collection names were defined inline in each component.

export type Maturity = 'seed' | 'plant' | 'tree';

export type CollectionName = 'notes' | 'essays' | 'casestudies' | 'books' | 'playground' | 'works' | 'live' | 'series' | 'seriesPosts';

export interface ContentCardProps {
  title: string;
  description?: string;
  pubDate: Date;
  heroImage?: string;
  url: string;
  imageHeight?: string;
  maturity?: Maturity;
  collection?: string;
  variant?: 'card' | 'compact' | 'wide';
  transitionName?: string;
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

export interface SocialLinkData {
  href: string;
  label: string;
  rel?: string;
  class?: string;
  diamondPath: string;
  symbolPath: string;
  symbolFill?: 'stroke' | 'fill';
  symbolStrokeAttrs?: string;
}
