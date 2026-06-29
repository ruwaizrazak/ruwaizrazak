// Extracted from index pages — each page previously had its own 8-line fetch/filter/sort block.

import { getCollection } from 'astro:content';
import type { CollectionName } from '../types';

/**
 * Fetch a single collection, filter to published entries, sort by pubDate desc,
 * and add a `collection` field.
 */
export async function getPublishedAndSorted(name: CollectionName) {
  const posts = await getCollection(name, ({ data }: any) => data.publish === true);
  return posts
    .map((post: any) => ({ ...post, collection: name }))
    .sort((a: any, b: any) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Fetch multiple collections, merge, and sort by pubDate desc.
 */
export async function getMultiCollectionPosts(names: CollectionName[]) {
  const collections = await Promise.all(names.map(name => getPublishedAndSorted(name)));
  return collections
    .flat()
    .sort((a: any, b: any) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Extract unique tags from posts and prepend 'all'.
 */
export function extractUniqueTags(posts: any[]): string[] {
  return ['all', ...new Set(posts.flatMap((post: any) => post.data.tags || []))].sort();
}

/**
 * Fetch published series, sort by `order` then `lastUpdated` desc, and attach each
 * series' published posts (sorted by seriesOrder then pubDate desc).
 * LEARN: centralizes the series+posts grouping so both /series and /garden share one
 * source of truth instead of duplicating the filter/group logic in each page.
 */
export async function getSeriesWithPosts() {
  const allSeries = await getCollection('series', ({ data }: any) => data.publish);
  const sortedSeries = allSeries.sort((a: any, b: any) => {
    if (a.data.order && b.data.order) {
      return a.data.order - b.data.order;
    }
    return new Date(b.data.lastUpdated).getTime() - new Date(a.data.lastUpdated).getTime();
  });

  // Posts living under series folders, excluding each folder's index entry.
  const allSeriesPosts = (await getCollection('seriesPosts', ({ data }: any) => data.publish))
    .filter((post: any) => !post.id.endsWith('/index'));

  return sortedSeries.map((series: any) => {
    const seriesFolder = series.id.replace(/\/index$/, '');
    const posts = allSeriesPosts
      .filter((post: any) => post.id.startsWith(seriesFolder + '/'))
      .sort((a: any, b: any) => {
        const ao = a.data.seriesOrder ?? Number.POSITIVE_INFINITY;
        const bo = b.data.seriesOrder ?? Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime();
      });

    return { ...series, posts };
  });
}

/**
 * Map published series into the garden card shape consumed by GardenCards →
 * ContentCard's `series` variant. Shared by /garden (interleaved with other
 * collections) and /series (the dedicated listing), so the mapping lives in one place.
 * LEARN: series have no pubDate, so `pubDate` is synthesized from `lastUpdated`
 * to let series interleave by recency alongside other collections in the garden.
 */
export async function getSeriesCards() {
  return (await getSeriesWithPosts()).map((s: any) => ({
    collection: 'series',
    id: s.id.replace(/\/index$/, ''),
    postCount: s.posts.length,
    data: {
      title: s.data.title,
      description: s.data.description,
      tags: s.data.tags,
      featuredImage: s.data.featuredImage,
      startedDate: s.data.startedDate,
      lastUpdated: s.data.lastUpdated,
      pubDate: s.data.lastUpdated,
      posts: s.posts.map((p: any) => ({
        title: p.data.title,
        description: p.data.description,
        url: `/series/${p.id}/`,
      })),
    },
  }));
}

/**
 * Standard getStaticPaths for slug pages.
 * Handles both direct id (notes) and nested id (essays/playground) patterns.
 */
export async function getStaticPathsForCollection(name: CollectionName) {
  const posts = await getCollection(name);
  return posts.map((post: any) => {
    // For collections with nested IDs (e.g., essays/my-essay.md), extract the filename
    const parts = post.id.split('/');
    const last = parts.length > 0 ? parts[parts.length - 1] : '';
    const slug = typeof last === 'string' ? last.replace(/\.[^.]+$/, '').toLowerCase() : post.id;
    return {
      params: { slug },
      props: post,
    };
  });
}
