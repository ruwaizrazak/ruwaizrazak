import { describe, expect, it } from 'vitest';
import {
  GARDEN_PLACEMENT_CLASS,
  gardenPlacementStyle,
  gardenSpan,
  packGardenGrid,
  packGardenRow,
  spanRule,
} from '../../src/utils/gardenLayout';

// s = series, e = essay, n = note. Mirrors the collections on /garden.
const seq = (pattern: string) =>
  [...pattern].map((c) => (c === 's' ? 'series' : c === 'e' ? 'essays' : 'notes'));

describe('gardenSpan', () => {
  it('maps essays to wide and everything else to card', () => {
    expect(gardenSpan('essays')).toBe('wide');
    expect(gardenSpan('notes')).toBe('card');
    expect(gardenSpan('playground')).toBe('card');
    expect(gardenSpan('unknown')).toBe('card');
  });
});

describe('spanRule', () => {
  it('keeps series 3-4, essays 2-3 and notes 1-2 wide in a 4-column grid', () => {
    expect(spanRule('series', 4)).toEqual({ min: 3, max: 4, preferred: 4 });
    expect(spanRule('essays', 4)).toEqual({ min: 2, max: 3, preferred: 3 });
    expect(spanRule('notes', 4)).toEqual({ min: 1, max: 2, preferred: 1 });
    expect(spanRule('playground', 4)).toEqual({ min: 1, max: 2, preferred: 1 });
  });

  it('clamps every range to narrower grids', () => {
    expect(spanRule('series', 2)).toEqual({ min: 2, max: 2, preferred: 2 });
    expect(spanRule('essays', 3)).toEqual({ min: 2, max: 3, preferred: 2 });
    expect(spanRule('notes', 1)).toEqual({ min: 1, max: 1, preferred: 1 });
  });
});

describe('packGardenRow', () => {
  it.each([
    // [pattern, cols, { order: visual position per input card, spans: width per input card }]
    ['nnn', 4, { order: [0, 1, 2], spans: [1, 1, 2] }],
    ['n', 4, { order: [0], spans: [2] }], // capped note: the final row stays short
    ['e', 4, { order: [0], spans: [3] }], // capped essay: the final row stays short
    ['s', 3, { order: [0], spans: [3] }],
    ['s', 4, { order: [0], spans: [4] }],
    ['sn', 4, { order: [0, 1], spans: [3, 1] }], // series narrows to share its row
    ['ss', 4, { order: [0, 1], spans: [4, 4] }],
    ['ee', 4, { order: [0, 1], spans: [2, 2] }],
    ['enn', 4, { order: [0, 1, 2], spans: [2, 1, 1] }],
    ['enn', 3, { order: [0, 1, 2], spans: [3, 1, 2] }],
    ['esn', 4, { order: [1, 0, 2], spans: [3, 4, 1] }], // swap: series first, essay shares with the note
    ['ese', 4, { order: [1, 0, 2], spans: [2, 4, 2] }],
    ['nsn', 3, { order: [1, 0, 2], spans: [1, 3, 2] }],
    ['nen', 3, { order: [1, 0, 2], spans: [1, 3, 2] }],
    // today's /garden, in date order
    ['sennsennnne', 2, { order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], spans: [2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 2] }],
    ['sennsennnne', 3, { order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], spans: [3, 3, 1, 2, 3, 3, 1, 1, 1, 1, 2] }],
    ['sennsennnne', 4, { order: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], spans: [4, 3, 1, 1, 3, 2, 1, 1, 1, 1, 2] }],
  ])('packs %s into %i columns', (pattern, cols, expected) => {
    expect(packGardenRow(seq(pattern), cols)).toEqual(expected);
  });

  it('gives every card span 1 in place in a single column, and handles empty input', () => {
    expect(packGardenRow(seq('sen'), 1)).toEqual({ order: [0, 1, 2], spans: [1, 1, 1] });
    expect(packGardenRow([], 4)).toEqual({ order: [], spans: [] });
  });

  it('keeps widths in range, moves no card more than one place, and fills every row but the last', () => {
    // Deterministic LCG so a failure is reproducible. Adjacent series are excluded: two series
    // in a row after a lone card is the one case a single neighbour swap cannot close.
    let state = 42;
    const random = () => ((state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296);

    for (let run = 0; run < 300; run++) {
      const length = 1 + Math.floor(random() * 14);
      const collections: string[] = [];
      while (collections.length < length) {
        const x = random();
        const next = x < 0.12 ? 'series' : x < 0.4 ? 'essays' : 'notes';
        if (next === 'series' && collections.at(-1) === 'series') continue;
        collections.push(next);
      }

      for (const cols of [2, 3, 4]) {
        const { order, spans } = packGardenRow(collections, cols);
        expect([...order].sort((a, b) => a - b)).toEqual(collections.map((_, i) => i));

        const placed: number[] = [];
        order.forEach((position, input) => {
          expect(Math.abs(position - input)).toBeLessThanOrEqual(1);
          const rule = spanRule(collections[input], cols);
          expect(spans[input]).toBeGreaterThanOrEqual(rule.min);
          expect(spans[input]).toBeLessThanOrEqual(rule.max);
          placed[position] = input;
        });

        let rowFill = 0;
        let rowsClosed = 0;
        const totalRows: number[] = [];
        for (const input of placed) {
          expect(rowFill + spans[input]).toBeLessThanOrEqual(cols);
          rowFill += spans[input];
          if (rowFill === cols) {
            totalRows.push(rowFill);
            rowsClosed += 1;
            rowFill = 0;
          }
        }
        // Any short row can only be the trailing one: everything before it closed exactly full.
        expect(totalRows.every((fill) => fill === cols)).toBe(true);
        expect(rowsClosed * cols + rowFill).toBe(placed.reduce((sum, input) => sum + spans[input], 0));
      }
    }
  });
});

describe('packGardenGrid', () => {
  it('packs each breakpoint independently and returns posts in input order', () => {
    const posts = seq('esn').map((collection, i) => ({ id: `p${i}`, collection }));
    expect(packGardenGrid(posts)).toEqual([
      // md keeps date order; lg and xl both pull the series ahead of the essay.
      { post: posts[0], spans: { md: 2, lg: 2, xl: 3 }, orders: { md: 0, lg: 1, xl: 1 } },
      { post: posts[1], spans: { md: 2, lg: 3, xl: 4 }, orders: { md: 1, lg: 0, xl: 0 } },
      { post: posts[2], spans: { md: 2, lg: 1, xl: 1 }, orders: { md: 2, lg: 2, xl: 2 } },
    ]);
  });
});

describe('gardenPlacementStyle', () => {
  it('writes the custom properties GARDEN_PLACEMENT_CLASS reads', () => {
    expect(gardenPlacementStyle({ md: 2, lg: 3, xl: 4 }, { md: 0, lg: 1, xl: 2 })).toBe(
      '--span-md: 2; --span-lg: 3; --span-xl: 4; --order-md: 0; --order-lg: 1; --order-xl: 2',
    );
    for (const prop of ['--span-md', '--span-lg', '--span-xl', '--order-md', '--order-lg', '--order-xl']) {
      expect(GARDEN_PLACEMENT_CLASS).toContain(`(${prop})`);
    }
  });
});
