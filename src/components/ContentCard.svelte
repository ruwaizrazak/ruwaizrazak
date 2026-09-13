<script lang="ts">
  import type { ContentCardProps } from '../types';
  import { cardType } from '../styles/typography';
  import { formatDate } from '../utils/formatDate';
  import MaturityBadge from './MaturityBadge.svelte';

  let {
    title = 'Untitled',
    description = '',
    pubDate,
    image = null,
    url,
    maturity,
    collection = 'notes',
    variant = 'card',
    transitionName,
    headingLevel = 3,
    startedDate,
    lastUpdated,
    postCount,
    posts = [],
  }: ContentCardProps = $props();

  const collectionLabels: Record<string, string> = {
    essays: 'Essays',
    notes: 'Notes',
    playground: 'Playground',
    series: 'Series',
    seriesPosts: 'Series',
  };

  const collectionKey = $derived(collection === 'seriesPosts' ? 'series' : collection);
  const label = $derived(collectionLabels[collection] ?? collection);
  const collectionIcon = $derived(`/icons/${collectionKey}.svg`);
  const titleTag = $derived(`h${headingLevel}` as 'h2' | 'h3');
  const postsHeadingTag = $derived(`h${Math.min(headingLevel + 1, 6)}` as 'h3' | 'h4');
  const formattedDate = $derived(formatDate(pubDate));
  const isSeries = $derived(variant === 'series');
  const isWide = $derived(variant === 'wide');
  const isNote = $derived(collection === 'notes');
  const isPlayground = $derived(collection === 'playground');
  const isSeriesCollection = $derived(collection === 'series');
  const eyebrow = $derived(
    isSeriesCollection && postCount != null
      ? `${label} · ${postCount} ${postCount === 1 ? 'part' : 'parts'}`
      : label,
  );
  const vtStyle = $derived(
    transitionName ? `view-transition-name: ${transitionName}` : undefined,
  );
  const seriesMeta = $derived.by(() => {
    const parts: string[] = [];
    if (startedDate) parts.push(`Started ${formatDate(startedDate)}`);
    if (lastUpdated) parts.push(`Updated ${formatDate(lastUpdated)}`);
    if (postCount != null) parts.push(`${postCount} ${postCount === 1 ? 'post' : 'posts'}`);
    return parts.join(' · ');
  });
</script>

{#snippet collectionMark(size = 'card-collection-icon')}
  <span
    class={size}
    style={`--card-icon: url('${collectionIcon}')`}
    aria-hidden="true"
  ></span>
{/snippet}

{#snippet optimizedImage(imageClass: string)}
  {#if image}
    {#if image.passthrough}
      <img src={image.src} alt={title} class={imageClass} />
    {:else}
      <img
        src={image.src}
        alt={title}
        loading="lazy"
        decoding="async"
        fetchpriority="auto"
        width={image.width}
        height={image.height}
        class={imageClass}
      />
    {/if}
  {/if}
{/snippet}

{#snippet cardBand()}
  <span class="card-band-stack flex min-w-0 flex-col">
    {#if isSeriesCollection}
      <span class="series-sheet mx-4" aria-hidden="true"></span>
      <span class="series-sheet mx-2" aria-hidden="true"></span>
    {/if}
    <span
      class:card-band-note={isNote || !image}
      class:card-band-playground={isPlayground}
      class="card-band"
    >
      {#if image}
        {@render optimizedImage('garden-card-image h-full w-full object-cover')}
      {:else}
        {@render collectionMark('card-band-icon')}
      {/if}
      {#if isPlayground}
        <span
          class="absolute right-2.5 bottom-2.5 rounded-full border border-card-border bg-cardbg px-2 py-[3px] font-mono text-[9px] tracking-[0.12em] uppercase text-syoro"
        >Interactive</span>
      {/if}
    </span>
  </span>
{/snippet}

{#snippet eyebrowRow(text: string)}
  <span class="card-eyebrow">
    {@render collectionMark()}
    <span>{text}</span>
  </span>
{/snippet}

{#if isSeries}
  <article class="card-shell card-shell-series group" style={vtStyle}>
    <a href={url} class="absolute inset-0 z-10" aria-label={`View the ${title} series`}></a>
    <div class="series-featured-band flex aspect-[16/10] items-center justify-center overflow-hidden md:aspect-auto md:w-[48%] md:shrink-0 md:border-r md:border-r-card-border">
      {#if image}
        {@render optimizedImage('h-full w-full object-cover')}
      {:else}
        {@render collectionMark('card-band-icon')}
      {/if}
    </div>

    <div class="flex min-w-0 flex-1 flex-col p-5">
      {@render eyebrowRow(postCount != null ? `Series · ${postCount} ${postCount === 1 ? 'part' : 'parts'}` : 'Series')}
      <svelte:element this={titleTag} class={`${cardType.title} card-title`}>{title}</svelte:element>
      {#if description}<p class={`${cardType.description} card-description`}>{description}</p>{/if}

      {#if posts.length > 0}
        <svelte:element
          this={postsHeadingTag}
          class="mt-5 mb-2.5 font-sans text-[14px] font-medium tracking-eyebrow uppercase text-syoro"
        >Posts in this series</svelte:element>
        <ul class="series-post-list relative z-20 flex max-h-[50vh] min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 md:max-h-none">
          {#each posts as post, index (post.url)}
            <li>
              <a
                href={post.url}
                class="series-post-row group/row flex items-center gap-3.5 rounded-xl bg-syoro/5 p-3.5 transition-[background-color] duration-150 ease-[ease]"
              >
                <span class="shrink-0 font-mono text-[11px] tracking-meta text-muted">Part {index + 1}</span>
                <span class="min-w-0 flex-1">
                  <span class="block overflow-hidden font-serif text-[17px] font-medium text-ellipsis whitespace-nowrap text-syoro">{post.title}</span>
                  {#if post.description}<span class="mt-0.5 block font-serif text-[14px] text-muted">{post.description}</span>{/if}
                </span>
                <svg class="series-row-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
            </li>
          {/each}
        </ul>
      {/if}

      <footer class="relative z-20 mt-[18px] flex items-center justify-between gap-4">
        {#if seriesMeta}<p class="card-meta uppercase">{seriesMeta}</p>{/if}
        <a href={url} class="series-view-all">View all</a>
      </footer>
    </div>
  </article>
{:else}
  <a
    href={url}
    class:card-shell-wide={isWide}
    class="card-shell group"
    data-collection={collectionKey}
    style={vtStyle}
  >
    {@render cardBand()}
    <span class="flex min-w-0 flex-1 flex-col gap-3">
      {@render eyebrowRow(eyebrow)}
      <svelte:element this={titleTag} class={`${cardType.title} card-title`}>{title}</svelte:element>
      {#if description}<span class={`${cardType.description} card-description line-clamp-2`}>{description}</span>{/if}
      <span class:card-footer-note={isNote} class="card-footer">
        <span class="card-meta">
          {isSeriesCollection && lastUpdated ? `Updated ${formatDate(lastUpdated)}` : formattedDate}
        </span>
        {#if maturity}<MaturityBadge {maturity} />{/if}
      </span>
    </span>
  </a>
{/if}

<style>
  /* LEARN: what is left here is only what the justified-<style> bar allows —
     see AGENTS.md. Three reasons appear:
       (a) a two-token color-mix(), which has no `bg-token/N` equivalent;
       (b) mask, which Tailwind has no utility for;
       (c) a selector or media query Tailwind cannot write — descendant rules,
           and `(hover: hover) and (pointer: fine)`, whose `pointer: fine` half
           Tailwind's `hover:` variant drops.
     A fourth reason is specific to this repo: `.card-shell`, `.card-band` and
     `.card-footer` are declared in global.css OUTSIDE any @layer, and unlayered
     author styles beat every layered utility — so a variant that overrides their
     padding, gap or border-style cannot be a utility either. */

  /* (a) two-token color-mix */
  .series-sheet {
    height: 5px;
    border: 1px solid var(--color-card-border);
    border-bottom: 0;
    border-radius: 12px 12px 0 0;
    background: color-mix(in srgb, var(--color-cardbg) 94%, var(--color-card-border));
  }

  .card-band-note {
    background: color-mix(in srgb, var(--color-syoro) 5%, var(--color-cardbg));
  }

  .series-featured-band {
    background: color-mix(in srgb, var(--color-syoro) 5%, var(--color-cardbg));
  }

  /* Both override an unlayered global rule: `.card-band`'s `border: 1px solid`
     shorthand, and `.card-shell`'s `border-color`. A layered utility loses to
     either, so neither can be translated. */
  .card-band-playground { border-style: dashed; }

  .card-footer-note {
    border-top: 1px dashed color-mix(in srgb, var(--color-syoro) 25%, transparent);
    padding-top: 10px;
  }

  /* (b) mask */
  .card-band-icon {
    width: 34px;
    height: 34px;
    background: color-mix(in srgb, var(--color-syoro) 30%, transparent);
    -webkit-mask: var(--card-icon) center / contain no-repeat;
    mask: var(--card-icon) center / contain no-repeat;
  }

  .series-post-list {
    -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 1.5rem), transparent);
    mask-image: linear-gradient(to bottom, #000 calc(100% - 1.5rem), transparent);
  }

  /* Variant shells: both override unlayered `.card-shell` padding/gap. */
  .card-shell-wide { display: grid; }

  .card-shell-series {
    position: relative;
    display: flex;
    min-height: 34rem;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
    padding: 0;
  }

  /* Per-property durations AND easings differ, which no single transition-*
     utility pair can express. */
  .series-row-arrow {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: var(--color-muted);
    transition: transform 200ms var(--ease-snappy), color 150ms ease;
  }

  .series-view-all {
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--color-konpeki);
    padding: 12px 22px;
    font-family: var(--font-sans);
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: white;
    transition: transform 150ms var(--ease-snappy), opacity 150ms ease;
  }

  .series-view-all:hover { color: white; opacity: 0.9; }
  .series-view-all:active { transform: scale(0.97); }

  /* (c) descendant selectors */
  @media (min-width: 768px) {
    .card-shell-wide {
      grid-template-columns: 1fr 1fr;
      align-items: stretch;
      gap: 18px;
    }

    .card-shell-wide .card-band-stack { height: 100%; }
    .card-shell-wide .card-band { aspect-ratio: auto; height: 100%; }
    .card-shell-wide .card-title { font-size: 26px; line-height: 1.15; }
    .card-shell-wide .card-description {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
    }

    .card-shell-series {
      min-height: 0;
      height: 470px;
      flex-direction: row;
    }

    .card-shell-series .card-title { font-size: 30px; line-height: 1.15; }
  }

  /* Tailwind's `hover:` is `(hover: hover)` only — it drops `pointer: fine`,
     so translating these would make them fire on tap. */
  @media (hover: hover) and (pointer: fine) {
    .card-shell-wide:hover { transform: scale(0.98); }
    .series-post-row:hover { background: color-mix(in srgb, var(--color-syoro) 10%, transparent); }
    .series-post-row:hover .series-row-arrow { transform: translateX(3px); color: var(--color-link); }
  }

  @media (prefers-reduced-motion: reduce) {
    .series-row-arrow,
    .series-view-all { transition: none; }
    .series-post-row:hover .series-row-arrow,
    .series-view-all:active { transform: none; }
  }
</style>
