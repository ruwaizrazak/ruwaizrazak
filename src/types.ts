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
  variant?: 'card' | 'compact';
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
