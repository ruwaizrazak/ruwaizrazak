<script lang="ts">
  // ============================================================================
  // ContentCard — the single card component for all garden/listing collections.
  // Consolidates the old EssayCard/NoteCard/PlaygroundCard AND GardenSeriesCard
  // into one component selected by the `variant` prop:
  //   compact → text-only row (notes)        wide → image + text side-by-side (essays)
  //   series  → full-width series card        card → image-top card (default/playground)
  // ============================================================================

  import type { ContentCardProps } from '../types';
  import { formatDate } from '../utils/formatDate';
  import MaturityBadge from './MaturityBadge.svelte';
  // LEARN: shared type tokens — keeps card font sizes uniform across all variants.
  import { cardType } from '../styles/typography';

  let {
    title = 'Untitled',
    description = '',
    pubDate,
    image = null,
    url,
    imageHeight = 'h-48',
    maturity,
    collection,
    variant = 'card',
    transitionName,
    headingLevel = 3,
    // series-only
    startedDate,
    lastUpdated,
    postCount,
    posts = [],
  }: ContentCardProps = $props();

  /**
   * LEARN: the card's title level depends on where the card sits, so it cannot be
   * hard-coded. On a listing page the cards follow the page's <h1> directly, so a
   * fixed h3 skipped h2 and broke the document outline. Nested under a section
   * heading (RelatedNotes' "Related to", GardenPreview's "From the Garden") h3 is
   * correct. Default 3; listing grids pass 2.
   */
  const titleTag = $derived(`h${headingLevel}` as 'h2' | 'h3');

  // ---- Derived values ----
  const formattedDate = $derived(formatDate(pubDate));

  const collectionLabels: Record<string, string> = {
    essays: 'Essays',
    notes: 'Notes',
    playground: 'Playground',
    series: 'Series',
  };
  const label = $derived(collection ? collectionLabels[collection] || collection : '');

  const isCompact = $derived(variant === 'compact');
  const isWide = $derived(variant === 'wide');
  const isSeries = $derived(variant === 'series');

  // LEARN: Astro's `transition:name` directive doesn't exist in Svelte; setting the
  // CSS property directly is what that directive compiles to. Kept undefined when
  // there's no name so the attribute is omitted rather than emitted empty.
  const vtStyle = $derived(transitionName ? `view-transition-name: ${transitionName}` : undefined);

  // series-only: featured image is rendered as a CSS background, plus a one-line
  // metadata string with no spaces around the "·" separators.
  const metaParts = $derived.by(() => {
    const parts: string[] = [];
    if (startedDate) parts.push(`Started ${formatDate(startedDate)}`);
    if (lastUpdated) parts.push(`Updated ${formatDate(lastUpdated)}`);
    if (postCount != null) parts.push(`${postCount} ${postCount === 1 ? 'post' : 'posts'}`);
    return parts;
  });
  const meta = $derived(metaParts.join('·'));
</script>

<!-- LEARN: the collection label ("Essays", "Notes", "Series") is a <p>, not an
     <h5>. It is a metadata badge, not a section heading — and as an h5 sitting
     directly after the page's <h1> it produced h1->h5 / h3->h5 jumps in the
     document outline on every listing page. It carries cardType.meta classes, so
     the change is invisible.
     LEARN: the `garden-card-image` class is preserved on every image branch so the
     CSS scroll-driven parallax zoom in global.css keeps applying. A passthrough
     (remote) image gets no width/height/loading attributes, matching what the old
     `heroImg ? <Image> : <img>` fallback emitted. -->
{#snippet cardImage(extraClass: string)}
  {#if image}
    {#if image.passthrough}
      <img src={image.src} alt={title} class={`garden-card-image ${extraClass}`} />
    {:else}
      <img
        src={image.src}
        alt={title}
        loading="lazy"
        decoding="async"
        fetchpriority="auto"
        width={image.width}
        height={image.height}
        class={`garden-card-image ${extraClass}`}
      />
    {/if}
  {/if}
{/snippet}

{#if isCompact}
  <!-- ===== COMPACT variant (notes): text-only row with dashed bottom border ===== -->
  <div class="group hover:scale-95 transition-transform duration-200 ease-snappy" style={vtStyle}>
    <a href={url} class="block p-5 border-b-1 bg-backgroundcolor border-syoro border-opacity-10 border-dashed relative">
      <div class="flex gap-2 py-2 items-center">
        <p class={`${cardType.meta} text-konpeki`}>{label}</p>
      </div>
      <svelte:element this={titleTag} class={`${cardType.title} text-syoro group-hover:text-link mb-4`}>{title}</svelte:element>
      {#if description}<p class={`${cardType.description} text-syoro/90 mb-4`}>{description}</p>{/if}
      <div class={`${cardType.date} text-syoro/40 mt-2 flex items-center gap-2`}>
        {formattedDate}
        {#if maturity}<MaturityBadge {maturity} iconClass="w-4 h-auto" />{/if}
      </div>
    </a>
  </div>
{:else if isSeries}
  <!-- ===== SERIES variant: full-width card — left background image (full height
       on desktop, banner on mobile) + content panel with a scrollable list of
       linked posts and a "Visit Entire Series" CTA. ===== -->
  <div class="group py-5" style={vtStyle}>
    <!-- LEARN: fixed desktop height (not max-h) gives the row a definite height so
         the left image column reliably fills the full 50% width × full height. -->
    <div class="relative bg-backgroundcolor rounded-lg border-1 border-card-border shadow-xs transition-shadow duration-200 group-hover:shadow-md overflow-hidden flex flex-col md:flex-row md:h-[34rem]">
      <!-- LEARN: "stretched link" pattern — a sibling overlay <a> (not a wrapper)
           makes the whole card clickable without nesting anchors (invalid HTML).
           Inner links sit above it via a higher z-index so they stay independently
           clickable. Non-interactive content (image/title) falls through to this
           card link. CSS-only, so middle-click / open-in-new-tab / focus all work. -->
      <a href={url} class="absolute inset-0 z-10" aria-label={`View the ${title} series`}></a>
      <!-- Featured image as the div's background; role/aria-label restore the alt
           text a background image otherwise loses. -->
      {#if image}
        <div
          class="w-full aspect-[16/10] md:aspect-auto md:w-1/2 md:h-full shrink-0 bg-cover bg-center bg-no-repeat"
          style={`background-image: url('${image.src}')`}
          role="img"
          aria-label={title}
        ></div>
      {/if}

      <!-- Content panel -->
      <div class="flex-1 min-w-0 flex flex-col p-5">
        <p class={`${cardType.meta} text-konpeki`}>Series</p>
        <svelte:element this={titleTag} class={`${cardType.title} text-syoro`}>{title}</svelte:element>
        {#if description}<p class={`${cardType.description} text-syoro/80`}>{description}</p>{/if}

        {#if posts.length > 0}
          <svelte:element this={`h${headingLevel + 1}`} class={`${cardType.meta} text-syoro mt-6 mb-3`}
            >Posts in this series</svelte:element
          >
          <!-- LEARN: native scroll + a CSS mask fades the last row at the bottom
               edge, signalling "more below" without any JS.
               Mobile: `max-h-[50vh]` gives the list a bounded height so it can
               overflow-scroll on its own (the card's fixed height is desktop-only
               via `md:h-[34rem]`, so mobile has no bound otherwise). `md:max-h-none`
               hands control back to `flex-1 min-h-0` on desktop — no regression.
               `overscroll-contain` stops the list's scroll from chaining to the
               page, so it scrolls separately under touch. -->
          <ul class="series-post-list relative z-20 flex-1 min-h-0 max-h-[50vh] md:max-h-none overscroll-contain overflow-y-auto flex flex-col gap-2 pr-1">
            {#each posts as post (post.url)}
              <li>
                <a
                  href={post.url}
                  class="series-post-row group/row flex items-center gap-4 rounded-lg bg-syoro/5 hover:bg-syoro/10 p-4 transition-colors"
                >
                  <div class="min-w-0 flex-1">
                    <p class="font-sans font-semibold text-syoro group-hover/row:text-link truncate">{post.title}</p>
                    {#if post.description}<p class="font-sans text-syoro/60 text-sm mt-1 line-clamp-2">{post.description}</p>{/if}
                  </div>
                  <svg
                    class="series-row-arrow shrink-0 w-5 h-5 text-syoro/40 group-hover/row:text-link"
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

        <!-- Footer: metadata + CTA -->
        <div class="flex flex-row justify-between items-center mt-6">
          {#if meta}<p class={`${cardType.meta} text-syoro/40 w-3/4`}>{meta}</p>{/if}
          <a
            href={url}
            class="relative z-20 inline-flex items-center px-6 py-3 rounded-xl bg-konpeki text-white hover:opacity-90 font-sans font-medium text-sm transition-[transform,opacity] duration-[180ms] ease-snappy active:scale-[0.97]"
          >
            View all
          </a>
        </div>
      </div>
    </div>
  </div>
{:else if isWide}
  <!-- ===== WIDE variant (essays): image left, text right ===== -->
  <div class="group hover:scale-95 transition-transform duration-200 ease-snappy py-5" style={vtStyle}>
    <a href={url} class="bg-syoro/5 rounded-lg border-1 border-card-border shadow-xs group-hover:shadow-none relative flex flex-col md:flex-row overflow-hidden">
      {#if image}
        <div class="w-full md:w-1/2 lg:w-2/3 shrink-0 grow-0 overflow-hidden">
          {@render cardImage('w-full h-full object-cover')}
        </div>
      {/if}
      <div class="flex-1 min-w-0 p-5 flex flex-col justify-between">
        <div class="mx-auto">
          <svelte:element this={titleTag} class={`${cardType.title} text-syoro group-hover:text-link mb-4`}>{title}</svelte:element>
          {#if description}<p class={`${cardType.description} text-syoro/90 mb-4`}>{description}</p>{/if}
        </div>
        <div class={`${cardType.date} text-syoro/40 flex items-center gap-2`}>
          {formattedDate}
          {#if maturity}<MaturityBadge {maturity} />{/if}
        </div>
      </div>
    </a>
  </div>
{:else}
  <!-- ===== CARD variant (default / playground): image top, text below ===== -->
  <div class="group rounded-lg overflow-hidden hover:scale-95 transition-transform duration-200 ease-snappy py-5" style={vtStyle}>
    <a href={url} class="block p-5 bg-syoro/5 rounded-xl border-1 border-card-border shadow-xs group-hover:shadow-none relative">
      {@render cardImage(`w-full ${imageHeight} aspect-square object-cover rounded-lg mb-5`)}
      <div class="flex gap-2 mb-0 items-center">
        <p class={`${cardType.meta} text-konpeki pt-5`}>{label}</p>
      </div>
      <svelte:element this={titleTag} class={`${cardType.title} text-syoro group-hover:text-link mb-4`}>{title}</svelte:element>
      {#if description}<p class={`${cardType.description} text-syoro/90 mb-4`}>{description}</p>{/if}
      <div class={`${cardType.date} text-syoro/40 mt-4 flex items-center gap-2`}>
        {formattedDate}
        {#if maturity}<MaturityBadge {maturity} />{/if}
      </div>
    </a>
  </div>
{/if}

<style>
  /* series variant — fade the bottom edge of the scroll list so the last row
     hints "more below". */
  .series-post-list {
    -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 1.5rem), transparent);
    mask-image: linear-gradient(to bottom, #000 calc(100% - 1.5rem), transparent);
  }
  .series-row-arrow {
    transition: transform 200ms var(--ease-snappy);
  }
  .series-post-row:hover .series-row-arrow {
    transform: translateX(3px);
  }

  /* Motion skill §4.5 — snap, don't shorten. */
  @media (prefers-reduced-motion: reduce) {
    .series-row-arrow {
      transition: none;
    }
  }
</style>
