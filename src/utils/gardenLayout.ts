export type GardenSpan = 'wide' | 'card';
export type GardenLayoutGroup<T> =
  | { type: 'series'; post: T }
  | { type: 'grid'; posts: T[] };

/** Series entries lead the page as panels; everything else flows into the grid. */
export function partitionGardenPosts<T extends { collection: string }>(posts: T[]) {
  // LEARN: This helper stays Astro-free because GardenCards is a client island;
  // importing astro:content through this path would leak a server-only module.
  return {
    seriesPosts: posts.filter((post) => post.collection === 'series'),
    gridPosts: posts.filter((post) => post.collection !== 'series'),
  };
}

/** Keep the visible garden chronological while letting series stay full-width panels. */
export function groupGardenPostsByDate<T extends { collection: string }>(
  posts: T[],
): GardenLayoutGroup<T>[] {
  const groups: GardenLayoutGroup<T>[] = [];
  let gridPosts: T[] = [];

  for (const post of posts) {
    if (post.collection === 'series') {
      if (gridPosts.length > 0) {
        groups.push({ type: 'grid', posts: gridPosts });
        gridPosts = [];
      }
      groups.push({ type: 'series', post });
      continue;
    }

    gridPosts.push(post);
  }

  if (gridPosts.length > 0) groups.push({ type: 'grid', posts: gridPosts });

  return groups;
}

/** Essays get the horizontal span-3 treatment; notes and playground stay 1-col. */
export function gardenSpan(collection: string): GardenSpan {
  return collection === 'essays' ? 'wide' : 'card';
}
