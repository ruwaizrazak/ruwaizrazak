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
