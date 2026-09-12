import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { distExists, htmlRoutes, DIST } from '../helpers/dist';

const SITE = 'https://ruwaizrazak.com';

/** Parse a built XML file, failing loudly if it is malformed. */
function xml(file: string): Document {
  const { window } = new JSDOM('');
  const doc = new window.DOMParser().parseFromString(readFileSync(join(DIST, file), 'utf8'), 'text/xml');
  const error = doc.querySelector('parsererror');
  if (error) throw new Error(`${file} is not well-formed XML: ${error.textContent}`);
  return doc;
}

let routes: string[] = [];

beforeAll(async () => {
  if (!distExists()) throw new Error(`No build found at ${DIST}. Run \`npm run build\` first.`);
  routes = await htmlRoutes();
});

describe('sitemap', () => {
  it('is well-formed XML', () => {
    expect(() => xml('sitemap-index.xml')).not.toThrow();
    expect(() => xml('sitemap-0.xml')).not.toThrow();
  });

  it('indexes the generated sitemap file', () => {
    const locs = [...xml('sitemap-index.xml').querySelectorAll('loc')].map((l) => l.textContent);
    expect(locs.some((l) => l?.endsWith('sitemap-0.xml'))).toBe(true);
  });

  it('lists only absolute production URLs', () => {
    const locs = [...xml('sitemap-0.xml').querySelectorAll('url > loc')].map((l) => l.textContent ?? '');
    expect(locs.length).toBeGreaterThan(10);
    for (const loc of locs) {
      expect(loc, `${loc} is not an absolute production URL`).toMatch(new RegExp(`^${SITE}/`));
    }
  });

  it('points every entry at a page that was actually built', () => {
    const locs = [...xml('sitemap-0.xml').querySelectorAll('url > loc')].map((l) => l.textContent ?? '');
    const missing = locs
      // Tags containing spaces are percent-encoded in the sitemap but are
      // literal spaces on disk, so decode before comparing.
      .map((loc) => decodeURIComponent(loc.replace(SITE, '')))
      .map((path) => (path.endsWith('/') ? path : `${path}/`))
      .filter((path) => !routes.includes(path));
    expect(missing).toEqual([]);
  });

  it('never lists the same URL twice', () => {
    const locs = [...xml('sitemap-0.xml').querySelectorAll('url > loc')].map((l) => l.textContent);
    expect(new Set(locs).size).toBe(locs.length);
  });
});

describe('RSS feed', () => {
  it('is well-formed XML with a channel', () => {
    const doc = xml('rss.xml');
    expect(doc.querySelector('rss > channel')).toBeTruthy();
    expect(doc.querySelector('channel > title')?.textContent).toBeTruthy();
    expect(doc.querySelector('channel > link')?.textContent).toContain(SITE);
  });

  it('carries items', () => {
    const items = [...xml('rss.xml').querySelectorAll('item')];
    expect(items.length).toBeGreaterThan(0);
  });

  it('gives every item a title, link and valid pubDate', () => {
    for (const item of xml('rss.xml').querySelectorAll('item')) {
      const title = item.querySelector('title')?.textContent?.trim();
      const link = item.querySelector('link')?.textContent?.trim();
      const pubDate = item.querySelector('pubDate')?.textContent?.trim();

      expect(title, 'item without a title').toBeTruthy();
      expect(link, `${title} has no link`).toMatch(new RegExp(`^${SITE}/`));
      expect(Number.isNaN(Date.parse(pubDate ?? '')), `${title} has an unparseable pubDate`).toBe(false);
    }
  });

  it('orders items newest first', () => {
    const dates = [...xml('rss.xml').querySelectorAll('item > pubDate')].map((d) =>
      Date.parse(d.textContent ?? ''),
    );
    const sorted = [...dates].sort((a, b) => b - a);
    expect(dates).toEqual(sorted);
  });

  it('covers only essays and notes', () => {
    // The feed is scoped to those two collections — see src/pages/rss.xml.js.
    const links = [...xml('rss.xml').querySelectorAll('item > link')].map((l) => l.textContent ?? '');
    for (const link of links) {
      expect(link.replace(SITE, ''), `${link} is outside essays/notes`).toMatch(/^\/(essays|notes)\//);
    }
  });

  it('points every item at a page that exists', () => {
    const links = [...xml('rss.xml').querySelectorAll('item > link')].map((l) =>
      (l.textContent ?? '').replace(SITE, ''),
    );
    const missing = links
      .map((path) => (path.endsWith('/') ? path : `${path}/`))
      .filter((path) => !routes.includes(path));
    expect(missing).toEqual([]);
  });
});
