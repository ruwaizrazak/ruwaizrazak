/**
 * Route helpers — deliberately dependency-free.
 *
 * LEARN: this does NOT live in collections.ts, and that is the point. That module
 * imports `astro:content`, which is server-only, so a Svelte island importing
 * anything from it drags the virtual module into the client bundle and the build
 * fails with "The astro:content module is only available server-side". Pure
 * helpers shared between the Astro side and Svelte components belong in a module
 * with no Astro imports at all.
 */

/**
 * The public URL for a content entry.
 *
 * LEARN: the collection name is NOT always the route segment. Series parts live
 * in the `seriesPosts` collection but are served under /series/, so building a
 * URL as `/${collection}/${id}/` produced /seriesPosts/... links that 404'd the
 * moment series parts started appearing in tag listings.
 */
export function urlForEntry(collection: string, id: string): string {
  if (collection === 'series' || collection === 'seriesPosts') return `/series/${id}/`;
  return `/${collection}/${id}/`;
}
