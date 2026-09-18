export type GardenSpan = 'wide' | 'card';
export type GardenLayoutGroup<T> =
  | { type: 'series'; post: T }
  | { type: 'grid'; posts: T[] };

/** Column count at each grid breakpoint; mobile is always 1 column. */
export const GARDEN_COLUMNS = { md: 2, lg: 3, xl: 4 } as const;
/** A note never stretches past this many columns (user decision, A1). */
export const NOTE_MAX_SPAN = 2;
export type GardenSpans = { md: number; lg: number; xl: number };

type PackedRow = { cost: number; full: boolean; spans: number[] };

function fitRow(collections: string[], cols: number, start: number, end: number): PackedRow | null {
  const rules = collections.slice(start, end).map((collection) => {
    const isEssay = collection === 'essays';
    return {
      min: isEssay ? Math.min(2, cols) : 1,
      max: isEssay ? cols : Math.min(NOTE_MAX_SPAN, cols),
      preferred: Math.min(isEssay && cols >= 4 ? 3 : isEssay ? 2 : 1, cols),
    };
  });

  if (rules.reduce((sum, rule) => sum + rule.min, 0) > cols) return null;

  const spans = rules.map((rule) => rule.preferred);
  let sum = spans.reduce((total, span) => total + span, 0);

  for (let i = spans.length - 1; i >= 0 && sum > cols; i--) {
    const cut = Math.min(spans[i] - rules[i].min, sum - cols);
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
  return { cost: (cols - sum) * 100 + deviation, full: sum === cols, spans };
}

/**
 * Span for each card in a `cols`-wide grid, in input order, so every row is exactly full.
 * Only the final row may be short when capped notes cannot fill it.
 */
export function packGardenRow(collections: string[], cols: number): number[] {
  if (collections.length === 0) return [];
  if (cols <= 1) return collections.map(() => 1);

  const best: ({ cost: number; spans: number[] } | undefined)[] = Array(collections.length + 1);
  best[0] = { cost: 0, spans: [] };

  for (let end = 1; end <= collections.length; end++) {
    for (let start = 0; start < end; start++) {
      const prefix = best[start];
      if (!prefix) continue;

      const row = fitRow(collections, cols, start, end);
      if (!row || (!row.full && end !== collections.length)) continue;

      const cost = prefix.cost + row.cost;
      if (!best[end] || cost < best[end].cost) {
        best[end] = { cost, spans: [...prefix.spans, ...row.spans] };
      }
    }
  }

  return best[collections.length]?.spans ?? [];
}

/** packGardenRow run once per breakpoint over one grid segment. */
export function packGardenGrid<T extends { collection: string }>(
  posts: T[],
): { post: T; spans: GardenSpans }[] {
  const collections = posts.map((post) => post.collection);
  const md = packGardenRow(collections, GARDEN_COLUMNS.md);
  const lg = packGardenRow(collections, GARDEN_COLUMNS.lg);
  const xl = packGardenRow(collections, GARDEN_COLUMNS.xl);

  return posts.map((post, i) => ({ post, spans: { md: md[i], lg: lg[i], xl: xl[i] } }));
}

const MD_SPAN: Record<number, string> = { 1: 'md:col-span-1', 2: 'md:col-span-2' };
const LG_SPAN: Record<number, string> = { 1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3' };
const XL_SPAN: Record<number, string> = {
  1: 'xl:col-span-1', 2: 'xl:col-span-2', 3: 'xl:col-span-3', 4: 'xl:col-span-4',
};

/** Literal Tailwind classes for a card's spans, e.g. 'md:col-span-2 lg:col-span-1 xl:col-span-2'. */
export function gardenSpanClass(spans: GardenSpans): string {
  return [MD_SPAN[spans.md], LG_SPAN[spans.lg], XL_SPAN[spans.xl]].join(' ');
}

/** Series entries lead the page as panels; everything else flows into the grid. */
export function partitionGardenPosts<T extends { collection: string }>(posts: T[]) {
  // LEARN: This helper stays Astro-free because GardenCards is a client island;
  // importing astro:content through this path would leak a server-only module.
  return {
    seriesPosts: posts.filter((post) => post.collection === 'series'),
    gridPosts: posts.filter((post) => post.collection !== 'series'),
  };
}

/** Keep the visible garden chronological while letting series stay full-width panels. */
export function groupGardenPostsByDate<T extends { collection: string }>(
  posts: T[],
): GardenLayoutGroup<T>[] {
  const groups: GardenLayoutGroup<T>[] = [];
  let gridPosts: T[] = [];

  for (const post of posts) {
    if (post.collection === 'series') {
      if (gridPosts.length > 0) {
        groups.push({ type: 'grid', posts: gridPosts });
        gridPosts = [];
      }
      groups.push({ type: 'series', post });
      continue;
    }

    gridPosts.push(post);
  }

  if (gridPosts.length > 0) groups.push({ type: 'grid', posts: gridPosts });

  return groups;
}

/** Essays get the horizontal span-3 treatment; notes and playground stay 1-col. */
export function gardenSpan(collection: string): GardenSpan {
  return collection === 'essays' ? 'wide' : 'card';
}
