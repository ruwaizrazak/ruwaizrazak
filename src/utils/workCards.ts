import type { CollectionEntry } from 'astro:content';
import { optimizeCoverPicture, type OptimizedPicture } from './optimizeImage';
import type { SizeSlot } from './coverSizes';

/**
 * LEARN: WorkCard/WorkCardCompact are Svelte components, so they can't take a
 * CollectionEntry and resolve its hero image themselves (astro:assets is async
 * and Astro-only). These mappers flatten an entry into plain card props with the
 * image already resolved, so the shaping lives in one place instead of being
 * repeated at every call site (/works, /, /about, OtherWorksSection).
 */

/** WorkCard draws its image in a 4:3 box; WorkCardCompact draws it in `.card-band`'s 16:10. */
export const WORK_CARD_ASPECT = 4 / 3;
export const WORK_CARD_COMPACT_ASPECT = 16 / 10;

// LEARN: each slot is the widest measured CSS width of the image box in that range (swept 320–2560px,
// 2026-09-19). Overshooting costs a few KB; undershooting would serve a blurry image.
export const WORK_CARD_SLOTS = {
  home: [
    { media: '(min-width: 1024px)', width: 'calc((100vw - 208px) * 2 / 3)' },
    { media: '(min-width: 768px)', width: 'calc((100vw - 144px) * 2 / 3)' },
    { width: 'calc(100vw - 36px)' },
  ],
  works: [
    { media: '(min-width: 768px)', width: 'calc((100vw - 375px) / 3)' },
    { width: 'calc(100vw - 196px)' },
  ],
} satisfies Record<string, SizeSlot[]>;

export const WORK_CARD_COMPACT_SLOTS = {
  about: [
    { media: '(min-width: 1280px)', width: '350px' },
    { media: '(min-width: 1024px)', width: '500px' },
    { media: '(min-width: 768px)', width: '360px' },
    { media: '(min-width: 640px)', width: '280px' },
    { width: 'max(216px, 100vw - 128px)' },
  ],
  otherWorks: [
    { media: '(min-width: 1536px)', width: 'calc(50vw - 144px)' },
    { media: '(min-width: 1280px)', width: '620px' },
    { media: '(min-width: 1024px)', width: '500px' },
    { media: '(min-width: 768px)', width: '370px' },
    { media: '(min-width: 640px)', width: '290px' },
    { width: 'calc(100vw - 108px)' },
  ],
} satisfies Record<string, SizeSlot[]>;

export interface WorkCardProps {
  id: string;
  title: string;
  description?: string;
  role?: string;
  duration: string;
  href: string;
  image: OptimizedPicture | null;
}

export interface WorkCardCompactProps {
  title: string;
  role?: string;
  company: string;
  duration: string;
  url: string;
  image: OptimizedPicture | null;
}

export async function toWorkCard(entry: CollectionEntry<'works'>, slots: SizeSlot[]): Promise<WorkCardProps> {
  const { title, description, role, duration, heroImage } = entry.data;
  return {
    id: entry.id,
    title,
    description,
    role,
    duration,
    href: `/works/${entry.id}`,
    image: await optimizeCoverPicture(heroImage, slots, WORK_CARD_ASPECT),
  };
}

export async function toWorkCardCompact(entry: CollectionEntry<'works'>, slots: SizeSlot[]): Promise<WorkCardCompactProps> {
  const { title, role, company, duration, heroImage } = entry.data;
  return {
    title,
    role,
    company,
    duration,
    url: `/works/${entry.id}`,
    image: await optimizeCoverPicture(heroImage, slots, WORK_CARD_COMPACT_ASPECT),
  };
}

/** Resolve a list in one parallel pass. */
export const toWorkCards = (entries: CollectionEntry<'works'>[], slots: SizeSlot[]) => Promise.all(entries.map((entry) => toWorkCard(entry, slots)));

export const toWorkCardsCompact = (entries: CollectionEntry<'works'>[], slots: SizeSlot[]) => Promise.all(entries.map((entry) => toWorkCardCompact(entry, slots)));
