import { describe, it, expect, beforeAll } from 'vitest';
import { distExists, htmlRoutes, readRoute, parseRoute, assetExists, DIST } from '../helpers/dist';

// LEARN: each third-party origin costs a fresh DNS+TLS handshake before first paint; PageSpeed
// flagged jsDelivr and Google Fonts, so every built page is checked for them.
const THIRD_PARTY = /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net/;

let routes: string[] = [];

beforeAll(async () => {
  if (!distExists()) {
    throw new Error(`No build found at ${DIST}. Run \`npm run build\` first.`);
  }
  routes = await htmlRoutes();
});

describe('render-blocking requests', () => {
  it('links no third-party stylesheet or font origin', () => {
    const offenders = routes.filter((route) => THIRD_PARTY.test(readRoute(route)));
    expect(offenders).toEqual([]);
  });

  it('loads every stylesheet from the site itself', () => {
    const external = routes.flatMap((route) =>
      [...parseRoute(route).querySelectorAll('link[rel="stylesheet"]')]
        .map((link) => link.getAttribute('href') ?? '')
        .filter((href) => !href.startsWith('/'))
        .map((href) => `${route} → ${href}`),
    );
    expect(external).toEqual([]);
  });
});

describe('self-hosted fonts', () => {
  it('preloads exactly the two LCP faces, both of which exist', () => {
    const d = parseRoute('/');
    const preloads = [...d.querySelectorAll('link[rel="preload"][as="font"]')].map(
      (link) => link.getAttribute('href') ?? '',
    );
    expect(preloads).toHaveLength(2);
    for (const href of preloads) {
      expect(href).toMatch(/^\/_astro\/fonts\/.+\.woff2$/);
      expect(assetExists(href)).toBe(true);
    }
  });

  it('declares all four families, each pointing at a file that was built', () => {
    const html = readRoute('/');
    // Astro quotes multi-word family names but emits single words bare (font-family:Caveat-<hash>).
    for (const family of ['IBM Plex Serif', 'Saira Condensed', 'IBM Plex Mono', 'Caveat']) {
      expect(html).toMatch(new RegExp(`font-family:"?${family}-[0-9a-f]+`));
    }
    const sources = [...html.matchAll(/url\("(\/_astro\/fonts\/[^"]+\.woff2)"\)/g)].map((m) => m[1]);
    expect(new Set(sources).size).toBe(18);
    expect(sources.filter((src) => !assetExists(src))).toEqual([]);
  });
});
