/**
 * Helpers for asserting against the built site in dist/.
 *
 * The integrity suite reads production output rather than driving a browser:
 * it is the artifact that actually ships, and parsing it is orders of magnitude
 * cheaper than booting Playwright for things that are pure markup facts.
 */
import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { JSDOM } from 'jsdom';

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

export function readRoute(route: string): string {
  const file = fileForRoute(route);
  if (!file) throw new Error(`No built page for route ${route}`);
  return readFileSync(file, 'utf8');
}

export function parseRoute(route: string): Document {
  return new JSDOM(readRoute(route)).window.document;
}

export function readAsset(relPath: string): Buffer {
  return readFileSync(join(DIST, relPath.replace(/^\//, '')));
}

export function assetExists(relPath: string): boolean {
  return existsSync(join(DIST, relPath.replace(/^\//, '')));
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
