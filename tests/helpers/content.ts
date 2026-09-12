/**
 * Reads the content collections straight off disk.
 *
 * The integrity suite needs to answer "did every published entry actually get a
 * page?", which means knowing the source entries independently of the build —
 * asking the build about itself could never catch a page that silently vanished.
 */
import { readFileSync } from 'node:fs';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { load as parseYaml } from 'js-yaml';

const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
export const CONTENT_DIR = join(ROOT, 'src/content');
export const PUBLIC_DIR = join(ROOT, 'public');
export const ASSETS_DIR = join(ROOT, 'src/assets');

export interface ContentEntry {
  /** Absolute path on disk. */
  file: string;
  /** Filename without extension, e.g. "whythissite". */
  name: string;
  /** Route slug, derived the way getStaticPathsForCollection does. */
  slug: string;
  /** Path relative to the collection dir, e.g. "prototyping-in-code/part-one". */
  relId: string;
  data: Record<string, any>;
}

/**
 * Astro's glob loader lowercases entry ids and turns whitespace into dashes,
 * so "Learning to build.mdx" becomes "learning-to-build". Route derivation here
 * has to match, or a perfectly built page looks missing.
 */
const slugify = (value: string) => value.toLowerCase().replace(/\s+/g, '-');

export function readCollection(collection: string): ContentEntry[] {
  const dir = join(CONTENT_DIR, collection);
  if (!existsSync(dir)) return [];
  return walk(dir)
    .filter((f) => ['.md', '.mdx'].includes(extname(f)))
    // Underscore-prefixed files are Astro's convention for "not content"
    // (e.g. _case-study-template.mdx) and are never built.
    .filter((f) => !basename(f).startsWith('_'))
    .map((file) => {
      const name = basename(file).replace(/\.[^.]+$/, '');
      return {
        file,
        name,
        slug: slugify(name),
        relId: file
          .slice(dir.length + 1)
          .replace(/\.[^.]+$/, '')
          .split('/')
          .map(slugify)
          .join('/'),
        data: frontmatter(file),
      };
    });
}

export function isPublished(entry: ContentEntry): boolean {
  return entry.data.publish === true;
}

/** Series folder entries, excluding each folder's index. */
export function readSeriesParts(): ContentEntry[] {
  return readCollection('series').filter((e) => !e.relId.endsWith('index'));
}

export function readSeriesIndexes(): ContentEntry[] {
  return readCollection('series').filter((e) => e.relId.endsWith('index'));
}

/**
 * Resolve a public-style image path the way the site does: images live either
 * in public/ (served as-is) or src/assets/ (optimized by resolveImage).
 */
export function localImageExists(path: string): boolean {
  if (/^https?:\/\//.test(path)) return true; // remote, not ours to verify
  const rel = path.replace(/^\//, '');
  return existsSync(join(PUBLIC_DIR, rel)) || existsSync(join(ASSETS_DIR, rel));
}

function frontmatter(file: string): Record<string, any> {
  const raw = readFileSync(file, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try {
    return (parseYaml(match[1]) as Record<string, any>) ?? {};
  } catch {
    return {};
  }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
