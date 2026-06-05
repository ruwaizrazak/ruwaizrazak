// LEARN: This runs inside astro.config.mjs, which CANNOT import `astro:content`
// (the content layer only exists during the Astro build, not while the config is
// evaluated). So instead of getCollection(), we read the markdown frontmatter
// straight off disk and reconstruct each route's URL ourselves. The result feeds
// the sitemap's serialize() so we can (a) drop unpublished drafts and (b) attach an
// accurate <lastmod> — the one sitemap field Google actually honors.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import yaml from 'js-yaml';

const CONTENT_DIR = fileURLToPath(new URL('../content', import.meta.url));

// Parse the leading `---`-fenced YAML frontmatter block of a content file.
function readFrontmatter(absPath) {
  const text = readFileSync(absPath, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try {
    return yaml.load(match[1]) ?? {};
  } catch {
    return {};
  }
}

// First available date field wins, normalized to an ISO string for <lastmod>.
// baseSchema → updatedDate ?? pubDate; series index → lastUpdated ?? startedDate;
// live → date.
function toLastmod(data) {
  const raw =
    data.updatedDate ?? data.pubDate ?? data.lastUpdated ?? data.startedDate ?? data.date;
  if (!raw) return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.valueOf()) ? undefined : d.toISOString();
}

// Astro's default glob loader slugifies entry ids: lowercase, spaces → '-', with
// path separators preserved. Mirror that so our keys match the emitted URLs.
const defaultSlug = (id) => id.toLowerCase().replace(/\s+/g, '-');

/**
 * Build a Map<pathname, { publish, lastmod }> mirroring how each route file
 * generates its URLs. Keys are normalized to a no-trailing-slash pathname so they
 * match the URLs the sitemap integration emits.
 */
export function getSitemapEntries() {
  const entries = new Map();
  const add = (pathname, data) => {
    entries.set(pathname, {
      // Zod default for `publish` is false (src/content.config.ts), so an absent
      // field means draft → excluded from the sitemap.
      publish: data.publish === true,
      lastmod: toLastmod(data),
    });
  };

  const files = globSync('**/*.{md,mdx}', { cwd: CONTENT_DIR, posix: true });

  for (const file of files) {
    const segments = file.split('/');
    const collection = segments[0];
    const id = segments.slice(1).join('/').replace(/\.(md|mdx)$/i, '');
    const data = readFrontmatter(`${CONTENT_DIR}/${file}`);

    switch (collection) {
      case 'notes':
      case 'essays': {
        const slug = defaultSlug(id);
        add(`/${collection}/${slug}`, data);
        // garden/[...slug].astro mirrors notes + essays at /garden/<collection>/<id>.
        add(`/garden/${collection}/${slug}`, data);
        break;
      }
      case 'playground':
        add(`/playground/${defaultSlug(id)}`, data);
        break;
      case 'live':
        add(`/live/${defaultSlug(id)}`, data);
        break;
      case 'works': {
        // works uses a CUSTOM generateId() (content.config.ts) that collapses
        // whitespace to '-' but does NOT lowercase — so don't slug it.
        const workId = id.replace(/\s+/g, '-');
        add(`/works/${workId}`, data);
        add(`/embed/works/${workId}`, data);
        break;
      }
      case 'series': {
        const slug = defaultSlug(id);
        if (/\/index$/.test(slug)) {
          add(`/series/${slug.replace(/\/index$/, '')}`, data); // series index page
        } else {
          add(`/series/${slug}`, data); // series part page
        }
        break;
      }
      default:
        break;
    }
  }

  return entries;
}
