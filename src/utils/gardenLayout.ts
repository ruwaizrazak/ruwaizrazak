export type GardenSpan = 'wide' | 'card';

/** Essays get the horizontal wide-card treatment; notes and playground stay compact cards. */
export function gardenSpan(collection: string): GardenSpan {
  return collection === 'essays' ? 'wide' : 'card';
}

/** Column count at each grid breakpoint; mobile is always 1 column. The grid never exceeds 4. */
export const GARDEN_COLUMNS = { md: 2, lg: 3, xl: 4 } as const;
export type GardenBreakpoints = { md: number; lg: number; xl: number };

// LEARN: costs rank the packer's options. A mid-grid gap is worst, a short final
// row next, then moving a card one place, then a card sitting off its preferred width.
const SWAP_COST = 50;
const SHORT_LAST_COST = 100;
const SHORT_INNER_COST = 10000;

type SpanRule = { min: number; max: number; preferred: number };

/** Allowed width, in columns, for one card in a `cols`-wide grid. */
export function spanRule(collection: string, cols: number): SpanRule {
  if (collection === 'series') {
    return { min: Math.min(3, cols), max: Math.min(4, cols), preferred: Math.min(4, cols) };
  }
  if (collection === 'essays') {
    return { min: Math.min(2, cols), max: Math.min(3, cols), preferred: Math.min(cols >= 4 ? 3 : 2, cols) };
  }
  return { min: 1, max: Math.min(2, cols), preferred: 1 };
}

type FittedRow = { spans: number[]; short: number; deviation: number };

/** Spans for cards sharing one row: start at preferred, shrink from the end, then grow round-robin from the end. */
function fitRow(collections: string[], cols: number): FittedRow | null {
  const rules = collections.map((collection) => spanRule(collection, cols));
  if (rules.reduce((sum, rule) => sum + rule.min, 0) > cols) return null;

  const spans = rules.map((rule) => rule.preferred);
  let sum = spans.reduce((total, span) => total + span, 0);

  for (let i = spans.length - 1; i >= 0 && sum > cols; i--) {
    const cut = Math.min(sum - cols, spans[i] - rules[i].min);
    spans[i] -= cut;
    sum -= cut;
  }

  while (sum < cols) {
    let grew = false;
    for (let i = spans.length - 1; i >= 0 && sum < cols; i--) {
      if (spans[i] >= rules[i].max) continue;
      spans[i] += 1;
      sum += 1;
      grew = true;
    }
    if (!grew) break;
  }

  const deviation = spans.reduce((total, span, i) => total + Math.abs(span - rules[i].preferred), 0);
  return { spans, short: cols - sum, deviation };
}

type PackState = { cost: number; placed: number[]; spans: number[] };

/**
 * Place cards into a `cols`-wide grid. Returns, for each INPUT index, its visual position
 * (`order`) and its width (`spans`).
 *
 * Dynamic programming over states `p * 2 + pending`: `p` input cards are settled, and
 * `pending === 1` means card p+1 was already placed ahead of card p (a neighbour swap),
 * so card p must come next. From every state it tries every next row of 1..cols
 * placements, where each placement either takes the next card or swaps the next two.
 * The only reorder is non-overlapping neighbour swaps, so no card moves more than one place.
 */
export function packGardenRow(collections: string[], cols: number): { order: number[]; spans: number[] } {
  const n = collections.length;
  if (n === 0) return { order: [], spans: [] };
  if (cols <= 1) return { order: collections.map((_, i) => i), spans: collections.map(() => 1) };

  const best: (PackState | undefined)[] = Array(2 * n + 1);
  best[0] = { cost: 0, placed: [], spans: [] };
  const isDone = (p: number, pending: number) => p >= n && pending === 0;

  for (let key = 0; key < 2 * n; key++) {
    const from = best[key];
    if (!from) continue;

    const walk = (p: number, pending: number, placed: number[], swaps: number): void => {
      if (placed.length > 0) {
        const row = fitRow(placed.map((i) => collections[i]), cols);
        if (row) {
          const shortCost = isDone(p, pending) ? SHORT_LAST_COST : SHORT_INNER_COST;
          const cost = from.cost + row.deviation + swaps * SWAP_COST + row.short * shortCost;
          const to = p * 2 + pending;
          const current = best[to];
          if (!current || cost < current.cost) {
            best[to] = { cost, placed: [...from.placed, ...placed], spans: [...from.spans, ...row.spans] };
          }
        }
      }
      if (placed.length === cols || isDone(p, pending)) return;
      if (pending === 1) {
        walk(p + 2, 0, [...placed, p], swaps);
        return;
      }
      walk(p + 1, 0, [...placed, p], swaps);
      if (p + 1 < n) walk(p, 1, [...placed, p + 1], swaps + 1);
    };

    walk(key >> 1, key & 1, [], 0);
  }

  const end = best[2 * n]!;
  const order: number[] = Array(n);
  const spans: number[] = Array(n);
  end.placed.forEach((input, position) => {
    order[input] = position;
    spans[input] = end.spans[position];
  });
  return { order, spans };
}

/** packGardenRow at each breakpoint, zipped back onto the posts in their input order. */
// LEARN: This helper stays Astro-free because GardenCards is a client island;
// importing astro:content through this path would leak a server-only module.
export function packGardenGrid<T extends { collection: string }>(
  posts: T[],
): { post: T; spans: GardenBreakpoints; orders: GardenBreakpoints }[] {
  const collections = posts.map((post) => post.collection);
  const md = packGardenRow(collections, GARDEN_COLUMNS.md);
  const lg = packGardenRow(collections, GARDEN_COLUMNS.lg);
  const xl = packGardenRow(collections, GARDEN_COLUMNS.xl);

  return posts.map((post, i) => ({
    post,
    spans: { md: md.spans[i], lg: lg.spans[i], xl: xl.spans[i] },
    orders: { md: md.order[i], lg: lg.order[i], xl: xl.order[i] },
  }));
}

// LEARN: Tailwind only emits classes it can read verbatim, so the per-card numbers
// travel as CSS custom properties and this one literal class string reads them.
export const GARDEN_PLACEMENT_CLASS =
  'md:col-span-(--span-md) lg:col-span-(--span-lg) xl:col-span-(--span-xl) md:order-(--order-md) lg:order-(--order-lg) xl:order-(--order-xl)';

/** Inline custom properties consumed by GARDEN_PLACEMENT_CLASS. */
export function gardenPlacementStyle(spans: GardenBreakpoints, orders: GardenBreakpoints): string {
  return [
    `--span-md: ${spans.md}`,
    `--span-lg: ${spans.lg}`,
    `--span-xl: ${spans.xl}`,
    `--order-md: ${orders.md}`,
    `--order-lg: ${orders.lg}`,
    `--order-xl: ${orders.xl}`,
  ].join('; ');
}
