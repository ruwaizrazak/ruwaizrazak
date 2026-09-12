import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { distExists, htmlRoutes, fileForRoute, readRoute, DIST } from '../helpers/dist';
import { readCollection, readSeriesParts, isPublished } from '../helpers/content';

let routes: string[] = [];

beforeAll(async () => {
  if (!distExists()) {
    throw new Error(`No build found at ${DIST}. Run \`npm run build\` before the integrity suite.`);
  }
  routes = await htmlRoutes();
});

const has = (route: string) => routes.includes(route);

describe('the build produced a site', () => {
  it('emits pages', () => {
    expect(routes.length).toBeGreaterThan(40);
  });

  it('renders every index route', () => {
    for (const route of [
      '/',
      '/about/',
      '/notes/',
      '/essays/',
      '/garden/',
      '/series/',
      '/works/',
      '/playground/',
      '/live/',
    ]) {
      expect(has(route), `missing index route ${route}`).toBe(true);
    }
  });

  it('leaves no page empty', () => {
    for (const route of routes) {
      expect(readRoute(route).length, `${route} is empty`).toBeGreaterThan(500);
    }
  });

  it('closes the document on every page', () => {
    for (const route of routes) {
      const html = readRoute(route);
      expect(html, `${route} looks truncated`).toContain('</html>');
    }
  });
});

describe('content reaches the web', () => {
  // `publish: false` means no route at all. This used to be the opposite — pages
  // were built for drafts too, and publish only controlled listing visibility —
  // but that left drafts with an og:image that 404'd, and put them in the sitemap
  // and the RSS feed. See getStaticPathsForCollection.
  for (const collection of ['notes', 'essays', 'playground'] as const) {
    it(`gives every published ${collection} entry a page`, () => {
      for (const entry of readCollection(collection).filter(isPublished)) {
        expect(
          fileForRoute(`/${collection}/${entry.slug}/`),
          `${entry.name} has no page at /${collection}/${entry.slug}/`,
        ).not.toBeNull();
      }
    });

    it(`builds no page for an unpublished ${collection} entry`, () => {
      for (const entry of readCollection(collection).filter((e) => !isPublished(e))) {
        expect(
          fileForRoute(`/${collection}/${entry.slug}/`),
          `${entry.name} is a draft but has a page at /${collection}/${entry.slug}/`,
        ).toBeNull();
      }
    });
  }

  it('gives every series part a page', () => {
    for (const part of readSeriesParts()) {
      expect(
        fileForRoute(`/series/${part.relId}/`),
        `series part ${part.relId} has no page`,
      ).not.toBeNull();
    }
  });

  it('builds an embed page for each published work and no others', () => {
    const publishedWorks = readCollection('works').filter(isPublished);
    const embedRoutes = routes.filter((r) => r.startsWith('/embed/works/'));
    expect(embedRoutes).toHaveLength(publishedWorks.length);
  });

  it('builds a tag page for every tag in use', () => {
    // Must match the collection list in pages/tags/[tag].astro. Series parts show
    // tag links through NotePostHero just like notes and essays do, so they were
    // added there — and omitting them here would flag their tag pages as orphans.
    const tags = new Set<string>();
    for (const collection of ['notes', 'essays', 'works', 'playground', 'series'] as const) {
      for (const entry of readCollection(collection).filter(isPublished)) {
        for (const tag of entry.data.tags ?? []) tags.add(String(tag));
      }
    }
    const tagRoutes = routes.filter((r) => r.startsWith('/tags/'));
    expect(tagRoutes.length, 'no tag pages were built').toBeGreaterThan(0);
    // Every built tag page should correspond to a tag that actually exists.
    for (const route of tagRoutes) {
      const tag = decodeURIComponent(route.replace('/tags/', '').replace(/\/$/, ''));
      expect(tags.has(tag), `/tags/${tag}/ was built but no entry carries that tag`).toBe(true);
    }
  });
});

describe('feeds and machine endpoints', () => {
  it('emits the RSS feed', () => {
    expect(existsSync(join(DIST, 'rss.xml'))).toBe(true);
  });

  it('emits both sitemap files', () => {
    expect(existsSync(join(DIST, 'sitemap-index.xml'))).toBe(true);
    expect(existsSync(join(DIST, 'sitemap-0.xml'))).toBe(true);
  });

  it('ships robots.txt pointing at the sitemap', () => {
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
    expect(robots).toContain('Sitemap: https://ruwaizrazak.com/sitemap-index.xml');
  });
});
