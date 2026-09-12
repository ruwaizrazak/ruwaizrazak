import { describe, it, expect, beforeEach } from 'vitest';
import { __setCollections, __reset } from '../helpers/astro-content-stub';
import {
  getPublishedAndSorted,
  getMultiCollectionPosts,
  extractUniqueTags,
  getSeriesWithPosts,
  getStaticPathsForCollection,
} from '../../src/utils/collections';

const d = (iso: string) => new Date(iso);

beforeEach(() => __reset());

describe('getPublishedAndSorted', () => {
  beforeEach(() => {
    __setCollections({
      notes: [
        { id: 'older', data: { title: 'Older', pubDate: d('2026-01-01'), publish: true } },
        { id: 'draft', data: { title: 'Draft', pubDate: d('2026-06-01'), publish: false } },
        { id: 'newer', data: { title: 'Newer', pubDate: d('2026-03-01'), publish: true } },
      ],
    });
  });

  it('drops unpublished entries', async () => {
    const posts = await getPublishedAndSorted('notes');
    expect(posts.map((p: any) => p.id)).not.toContain('draft');
  });

  it('sorts newest first', async () => {
    const posts = await getPublishedAndSorted('notes');
    expect(posts.map((p: any) => p.id)).toEqual(['newer', 'older']);
  });

  it('tags each entry with its collection name', async () => {
    const posts = await getPublishedAndSorted('notes');
    expect(posts.every((p: any) => p.collection === 'notes')).toBe(true);
  });

  it('returns an empty array for an empty collection', async () => {
    __setCollections({ notes: [] });
    expect(await getPublishedAndSorted('notes')).toEqual([]);
  });
});

describe('getMultiCollectionPosts', () => {
  it('interleaves collections by date, newest first', async () => {
    __setCollections({
      notes: [{ id: 'n1', data: { pubDate: d('2026-02-01'), publish: true } }],
      essays: [
        { id: 'e1', data: { pubDate: d('2026-05-01'), publish: true } },
        { id: 'e2', data: { pubDate: d('2026-01-01'), publish: true } },
      ],
    });
    const posts = await getMultiCollectionPosts(['notes', 'essays'] as any);
    expect(posts.map((p: any) => p.id)).toEqual(['e1', 'n1', 'e2']);
  });
});

describe('extractUniqueTags', () => {
  const withTags = (...tags: string[][]) => tags.map((t) => ({ data: { tags: t } }));

  it('deduplicates tags across posts', () => {
    expect(extractUniqueTags(withTags(['design', 'ux'], ['ux']))).toEqual(['all', 'design', 'ux']);
  });

  it('tolerates posts with no tags', () => {
    expect(extractUniqueTags([{ data: {} }, { data: { tags: ['x'] } }])).toEqual(['all', 'x']);
  });

  it('sorts the whole list — so "all" is NOT pinned to the front', () => {
    // Documented quirk, not an aspiration: the helper prepends 'all' and then
    // sorts everything, so any tag sorting before "all" (e.g. "ai") displaces it.
    // If 'all' should always lead the filter UI, the sort must exclude it.
    expect(extractUniqueTags(withTags(['ai', 'design']))).toEqual(['ai', 'all', 'design']);
  });
});

describe('getSeriesWithPosts', () => {
  beforeEach(() => {
    __setCollections({
      series: [
        {
          id: 'second/index',
          data: { title: 'Second', publish: true, order: 2, lastUpdated: d('2026-06-01') },
        },
        {
          id: 'first/index',
          data: { title: 'First', publish: true, order: 1, lastUpdated: d('2026-01-01') },
        },
        {
          id: 'hidden/index',
          data: { title: 'Hidden', publish: false, order: 3, lastUpdated: d('2026-07-01') },
        },
      ],
      seriesPosts: [
        { id: 'first/part-two', data: { publish: true, seriesOrder: 2, pubDate: d('2026-02-01') } },
        { id: 'first/part-one', data: { publish: true, seriesOrder: 1, pubDate: d('2026-01-15') } },
        { id: 'first/index', data: { publish: true, pubDate: d('2026-01-01') } },
        { id: 'second/only', data: { publish: true, seriesOrder: 1, pubDate: d('2026-06-01') } },
        { id: 'first/draft', data: { publish: false, seriesOrder: 3, pubDate: d('2026-03-01') } },
      ],
    });
  });

  it('excludes unpublished series', async () => {
    const series = await getSeriesWithPosts();
    expect(series.map((s: any) => s.id)).toEqual(['first/index', 'second/index']);
  });

  it('orders by the explicit `order` field when present', async () => {
    const series = await getSeriesWithPosts();
    expect(series[0].data.title).toBe('First');
  });

  it('attaches only the posts belonging to that series folder', async () => {
    const [first] = await getSeriesWithPosts();
    expect(first.posts.map((p: any) => p.id)).toEqual(['first/part-one', 'first/part-two']);
  });

  it('never treats the folder index as a part', async () => {
    const [first] = await getSeriesWithPosts();
    expect(first.posts.some((p: any) => p.id.endsWith('/index'))).toBe(false);
  });

  it('excludes unpublished parts', async () => {
    const [first] = await getSeriesWithPosts();
    expect(first.posts.some((p: any) => p.id === 'first/draft')).toBe(false);
  });

  it('sorts parts by seriesOrder ascending', async () => {
    const [first] = await getSeriesWithPosts();
    expect(first.posts.map((p: any) => p.data.seriesOrder)).toEqual([1, 2]);
  });
});

describe('getStaticPathsForCollection', () => {
  it('derives the slug from the final path segment, lowercased', async () => {
    __setCollections({
      essays: [
        { id: 'nested/My-Essay', data: {} },
        { id: 'Flat', data: {} },
      ],
    });
    const paths = await getStaticPathsForCollection('essays' as any);
    expect(paths.map((p: any) => p.params.slug)).toEqual(['my-essay', 'flat']);
  });

  it('strips a file extension if the loader left one on the id', async () => {
    __setCollections({ notes: [{ id: 'thing.mdx', data: {} }] });
    const [path] = await getStaticPathsForCollection('notes' as any);
    expect(path.params.slug).toBe('thing');
  });

  it('does NOT filter on publish — drafts still get a route', async () => {
    // Worth pinning: unpublished entries are excluded from listings by
    // getPublishedAndSorted, but they are still built as reachable pages.
    __setCollections({ notes: [{ id: 'draft', data: { publish: false } }] });
    const paths = await getStaticPathsForCollection('notes' as any);
    expect(paths).toHaveLength(1);
  });
});
