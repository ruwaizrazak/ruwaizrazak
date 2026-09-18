<script lang="ts">
  import type { OptimizedPicture } from '../utils/optimizeImage';
  import { getMaturityIcon } from '../utils/maturityIcons';
  import OptimizedPictureView from './ui/OptimizedPicture.svelte';
  import { formatDate } from '../utils/formatDate';
  import { ACCENT_COLLECTIONS } from '../consts';

  interface Props {
    title: string;
    description: string;
    pubDate: Date;
    updatedDate?: Date;
    /**
     * LEARN: resolved by the .astro layout via optimizePicture(). <Picture> emits
     * AVIF + WebP sources for this above-the-fold hero (best compression on a
     * large image); Svelte can't call astro:assets, so the layout resolves it.
     */
    picture?: OptimizedPicture | null;
    tags: string[];
    maturity?: 'seed' | 'plant' | 'tree';
    collection?: string;
    readingTime?: number;
  }

  let {
    title,
    description,
    pubDate,
    updatedDate,
    picture = null,
    tags = [],
    maturity,
    collection = 'notes',
    readingTime,
  }: Props = $props();

  const maturityIcon = $derived(getMaturityIcon(maturity));
  const collectionKey = $derived(collection === 'seriesPosts' ? 'series' : collection);
  const collectionLabels: Record<string, string> = {
    essays: 'Essays',
    notes: 'Notes',
    playground: 'Playground',
    series: 'Series',
    seriesPosts: 'Series',
    live: 'Live',
  };
  const collectionLabel = $derived(collectionLabels[collection] ?? collection);
  const collectionHref = $derived(`/${collectionKey}/`);
  const iconOverrides: Record<string, string> = { live: 'garden' };
  const collectionIcon = $derived(`/icons/${iconOverrides[collectionKey] ?? collectionKey}.svg`);
  // LEARN: only the four garden collections carry an accent; /live keeps the neutral hero.
  const isAccented = $derived((ACCENT_COLLECTIONS as readonly string[]).includes(collectionKey));

  const formattedDate = $derived(formatDate(pubDate, 'short'));
  const formattedUpdatedDate = $derived(updatedDate ? formatDate(updatedDate, 'short') : undefined);

  // Display-only. `href` lowercases independently, so content can spell an
  // acronym "GSAP" in frontmatter and it survives to the label untouched.
  const tagLabel = (tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1);
</script>

<section
  id="note-hero-content"
  data-accent={isAccented ? collectionKey : undefined}
  class={[
    'full-bleed mt-6 mb-10 border-b border-b-card-border pt-10 pb-2.5 md:pt-14',
    isAccented ? 'bg-card-accent/6 dark:bg-card-accent/10' : 'bg-syoro/5',
  ]}
>
  <!-- LEARN: px ladder matches <main>'s px-6/md:px-12/lg:px-20 rather than the
       design's flat 28px — the hero is a full-bleed breakout OUT of main, so
       borrowing main's ladder keeps the h1 aligned with the body copy below. -->
  <div class="mx-auto w-[min(100%,1180px)] px-6 md:px-12 lg:px-20">
    <div class="hero-eyebrow-row mb-[22px] flex flex-wrap items-center gap-3.5">
      <a
        href={collectionHref}
        class="hero-eyebrow inline-flex items-center gap-2 font-sans text-eyebrow font-medium tracking-eyebrow uppercase text-card-accent"
      >
        <span
          class="card-collection-icon"
          style={`--card-icon: url('${collectionIcon}')`}
          aria-hidden="true"
        ></span>
        <span>{collectionLabel}</span>
      </a>
      {#if maturityIcon && maturity}
        <span class="size-1 shrink-0 rounded-full bg-muted/45" aria-hidden="true"></span>
        <span class="hero-maturity-pill inline-flex items-center gap-1.5 rounded-full border border-card-border bg-cardbg px-3 py-[5px] font-mono text-label tracking-[0.14em] uppercase text-muted">
          <img src={maturityIcon} alt="" class="opacity-70" />
          <span>{maturity}</span>
        </span>
      {/if}
    </div>

    <h1
      class="p-name font-sans text-[56px] leading-[0.94] font-medium tracking-[-0.025em] text-balance text-syoro md:text-[88px]"
    >{title}</h1>
    <p
      class="p-summary mt-7 max-w-[62ch] font-serif text-[20px] leading-[1.5] text-pretty text-syoro md:text-[24px]"
    >{description}</p>

    <div class="hero-meta-row my-[34px] flex flex-wrap items-center gap-3.5 font-sans text-[14px] tracking-meta uppercase text-muted md:text-[16px]">
      <div class="flex flex-wrap items-center gap-2.5">
        <time datetime={pubDate.toISOString()} class="dt-published">{formattedDate}</time>
        {#if formattedUpdatedDate}
          <span class="size-1 shrink-0 rounded-full bg-muted/45" aria-hidden="true"></span>
          <span>Updated {formattedUpdatedDate}</span>
        {/if}
        {#if readingTime}
          <span class="size-1 shrink-0 rounded-full bg-muted/45" aria-hidden="true"></span>
          <span>{readingTime} min read</span>
        {/if}
      </div>

      <!-- Always rendered: the rule closes the meta row even on a tagless post. -->
      <span class="hero-meta-line h-px min-w-12 flex-[1_1_120px] bg-syoro/12" aria-hidden="true"></span>

      {#if tags.length > 0}
        <nav class="hero-tags flex flex-wrap items-center gap-2.5" aria-label="Tags">
          {#each tags as tag (tag)}
            <a
              href={`/tags/${tag.toLowerCase()}`}
              class="tracking-[0.06em] normal-case text-muted transition-[color,font-style] duration-150 ease-[ease] hover:text-card-accent hover:italic"
            >{tagLabel(tag)}</a>
          {/each}
        </nav>
      {/if}
    </div>

    <!--
      LEARN: the geometry lives on this <figure>, not on a class handed to
      OptimizedPictureView. A class passed across a component boundary crosses,
      but Svelte's scoping hash does not — so a rule written here for an <img>
      declared in OptimizedPicture's template matches nothing and is stripped as
      an unused selector. The wrapper is in THIS template, so it scopes normally;
      only the descendant needs :global, which keeps the name from leaking.
    -->
    {#if picture}
      <figure class="hero-figure my-11 aspect-[16/7] overflow-hidden rounded-t-xl border border-b-0 border-card-border">
        <OptimizedPictureView {picture} alt="" loading="eager" />
      </figure>
    {/if}
  </div>
</section>

<style>
  /* LEARN: the ONLY rules here that cannot be utilities.

     1. `.hero-figure` is in THIS template so it scopes normally, but the
        <picture>/<img> inside it are declared in ui/OptimizedPicture.svelte — a
        parent's scoping hash never reaches them, so the descendant half is :global().

     2. The pill icon's height. `global.css` carries a bare `img { height: auto }`
        OUTSIDE any @layer, and unlayered author styles beat EVERY layered Tailwind
        utility — so `size-3.5` sets width but loses height, and the icon renders at
        its intrinsic ratio. A descendant selector outranks it. (The real fix is
        moving that rule into @layer base, but that changes img precedence
        site-wide and is not this refactor's job.) */
  .hero-figure :global(picture),
  .hero-figure :global(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-maturity-pill img {
    width: 14px;
    height: 14px;
  }
</style>
