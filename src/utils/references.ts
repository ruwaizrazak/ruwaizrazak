/**
 * LEARN: the References shelf (design 1b) groups entries by kind so the reader
 * sees what a source is before reading its title. The kind is inferred from the
 * URL, so existing MDX needs no edits: no URL is a book, a link to this site is
 * "From the garden", anything else is "On the web". An explicit `kind` wins.
 */
import type {
  BookReference,
  GardenCollection,
  GardenReference,
  ReferenceGroups,
  ReferenceInput,
  ReferenceKind,
  WebReference,
} from '../types';

const SITE_HOSTS = new Set(['ruwaizrazak.com', 'www.ruwaizrazak.com']);
const GARDEN_LABELS: Record<GardenCollection, string> = {
  notes: 'Note',
  essays: 'Essay',
  series: 'Series',
  playground: 'Playground',
};

const joinDot = (parts: (string | undefined)[]) =>
  parts.map((part) => part?.trim()).filter(Boolean).join(' · ');

function parseUrl(url: string): URL | null {
  try {
    return new URL(url, 'https://ruwaizrazak.com');
  } catch {
    return null;
  }
}

function isSiteUrl(url: string): boolean {
  if (url.startsWith('/')) return true;
  const parsed = /^[a-z][a-z0-9+.-]*:/i.test(url) ? parseUrl(url) : null;
  return parsed !== null && SITE_HOSTS.has(parsed.hostname);
}

/** Which group an entry belongs to. */
export function referenceKind(ref: ReferenceInput): ReferenceKind {
  const url = ref.url?.trim();
  // A garden or web entry needs somewhere to link to; without a URL it is a book.
  if (!url) return 'book';
  if (ref.kind) return ref.kind;
  return isSiteUrl(url) ? 'garden' : 'web';
}

/** Open Library cover for an ISBN (digits and a trailing X only), or null. */
export function coverUrl(isbn?: string): string | null {
  const clean = isbn?.replace(/[^0-9Xx]/g, '').toUpperCase();
  return clean ? `https://covers.openlibrary.org/b/isbn/${clean}-M.jpg` : null;
}

/** Hostname without a leading `www.`, for the "On the web" source label. */
export function hostLabel(url: string): string {
  const parsed = parseUrl(url);
  return parsed ? parsed.hostname.replace(/^www\./, '') : url;
}

/** Site-relative path for a garden link, and the collection its first segment names. */
export function gardenTarget(url: string): { href: string; collection: GardenCollection | null } {
  const parsed = parseUrl(url.trim());
  const href = parsed ? `${parsed.pathname}${parsed.search}${parsed.hash}` : url.trim();
  const segment = href.split('/').filter(Boolean)[0] ?? '';
  const collection = segment in GARDEN_LABELS ? (segment as GardenCollection) : null;
  return { href, collection };
}

/** Sort entries into the shelf's three groups, keeping their order within each. */
export function groupReferences(refs: ReferenceInput[]): ReferenceGroups {
  const groups: ReferenceGroups = { books: [], garden: [], web: [] };

  for (const ref of refs) {
    const title = ref.title.trim();
    const url = ref.url?.trim() || null;
    const kind = referenceKind(ref);

    if (kind === 'book') {
      groups.books.push({
        title,
        href: url,
        author: ref.author?.trim() || null,
        meta: joinDot([ref.year, ref.publisher]),
        cover: coverUrl(ref.isbn),
      });
    } else if (kind === 'garden' && url) {
      const { href, collection } = gardenTarget(url);
      groups.garden.push({ title, href, collection, label: collection ? GARDEN_LABELS[collection] : 'Garden' });
    } else if (url) {
      groups.web.push({ title, href: url, byline: joinDot([ref.author, ref.year]), host: hostLabel(url) });
    }
  }

  return groups;
}
