<script lang="ts">
  import { cardType } from '../styles/typography';
  import { formatDate } from '../utils/formatDate';

  interface Props {
    post: {
      id: string;
      data: {
        title: string;
        description: string;
        excerpt?: string;
        tags: string[];
        seriesOrder?: number;
        pubDate: Date;
      };
    };
    headingLevel?: 2 | 3;
  }

  let { post, headingLevel = 3 }: Props = $props();
  const titleTag = $derived(`h${headingLevel}` as 'h2' | 'h3');
  const transitionName = $derived(`card-seriesPosts-${post.id}`);
</script>

<a
  href={`/series/${post.id}`}
  class="card-shell series-post-card group"
  style={`view-transition-name: ${transitionName}`}
>
  <span class="series-post-meta">
    <span class="card-eyebrow">
      <span
        class="card-collection-icon"
        style="--card-icon: url('/icons/series.svg')"
        aria-hidden="true"
      ></span>
      <span>Part {post.data.seriesOrder ?? '—'}</span>
    </span>
    <span class="series-post-dot" aria-hidden="true"></span>
    <time class="card-meta" datetime={post.data.pubDate.toISOString()}>
      {formatDate(post.data.pubDate)}
    </time>
  </span>

  <svelte:element this={titleTag} class={`${cardType.title} card-title`}>
    {post.data.title}
  </svelte:element>
  <p class={`${cardType.description} card-description`}>{post.data.description}</p>

  {#if post.data.tags.length > 0}
    <span class="series-post-tags">
      {#each post.data.tags as tag (tag)}
        <span class="series-post-tag">{tag}</span>
      {/each}
    </span>
  {/if}
</a>

<style>
  .series-post-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .series-post-dot {
    width: 4px;
    height: 4px;
    flex-shrink: 0;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-syoro) 28%, transparent);
  }

  .series-post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
    padding-top: 2px;
  }

  .series-post-tag {
    border: 1px solid var(--color-card-border);
    border-radius: 999px;
    padding: 4px 10px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
</style>
