import type { CollectionEntry } from 'astro:content';
import { optimizeImage, type OptimizedImg } from './optimizeImage';

/**
 * LEARN: WorkCard/WorkCardCompact are Svelte components, so they can't take a
 * CollectionEntry and resolve its hero image themselves (astro:assets is async
 * and Astro-only). These mappers flatten an entry into plain card props with the
 * image already resolved, so the shaping lives in one place instead of being
 * repeated at every call site (/works, /, /about, OtherWorksSection).
 */

export interface WorkCardProps {
  id: string;
  title: string;
  description?: string;
  role?: string;
  duration: string;
  href: string;
  image: OptimizedImg | null;
}

export interface WorkCardCompactProps {
  title: string;
  role?: string;
  company: string;
  duration: string;
  url: string;
  image: OptimizedImg | null;
}

export async function toWorkCard(entry: CollectionEntry<'works'>): Promise<WorkCardProps> {
  const { title, description, role, duration, heroImage } = entry.data;
  return {
    id: entry.id,
    title,
    description,
    role,
    duration,
    href: `/works/${entry.id}`,
    image: await optimizeImage(heroImage),
  };
}

export async function toWorkCardCompact(
  entry: CollectionEntry<'works'>,
): Promise<WorkCardCompactProps> {
  const { title, role, company, duration, heroImage } = entry.data;
  return {
    title,
    role,
    company,
    duration,
    url: `/works/${entry.id}`,
    image: await optimizeImage(heroImage),
  };
}

/** Resolve a list in one parallel pass. */
export const toWorkCards = (entries: CollectionEntry<'works'>[]) =>
  Promise.all(entries.map(toWorkCard));

export const toWorkCardsCompact = (entries: CollectionEntry<'works'>[]) =>
  Promise.all(entries.map(toWorkCardCompact));
