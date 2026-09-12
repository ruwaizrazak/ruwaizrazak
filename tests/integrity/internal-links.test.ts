import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { distExists, htmlRoutes, parseRoute, fileForRoute, DIST } from '../helpers/dist';

let routes: string[] = [];

/** Site-internal hrefs only — no anchors, mail, tel, or absolute externals. */
function internalHrefs(doc: Document): string[] {
  return [...doc.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href') ?? '')
    .filter((href) => href.startsWith('/'))
    .map((href) => href.split('#')[0].split('?')[0])
    .filter(Boolean);
}

function resolves(href: string): boolean {
  if (fileForRoute(href)) return true;
  // Non-page targets: files served straight out of dist (rss.xml, pdfs, images).
  return existsSync(join(DIST, href.replace(/^\//, '')));
}

beforeAll(async () => {
  if (!distExists()) throw new Error(`No build found at ${DIST}. Run \`npm run build\` first.`);
  routes = await htmlRoutes();
});

describe('internal links', () => {
  it('all resolve to something that was built', () => {
    const broken: string[] = [];
    for (const route of routes) {
      for (const href of internalHrefs(parseRoute(route))) {
        if (!resolves(href)) broken.push(`${route} -> ${href}`);
      }
    }
    expect([...new Set(broken)]).toEqual([]);
  });

  it('never point at a localhost or preview origin', () => {
    const leaked: string[] = [];
    for (const route of routes) {
      for (const a of parseRoute(route).querySelectorAll('a[href]')) {
        const href = a.getAttribute('href') ?? '';
        if (/localhost|127\.0\.0\.1|\.vercel\.app/.test(href)) leaked.push(`${route} -> ${href}`);
      }
    }
    expect(leaked).toEqual([]);
  });
});

describe('local assets referenced from pages', () => {
  it('every same-origin <img src> exists in the build', () => {
    const missing: string[] = [];
    for (const route of routes) {
      for (const img of parseRoute(route).querySelectorAll('img[src]')) {
        const src = (img.getAttribute('src') ?? '').split('?')[0];
        if (!src.startsWith('/')) continue;
        if (!existsSync(join(DIST, src.replace(/^\//, '')))) missing.push(`${route} -> ${src}`);
      }
    }
    expect([...new Set(missing)]).toEqual([]);
  });
});
