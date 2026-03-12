/**
 * Maps internal hrefs (e.g. "/garden/my-post") to content collection entries,
 * returning their title and description for use in link tooltips.
 *
 * This runs at build time — Astro's `getCollection` reads from the content
 * directory on disk, so there are no network requests involved.
 */
import { getCollection } from 'astro:content';

type CollectionName = 'essays' | 'notes' | 'works' | 'series' | 'live';

/**
 * Maps URL route segments to Astro content collection names.
 * Not always 1:1 — e.g. the "/garden" route serves content from the
 * "essays" collection, because the URL structure and collection naming
 * evolved independently.
 */
const routeToCollection: Record<string, CollectionName> = {
  essays: 'essays',
  notes: 'notes',
  works: 'works',
  garden: 'essays',
  series: 'series',
  live: 'live',
};

export async function resolveInternalLink(
  href: string
): Promise<{ title: string; description: string } | null> {
  // Split "/garden/my-post/" → ["garden", "my-post"]
  // This mirrors how [...slug].astro pages derive their route segments.
  const segments = href.replace(/^\/|\/$/g, '').split('/');
  if (segments.length < 2) return null;

  const route = segments[0];
  const slug = segments.slice(1).join('/');
  const collectionName = routeToCollection[route];
  if (!collectionName) return null;

  try {
    const entries = await getCollection(collectionName);

    const match = entries.find((entry) => {
      // Derive slug the same way [...slug].astro pages do:
      // take the last path segment of the entry ID, strip the file extension.
      const parts = entry.id.split('/');
      const last = parts[parts.length - 1] ?? '';
      const derived = last.replace(/\.[^.]+$/, '').toLowerCase();

      // Also check raw entry.id for works where generateId in the
      // content config may produce space-to-dash transformations.
      return derived === slug.toLowerCase() || entry.id === slug;
    });

    if (!match) return null;

    const data = match.data as Record<string, unknown>;
    const title = (data.title as string) ?? null;
    const description = (data.description as string) ?? null;

    if (!title && !description) return null;
    return { title: title ?? '', description: description ?? '' };
  } catch (_e) {
    // getCollection can throw if the collection doesn't exist or content
    // schema validation fails — return null so the link renders without
    // a tooltip rather than breaking the build.
    return null;
  }
}
