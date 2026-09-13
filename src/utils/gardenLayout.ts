export type GardenSpan = 'wide' | 'card';

/** Series entries lead the page as panels; everything else flows into the grid. */
export function partitionGardenPosts<T extends { collection: string }>(posts: T[]) {
  // LEARN: This helper stays Astro-free because GardenCards is a client island;
  // importing astro:content through this path would leak a server-only module.
  return {
    seriesPosts: posts.filter((post) => post.collection === 'series'),
    gridPosts: posts.filter((post) => post.collection !== 'series'),
  };
}

/** Essays get the horizontal span-3 treatment; notes and playground stay 1-col. */
export function gardenSpan(collection: string): GardenSpan {
  return collection === 'essays' ? 'wide' : 'card';
}
