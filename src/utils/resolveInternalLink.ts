import { getCollection } from 'astro:content';

type CollectionName = 'essays' | 'notes' | 'works' | 'series' | 'live';

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
  const segments = href.replace(/^\/|\/$/g, '').split('/');
  if (segments.length < 2) return null;

  const route = segments[0];
  const slug = segments.slice(1).join('/');
  const collectionName = routeToCollection[route];
  if (!collectionName) return null;

  try {
    const entries = await getCollection(collectionName);

    const match = entries.find((entry) => {
      // Derive slug same way the slug pages do
      const parts = entry.id.split('/');
      const last = parts[parts.length - 1] ?? '';
      const derived = last.replace(/\.[^.]+$/, '').toLowerCase();

      // For works: also handle space-to-dash (generateId in config)
      return derived === slug.toLowerCase() || entry.id === slug;
    });

    if (!match) return null;

    const data = match.data as Record<string, unknown>;
    const title = (data.title as string) ?? null;
    const description = (data.description as string) ?? null;

    if (!title && !description) return null;
    return { title: title ?? '', description: description ?? '' };
  } catch (_e) {
    return null;
  }
}
