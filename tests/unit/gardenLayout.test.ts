import { describe, expect, it } from 'vitest';
import {
  gardenSpan,
  gardenSpanClass,
  NOTE_MAX_SPAN,
  groupGardenPostsByDate,
  packGardenGrid,
  packGardenRow,
  partitionGardenPosts,
} from '../../src/utils/gardenLayout';

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

// 'e' = essay, anything else = note. Mirrors the collections in a real garden segment.
const seq = (pattern: string) => [...pattern].map((c) => (c === 'e' ? 'essays' : 'notes'));

describe('packGardenRow', () => {
  it.each([
    // [pattern, cols, expected spans]
    ['nnn', 4, [1, 1, 2]],
    ['nn', 4, [2, 2]],
    ['n', 4, [2]], // lone note is capped at 2: the only short row the cap forces
    ['n', 3, [2]],
    ['e', 4, [4]],
    ['enn', 4, [2, 1, 1]], // today's grid0 at xl: one row
    ['enn', 3, [3, 1, 2]], // today's grid0 at lg: essay takes the row, notes share the next
    ['enn', 2, [2, 1, 1]],
    ['ennnne', 4, [2, 1, 1, 1, 1, 2]], // today's grid1 at xl
    ['ennnne', 3, [3, 1, 1, 1, 1, 2]], // today's grid1 at lg
    ['ennnne', 2, [2, 1, 1, 1, 1, 2]],
    ['nne', 4, [1, 1, 2]],
    ['nnne', 4, [2, 2, 1, 3]],
    ['ee', 4, [2, 2]],
    ['nen', 3, [1, 2, 2]], // unfillable under the cap: the final row stays one slot short
    ['nnnnn', 4, [2, 2, 1, 1, 2]],
    ['een', 3, [3, 2, 1]],
  ])('packs %s into %i columns as %j', (pattern, cols, expected) => {
    expect(packGardenRow(seq(pattern), cols)).toEqual(expected);
  });

  it('gives every card span 1 in a single column and handles empty input', () => {
    expect(packGardenRow(seq('enen'), 1)).toEqual([1, 1, 1, 1]);
    expect(packGardenRow([], 4)).toEqual([]);
  });

  it('fills every row but the last exactly, caps notes, keeps essays at least 2 wide', () => {
    // Deterministic LCG so a failure is reproducible.
    let state = 42;
    const random = () => ((state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296);

    for (let run = 0; run < 200; run++) {
      const length = 1 + Math.floor(random() * 12);
      const collections = Array.from({ length }, () => (random() < 0.35 ? 'essays' : 'notes'));

      for (const cols of [2, 3, 4]) {
        const spans = packGardenRow(collections, cols);
        expect(spans).toHaveLength(collections.length);

        let rowFill = 0;
        spans.forEach((span, i) => {
          if (collections[i] === 'essays') expect(span).toBeGreaterThanOrEqual(2);
          else expect(span).toBeLessThanOrEqual(NOTE_MAX_SPAN);
          expect(rowFill + span).toBeLessThanOrEqual(cols);
          rowFill = (rowFill + span) % cols;
        });

        // A short final row is allowed only when it holds nothing but capped notes,
        // i.e. no card in it could have grown to close the gap.
        if (rowFill !== 0) {
          let start = spans.length;
          for (let fill = 0; fill < rowFill; ) fill += spans[--start];
          for (let i = start; i < spans.length; i++) {
            expect(collections[i]).not.toBe('essays');
            expect(spans[i]).toBe(Math.min(NOTE_MAX_SPAN, cols));
          }
        }
      }
    }
  });
});

describe('packGardenGrid', () => {
  it('packs each breakpoint independently and keeps the posts in order', () => {
    const posts = seq('enn').map((collection, i) => ({ id: `p${i}`, collection }));
    expect(packGardenGrid(posts)).toEqual([
      { post: posts[0], spans: { md: 2, lg: 3, xl: 2 } },
      { post: posts[1], spans: { md: 1, lg: 1, xl: 1 } },
      { post: posts[2], spans: { md: 1, lg: 2, xl: 1 } },
    ]);
  });
});

describe('gardenSpanClass', () => {
  it('returns literal responsive col-span utilities', () => {
    expect(gardenSpanClass({ md: 2, lg: 1, xl: 4 })).toBe('md:col-span-2 lg:col-span-1 xl:col-span-4');
  });
});
