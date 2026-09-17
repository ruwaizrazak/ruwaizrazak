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

{#snippet collectionMark(imageClass = 'size-[15px] shrink-0 opacity-70 dark:invert')}
  <img src={collectionIcon} alt={`${label} icon`} class={imageClass} />
{/snippet}

{#snippet contentImage(imageClass: string)}
  {#if image}
    <div
      class={`${imageClass} bg-cover bg-center bg-no-repeat`}
      style={`background-image: url('${image.src}')`}
      role="img"
      aria-label={title}
    ></div>
  {/if}
{/snippet}

{#snippet cardBand()}
  <span class="card-band-stack flex min-w-0 flex-col">
    {#if isSeriesCollection}
      <span class="mx-4 h-[5px] rounded-t-xl border border-b-0 border-card-border bg-cardbg" aria-hidden="true"></span>
      <span class="mx-2 h-[5px] rounded-t-xl border border-b-0 border-card-border bg-cardbg" aria-hidden="true"></span>
    {/if}
    <span
      class={[
        'card-band',
        {
          'bg-syoro/5': isNote || !image,
          '!border-dashed': isPlayground,
        },
      ]}
    >
      {#if image}
        {@render contentImage('garden-card-image h-full w-full')}
      {:else}
        {@render collectionMark('size-[34px] opacity-30 dark:invert')}
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
  <article
    class="card-shell card-shell-series group relative !flex min-h-[34rem] !flex-col !gap-0 overflow-hidden !p-0 md:!h-[520px] md:min-h-0 md:!flex-row"
    style={vtStyle}
  >
    <a href={url} class="absolute inset-0 z-10" aria-label={`View the ${title} series`}></a>
    <div class="flex h-56 items-center justify-center overflow-hidden bg-syoro/5 sm:h-64 md:h-full md:w-[48%] md:shrink-0 md:border-r md:border-r-card-border">
      {#if image}
        {@render contentImage('h-full w-full')}
      {:else}
        {@render collectionMark('size-[34px] opacity-30 dark:invert')}
      {/if}
    </div>

    <div class="flex min-w-0 flex-1 flex-col p-5">
      {@render eyebrowRow(postCount != null ? `Series · ${postCount} ${postCount === 1 ? 'part' : 'parts'}` : 'Series')}
      <svelte:element this={titleTag} class={`${cardType.title} card-title md:!text-[30px] md:!leading-[1.15]`}>{title}</svelte:element>
      {#if description}<p class={`${cardType.description} card-description`}>{description}</p>{/if}

      {#if posts.length > 0}
        <svelte:element
          this={postsHeadingTag}
          class="mt-5 mb-2.5 font-sans text-[14px] font-medium tracking-eyebrow uppercase text-syoro"
        >Posts in this series</svelte:element>
        <ul class="relative z-20 flex max-h-[14.5rem] min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain pr-1">
          {#each posts as post, index (post.url)}
            <li class="shrink-0">
              <a
                href={post.url}
                class="series-post-row group/row flex h-18 items-center gap-3.5 rounded-xl bg-syoro/5 p-3.5 transition-[background-color] duration-150 ease-[ease] hover:bg-syoro/10"
              >
                <span class="shrink-0 font-mono text-[11px] tracking-meta text-muted">Part {index + 1}</span>
                <span class="min-w-0 flex-1">
                  <span class="block overflow-hidden font-serif text-[17px] font-medium text-ellipsis whitespace-nowrap text-syoro">{post.title}</span>
                  {#if post.description}<span class="mt-0.5 block truncate font-serif text-[14px] text-muted">{post.description}</span>{/if}
                </span>
                <svg
                  class="size-[18px] shrink-0 text-muted transition-[transform,color] duration-200 ease-snappy group-hover/row:translate-x-[3px] group-hover/row:text-link motion-reduce:transition-none motion-reduce:group-hover/row:translate-x-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
            </li>
          {/each}
        </ul>
      {/if}

      <footer class="relative z-20 mt-[18px] flex items-center justify-between gap-4">
        {#if seriesMeta}<p class="card-meta uppercase">{seriesMeta}</p>{/if}
        <a
          href={url}
          class="series-view-all relative z-20 shrink-0 rounded-full bg-konpeki px-[22px] py-3 font-sans text-base font-medium tracking-[0.08em] text-white uppercase transition-[transform,opacity] duration-150 ease-snappy hover:text-white hover:opacity-90 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
        >View all</a>
      </footer>
    </div>
  </article>
{:else}
  <a
    href={url}
    class={[
      'card-shell group',
      {
        'card-shell-wide !grid md:!grid-cols-2 md:!items-stretch md:!gap-[18px]': isWide,
      },
    ]}
    data-collection={collectionKey}
    style={vtStyle}
  >
    {@render cardBand()}
    <span class="flex min-w-0 flex-1 flex-col gap-3">
      {@render eyebrowRow(eyebrow)}
      <svelte:element
        this={titleTag}
        class={[
          cardType.title,
          'card-title',
          { 'md:!text-[26px] md:!leading-[1.15]': isWide },
        ]}
      >{title}</svelte:element>
      {#if description}<span class={[cardType.description, 'card-description line-clamp-2', { 'md:line-clamp-2': isWide }]}>{description}</span>{/if}
      <span class={['card-footer', { 'border-t border-dashed border-t-syoro/25 pt-2.5': isNote }]}>
        <span class="card-meta">
          {isSeriesCollection && lastUpdated ? `Updated ${formatDate(lastUpdated)}` : formattedDate}
        </span>
        {#if maturity}<MaturityBadge {maturity} />{/if}
      </span>
    </span>
  </a>
{/if}
