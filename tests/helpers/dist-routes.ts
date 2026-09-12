/**
 * Filesystem-only view of the built site.
 *
 * Deliberately separate from dist.ts, which imports jsdom: Playwright's bundler
 * cannot resolve jsdom's lazy `require('./fallback/encoding.js')`, so any E2E
 * spec that pulled in dist.ts failed to load. E2E only ever needs the route
 * list, so the fs helpers live here with no parser dependency.
 */
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

export const DIST = new URL('../../dist/', import.meta.url).pathname.replace(/\/$/, '');

export function distExists(): boolean {
  return existsSync(join(DIST, 'index.html'));
}

/** Every built HTML page, as site-absolute routes ("/notes/whythissite/"). */
export async function htmlRoutes(): Promise<string[]> {
  const files = await walk(DIST);
  return files
    .filter((f) => f.endsWith('.html'))
    .map((f) => {
      const rel = relative(DIST, f).split(sep).join('/');
      return '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
    })
    .sort();
}

/** Absolute file path backing a route, or null if the route has no page. */
export function fileForRoute(route: string): string | null {
  const clean = route.replace(/^\//, '').replace(/\/$/, '');
  const candidates = clean
    ? [join(DIST, clean, 'index.html'), join(DIST, `${clean}.html`)]
    : [join(DIST, 'index.html')];
  return candidates.find((c) => existsSync(c)) ?? null;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}
