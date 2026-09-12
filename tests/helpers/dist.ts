/**
 * Helpers for asserting against the built site in dist/.
 *
 * The integrity suite reads production output rather than driving a browser:
 * it is the artifact that actually ships, and parsing it is orders of magnitude
 * cheaper than booting Playwright for things that are pure markup facts.
 *
 * The jsdom-free half lives in dist-routes.ts — see the note there.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

export { DIST, distExists, htmlRoutes, fileForRoute } from './dist-routes';
import { DIST, fileForRoute } from './dist-routes';

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
