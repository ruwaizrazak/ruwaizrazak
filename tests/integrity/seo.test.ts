import { describe, it, expect, beforeAll } from 'vitest';
import { distExists, htmlRoutes, parseRoute, DIST } from '../helpers/dist';
import {
  DESCRIPTION_MAX,
  isContentRoute,
  isSeoExempt,
  findHeadingJumps,
} from '../helpers/seo-policy';

let contentRoutes: string[] = [];
let allRoutes: string[] = [];
const docs = new Map<string, Document>();

const doc = (route: string) => {
  if (!docs.has(route)) docs.set(route, parseRoute(route));
  return docs.get(route)!;
};

const meta = (d: Document, selector: string) =>
  d.querySelector(selector)?.getAttribute('content')?.trim() ?? '';

beforeAll(async () => {
  if (!distExists()) {
    throw new Error(`No build found at ${DIST}. Run \`npm run build\` first.`);
  }
  allRoutes = await htmlRoutes();
  contentRoutes = allRoutes.filter(isContentRoute);
});

describe('document basics', () => {
  it('declares a language on every page', () => {
    for (const route of allRoutes) {
      expect(doc(route).documentElement.getAttribute('lang'), route).toBe('en');
    }
  });

  it('gives every page a non-empty title', () => {
    for (const route of allRoutes) {
      expect(doc(route).title.trim(), `${route} has no <title>`).not.toBe('');
    }
  });

  it('gives every page a meta description', () => {
    for (const route of allRoutes) {
      expect(meta(doc(route), 'meta[name="description"]'), `${route}`).not.toBe('');
    }
  });
});

describe('titles and descriptions are unique', () => {
  // /embed/** deliberately mirrors /works/**, so it is excluded here.
  it('never reuses a title across content pages', () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const route of contentRoutes) {
      const title = doc(route).title.trim();
      if (seen.has(title)) dupes.push(`"${title}" on ${seen.get(title)} and ${route}`);
      else seen.set(title, route);
    }
    expect(dupes).toEqual([]);
  });

  it('never reuses a description across content pages', () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const route of contentRoutes) {
      const description = meta(doc(route), 'meta[name="description"]');
      if (seen.has(description)) dupes.push(`"${description}" on ${seen.get(description)} and ${route}`);
      else seen.set(description, route);
    }
    expect(dupes).toEqual([]);
  });

  it(`keeps descriptions within ${DESCRIPTION_MAX} characters`, () => {
    const tooLong = contentRoutes
      .map((route) => ({ route, description: meta(doc(route), 'meta[name="description"]') }))
      .filter(({ description }) => description.length > DESCRIPTION_MAX)
      .map(({ route, description }) => `${route} (${description.length} chars)`);
    expect(tooLong).toEqual([]);
  });
});

describe('heading structure', () => {
  it('has exactly one h1 per page', () => {
    const offenders = allRoutes
      .map((route) => ({ route, count: doc(route).querySelectorAll('h1').length }))
      .filter(({ count }) => count !== 1)
      .map(({ route, count }) => `${route} has ${count}`);
    expect(offenders).toEqual([]);
  });

  it('never skips a heading level', () => {
    const offenders: string[] = [];
    for (const route of allRoutes) {
      const levels = [...doc(route).querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) =>
        Number(h.tagName[1]),
      );
      const jumps = findHeadingJumps(levels);
      if (jumps.length) {
        offenders.push(`${route}: ${jumps.map((j) => `h${j.from} to h${j.to}`).join(', ')}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('images', () => {
  it('gives every image an alt attribute', () => {
    const offenders: string[] = [];
    for (const route of allRoutes) {
      const missing = [...doc(route).querySelectorAll('img')].filter(
        (img) => !img.hasAttribute('alt'),
      );
      if (missing.length) {
        offenders.push(`${route}: ${missing.length} img without alt`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('gives content images a descriptive, non-empty alt', () => {
    // alt="" is correct for decorative images, but an image inside the article
    // body is carrying meaning and needs describing.
    const offenders: string[] = [];
    for (const route of contentRoutes) {
      const article = doc(route).querySelector('article');
      if (!article) continue;
      const blank = [...article.querySelectorAll('img')].filter(
        (img) => (img.getAttribute('alt') ?? '').trim() === '',
      );
      if (blank.length) offenders.push(`${route}: ${blank.length} article img with empty alt`);
    }
    expect(offenders).toEqual([]);
  });
});

describe('social and canonical metadata', () => {
  it('sets a canonical URL on every non-exempt page', () => {
    for (const route of allRoutes.filter((r) => !isSeoExempt(r))) {
      const canonical = doc(route).querySelector('link[rel="canonical"]')?.getAttribute('href');
      expect(canonical, `${route} has no canonical`).toBeTruthy();
      expect(canonical, `${route} canonical is not absolute`).toMatch(/^https:\/\/ruwaizrazak\.com/);
    }
  });

  it('emits the full Open Graph and Twitter card set', () => {
    for (const route of allRoutes.filter((r) => !isSeoExempt(r))) {
      const d = doc(route);
      for (const selector of [
        'meta[property="og:title"]',
        'meta[property="og:description"]',
        'meta[property="og:image"]',
        'meta[property="og:url"]',
        'meta[property="twitter:card"]',
        'meta[property="twitter:title"]',
        'meta[property="twitter:image"]',
      ]) {
        expect(meta(d, selector), `${route} missing ${selector}`).not.toBe('');
      }
    }
  });

  it('points og:image at an absolute URL', () => {
    for (const route of allRoutes.filter((r) => !isSeoExempt(r))) {
      expect(meta(doc(route), 'meta[property="og:image"]'), route).toMatch(/^https?:\/\//);
    }
  });
});

describe('structured data', () => {
  it('emits JSON-LD that parses on every page', () => {
    for (const route of allRoutes) {
      const blocks = [...doc(route).querySelectorAll('script[type="application/ld+json"]')];
      expect(blocks.length, `${route} has no JSON-LD`).toBeGreaterThan(0);
      for (const block of blocks) {
        expect(() => JSON.parse(block.textContent ?? ''), `${route} JSON-LD is malformed`).not.toThrow();
      }
    }
  });

  it('always describes the site and its author', () => {
    for (const route of allRoutes) {
      const types = [...doc(route).querySelectorAll('script[type="application/ld+json"]')]
        .flatMap((b) => {
          const parsed = JSON.parse(b.textContent ?? '{}');
          return Array.isArray(parsed) ? parsed : [parsed];
        })
        .map((node: any) => node['@type']);
      expect(types, `${route}`).toContain('WebSite');
      expect(types, `${route}`).toContain('Person');
    }
  });

  it('marks note and essay pages as BlogPosting with valid dates', () => {
    const postRoutes = contentRoutes.filter(
      (r) => (r.startsWith('/notes/') || r.startsWith('/essays/')) && r.split('/').length > 3,
    );
    expect(postRoutes.length).toBeGreaterThan(0);

    for (const route of postRoutes) {
      const nodes = [...doc(route).querySelectorAll('script[type="application/ld+json"]')]
        .flatMap((b) => {
          const parsed = JSON.parse(b.textContent ?? '{}');
          return Array.isArray(parsed) ? parsed : [parsed];
        });
      const posting = nodes.find((n: any) => n['@type'] === 'BlogPosting');
      expect(posting, `${route} has no BlogPosting schema`).toBeTruthy();
      expect(posting.headline, `${route}`).toBeTruthy();
      expect(Number.isNaN(Date.parse(posting.datePublished)), `${route} bad datePublished`).toBe(false);
      expect(Number.isNaN(Date.parse(posting.dateModified)), `${route} bad dateModified`).toBe(false);
    }
  });
});

describe('outbound links', () => {
  it('gives every target=_blank link rel="noopener noreferrer"', () => {
    const offenders: string[] = [];
    for (const route of allRoutes) {
      for (const a of doc(route).querySelectorAll('a[target="_blank"]')) {
        const rel = a.getAttribute('rel') ?? '';
        if (!rel.includes('noopener') || !rel.includes('noreferrer')) {
          offenders.push(`${route}: ${a.getAttribute('href')} rel="${rel}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('never links with bare "click here" anchor text', () => {
    const vague = ['click here', 'here', 'read more', 'link', 'this'];
    const offenders: string[] = [];
    for (const route of contentRoutes) {
      const article = doc(route).querySelector('article');
      if (!article) continue;
      for (const a of article.querySelectorAll('a')) {
        const text = (a.textContent ?? '').trim().toLowerCase();
        if (vague.includes(text)) offenders.push(`${route}: "${text}"`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('embed routes', () => {
  it('renders content without site chrome', () => {
    const embedRoutes = allRoutes.filter(isSeoExempt);
    expect(embedRoutes.length).toBeGreaterThan(0);

    for (const route of embedRoutes) {
      const d = doc(route);
      expect(d.querySelector('article'), `${route} has no article`).toBeTruthy();
      expect(d.querySelector('header nav'), `${route} should not carry the site nav`).toBeNull();
      expect(d.querySelector('footer'), `${route} should not carry the site footer`).toBeNull();
    }
  });
});
