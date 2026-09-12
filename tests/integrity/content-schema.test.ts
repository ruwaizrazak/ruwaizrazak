import { describe, it, expect } from 'vitest';
import { readCollection, readSeriesParts, readSeriesIndexes, isPublished, localImageExists } from '../helpers/content';
import { DESCRIPTION_MAX } from '../helpers/seo-policy';

const POST_COLLECTIONS = ['notes', 'essays', 'playground', 'works'] as const;

describe('published entries carry the fields the site depends on', () => {
  for (const collection of POST_COLLECTIONS) {
    describe(collection, () => {
      const published = readCollection(collection).filter(isPublished);

      it('has at least one published entry', () => {
        if (collection === 'playground') return; // playground may legitimately be empty
        expect(published.length).toBeGreaterThan(0);
      });

      it('always sets a title and description', () => {
        const missing = published
          .filter((e) => !e.data.title || !e.data.description)
          .map((e) => e.name);
        expect(missing).toEqual([]);
      });

      it(`keeps descriptions within ${DESCRIPTION_MAX} characters`, () => {
        const tooLong = published
          .filter((e) => String(e.data.description ?? '').length > DESCRIPTION_MAX)
          .map((e) => `${e.name} (${String(e.data.description).length})`);
        expect(tooLong).toEqual([]);
      });

      it('always sets a parseable pubDate', () => {
        const bad = published
          .filter((e) => Number.isNaN(new Date(e.data.pubDate).getTime()))
          .map((e) => e.name);
        expect(bad).toEqual([]);
      });

      it('uses only the three known maturity levels', () => {
        const bad = published
          .filter((e) => e.data.maturity && !['seed', 'plant', 'tree'].includes(e.data.maturity))
          .map((e) => `${e.name}: ${e.data.maturity}`);
        expect(bad).toEqual([]);
      });

      it('points heroImage at a file that exists', () => {
        const missing = published
          .filter((e) => e.data.heroImage && !localImageExists(String(e.data.heroImage)))
          .map((e) => `${e.name} -> ${e.data.heroImage}`);
        expect(missing).toEqual([]);
      });

      it('never lets two entries collide on the same route slug', () => {
        const slugs = readCollection(collection).map((e) => e.slug);
        const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
        expect([...new Set(dupes)]).toEqual([]);
      });
    });
  }
});

describe('works carry their extra required fields', () => {
  const published = readCollection('works').filter(isPublished);

  it('always sets company and duration', () => {
    const missing = published.filter((e) => !e.data.company || !e.data.duration).map((e) => e.name);
    expect(missing).toEqual([]);
  });

  it('only uses valid store URLs when present', () => {
    const bad: string[] = [];
    for (const entry of published) {
      for (const key of ['appStoreUrl', 'playStoreUrl']) {
        const value = entry.data[key];
        if (!value) continue;
        try {
          new URL(String(value));
        } catch {
          bad.push(`${entry.name}.${key}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('series', () => {
  it('gives every series index the fields the listing needs', () => {
    const missing = readSeriesIndexes()
      .filter(isPublished)
      .filter((e) => !e.data.title || !e.data.description || !e.data.featuredImage)
      .map((e) => e.relId);
    expect(missing).toEqual([]);
  });

  it('numbers every published part with a unique seriesOrder inside its folder', () => {
    const byFolder = new Map<string, number[]>();
    for (const part of readSeriesParts().filter(isPublished)) {
      const folder = part.relId.split('/')[0];
      const list = byFolder.get(folder) ?? [];
      if (part.data.seriesOrder !== undefined) list.push(Number(part.data.seriesOrder));
      byFolder.set(folder, list);
    }
    const clashes: string[] = [];
    for (const [folder, orders] of byFolder) {
      const dupes = orders.filter((o, i) => orders.indexOf(o) !== i);
      if (dupes.length) clashes.push(`${folder}: repeated seriesOrder ${[...new Set(dupes)].join(', ')}`);
    }
    expect(clashes).toEqual([]);
  });

  it('never leaves a published series with no published parts', () => {
    const parts = readSeriesParts().filter(isPublished);
    const empty = readSeriesIndexes()
      .filter(isPublished)
      .map((s) => s.relId.replace(/\/index$/, ''))
      .filter((folder) => !parts.some((p) => p.relId.startsWith(`${folder}/`)));
    expect(empty).toEqual([]);
  });
});

describe('live notes', () => {
  const published = readCollection('live').filter(isPublished);

  it('always sets Month, OneLiner and a parseable date', () => {
    const bad = published
      .filter((e) => !e.data.Month || !e.data.OneLiner || Number.isNaN(new Date(e.data.date).getTime()))
      .map((e) => e.name);
    expect(bad).toEqual([]);
  });

  it('never publishes two entries for the same date', () => {
    const dates = published.map((e) => String(e.data.date));
    const dupes = dates.filter((d, i) => dates.indexOf(d) !== i);
    expect([...new Set(dupes)]).toEqual([]);
  });
});
