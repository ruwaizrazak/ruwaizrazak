import { describe, expect, it } from 'vitest';
import { gardenSpan, groupGardenPostsByDate, partitionGardenPosts } from '../../src/utils/gardenLayout';

const post = (id: string, collection: string) => ({ id, collection });

describe('partitionGardenPosts', () => {
  it('pulls series entries into seriesPosts and leaves the rest in gridPosts', () => {
    const result = partitionGardenPosts([
      post('note-1', 'notes'),
      post('series-1', 'series'),
      post('essay-1', 'essays'),
    ]);

    expect(result.seriesPosts.map((item) => item.id)).toEqual(['series-1']);
    expect(result.gridPosts.map((item) => item.id)).toEqual(['note-1', 'essay-1']);
  });

  it('preserves relative order within each group', () => {
    const result = partitionGardenPosts([
      post('series-new', 'series'),
      post('essay-new', 'essays'),
      post('note-new', 'notes'),
      post('series-old', 'series'),
      post('note-old', 'notes'),
    ]);

    expect(result.seriesPosts.map((item) => item.id)).toEqual(['series-new', 'series-old']);
    expect(result.gridPosts.map((item) => item.id)).toEqual(['essay-new', 'note-new', 'note-old']);
  });

  it('returns empty groups for empty input', () => {
    expect(partitionGardenPosts([])).toEqual({ seriesPosts: [], gridPosts: [] });
  });

  it('returns an empty grid group for all-series input', () => {
    const result = partitionGardenPosts([post('series-1', 'series'), post('series-2', 'series')]);

    expect(result.seriesPosts.map((item) => item.id)).toEqual(['series-1', 'series-2']);
    expect(result.gridPosts).toEqual([]);
  });

  it('returns an empty series group for no-series input', () => {
    const result = partitionGardenPosts([post('essay-1', 'essays'), post('note-1', 'notes')]);

    expect(result.seriesPosts).toEqual([]);
    expect(result.gridPosts.map((item) => item.id)).toEqual(['essay-1', 'note-1']);
  });
});

describe('gardenSpan', () => {
  it('maps essays to wide and everything else to card', () => {
    expect(gardenSpan('essays')).toBe('wide');
    expect(gardenSpan('notes')).toBe('card');
    expect(gardenSpan('playground')).toBe('card');
    expect(gardenSpan('unknown')).toBe('card');
  });
});

describe('groupGardenPostsByDate', () => {
  it('preserves the incoming chronological order across series and grid groups', () => {
    const result = groupGardenPostsByDate([
      post('series-new', 'series'),
      post('essay-new', 'essays'),
      post('note-new', 'notes'),
      post('series-old', 'series'),
      post('note-old', 'notes'),
    ]);

    expect(result).toEqual([
      { type: 'series', post: post('series-new', 'series') },
      { type: 'grid', posts: [post('essay-new', 'essays'), post('note-new', 'notes')] },
      { type: 'series', post: post('series-old', 'series') },
      { type: 'grid', posts: [post('note-old', 'notes')] },
    ]);
  });
});
