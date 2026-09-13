<script lang="ts">
  import type { OptimizedPicture } from '../utils/optimizeImage';
  import { getMaturityIcon } from '../utils/maturityIcons';
  import OptimizedPictureView from './ui/OptimizedPicture.svelte';
  import { formatDate } from '../utils/formatDate';

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
  };
  const collectionLabel = $derived(collectionLabels[collection] ?? collection);
  const collectionHref = $derived(`/${collectionKey}/`);
  const collectionIcon = $derived(`/icons/${collectionKey}.svg`);

  const formattedDate = $derived(formatDate(pubDate, 'short'));
  const formattedUpdatedDate = $derived(updatedDate ? formatDate(updatedDate, 'short') : undefined);

  // Display-only. `href` lowercases independently, so content can spell an
  // acronym "GSAP" in frontmatter and it survives to the label untouched.
  const tagLabel = (tag: string) => tag.charAt(0).toUpperCase() + tag.slice(1);
</script>

<section id="note-hero-content" class="note-post-hero">
  <div class="note-post-hero-inner">
    <div class="hero-eyebrow-row">
      <a href={collectionHref} class="hero-eyebrow">
        <span
          class="card-collection-icon"
          style={`--card-icon: url('${collectionIcon}')`}
          aria-hidden="true"
        ></span>
        <span>{collectionLabel}</span>
      </a>
      {#if maturityIcon && maturity}
        <span class="hero-dot" aria-hidden="true"></span>
        <span class="hero-maturity-pill">
          <img src={maturityIcon} alt="" />
          <span>{maturity}</span>
        </span>
      {/if}
    </div>

    <h1 class="p-name">{title}</h1>
    <p class="p-summary">{description}</p>

    <div class="hero-meta-row">
      <div class="hero-meta-primary">
        <time datetime={pubDate.toISOString()} class="dt-published">{formattedDate}</time>
        {#if formattedUpdatedDate}
          <span class="hero-dot" aria-hidden="true"></span>
          <span>Updated {formattedUpdatedDate}</span>
        {/if}
        {#if readingTime}
          <span class="hero-dot" aria-hidden="true"></span>
          <span>{readingTime} min read</span>
        {/if}
      </div>

      <!-- Always rendered: the rule closes the meta row even on a tagless post. -->
      <span class="hero-meta-line" aria-hidden="true"></span>

      {#if tags.length > 0}
        <nav class="hero-tags" aria-label="Tags">
          {#each tags as tag (tag)}
            <a href={`/tags/${tag.toLowerCase()}`}>{tagLabel(tag)}</a>
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
      <figure class="hero-figure">
        <OptimizedPictureView {picture} alt="" loading="eager" />
      </figure>
    {/if}
  </div>
</section>

<style>
  .note-post-hero {
    width: 100vw;
    max-width: 100vw;
    margin: 24px 0 40px calc(50% - 50vw);
    border-bottom: 1px solid var(--color-card-border);
    background: color-mix(in srgb, var(--color-syoro) 5%, transparent);
    padding: 40px 0 10px;
  }

  .note-post-hero-inner {
    /* LEARN: this matches <main>'s own px-6 / md:px-12 / lg:px-20 ladder rather
       than the design's flat 28px. The hero is a 100vw breakout OUT of main, so
       borrowing main's ladder keeps the h1's left edge aligned with the body
       copy beneath it. Without any padding-inline the hero ran edge-to-edge on
       phones. */
    width: min(100%, 1180px);
    margin: 0 auto;
    padding-inline: 24px;
  }

  .hero-eyebrow-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin-bottom: 22px;
  }

  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-konpeki);
  }

  h1 {
    color: var(--color-syoro);
    font-family: var(--font-sans);
    font-size: 56px;
    font-weight: 500;
    line-height: 0.94;
    letter-spacing: -0.025em;
    text-wrap: balance;
  }

  .p-summary {
    max-width: 62ch;
    margin-top: 28px;
    color: var(--color-syoro);
    font-family: var(--font-serif);
    font-size: 20px;
    line-height: 1.5;
    text-wrap: pretty;
  }

  .hero-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin: 34px 0;
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: 14px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .hero-meta-primary,
  .hero-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .hero-maturity-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--color-card-border);
    border-radius: 999px;
    background: var(--color-cardbg);
    padding: 5px 12px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }

  .hero-maturity-pill img {
    width: 14px;
    height: 14px;
    opacity: 0.7;
  }

  .hero-dot {
    width: 4px;
    height: 4px;
    flex-shrink: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-muted) 45%, transparent);
  }

  .hero-meta-line {
    min-width: 48px;
    height: 1px;
    flex: 1 1 120px;
    background: color-mix(in srgb, var(--color-syoro) 12%, transparent);
  }

  .hero-tags a {
    letter-spacing: 0.06em;
    color: var(--color-muted);
    text-transform: none;
    transition: color 150ms ease, font-style 150ms ease;
  }

  .hero-figure {
    margin: 44px 0;
    overflow: hidden;
    aspect-ratio: 16 / 7;
    border: 1px solid var(--color-card-border);
    border-bottom: 0;
    border-radius: 12px 12px 0 0;
  }

  .hero-figure :global(picture),
  .hero-figure :global(img) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (min-width: 768px) {
    .note-post-hero {
      padding: 56px 0 10px;
    }

    .note-post-hero-inner {
      padding-inline: 48px;
    }

    h1 {
      font-size: 88px;
    }

    .p-summary {
      font-size: 24px;
    }

    .hero-meta-row {
      font-size: 16px;
    }
  }

  @media (min-width: 1024px) {
    .note-post-hero-inner {
      padding-inline: 80px;
    }
  }

  @media (hover: hover) and (pointer: fine) {
    .hero-tags a:hover {
      color: var(--color-konpeki);
      font-style: italic;
    }
  }
</style>
