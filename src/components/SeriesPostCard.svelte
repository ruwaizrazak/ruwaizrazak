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
  const transitionName = $derived(`card-seriesPosts-${post.id}`);
</script>

<a
  href={`/series/${post.id}`}
  class="card-shell series-post-card group"
  style={`view-transition-name: ${transitionName}`}
>
  <span class="flex items-center gap-2.5">
    <span class="card-eyebrow">
      <span
        class="card-collection-icon"
        style="--card-icon: url('/icons/series.svg')"
        aria-hidden="true"
      ></span>
      <span>Part {post.data.seriesOrder ?? '—'}</span>
    </span>
    <span class="size-1 shrink-0 rounded-full bg-syoro/28" aria-hidden="true"></span>
    <time class="card-meta" datetime={post.data.pubDate.toISOString()}>
      {formatDate(post.data.pubDate)}
    </time>
  </span>

  <!-- LEARN: static tags, not <svelte:element>. Hydrating a dynamic element
       detaches and re-inserts it, and a click whose press straddles that is lost. -->
  {#if headingLevel === 2}
    <h2 class={`${cardType.title} card-title`}>{post.data.title}</h2>
  {:else}
    <h3 class={`${cardType.title} card-title`}>{post.data.title}</h3>
  {/if}
  <p class={`${cardType.description} card-description`}>{post.data.description}</p>

  {#if post.data.tags.length > 0}
    <span class="mt-auto flex flex-wrap gap-2 pt-0.5">
      {#each post.data.tags as tag (tag)}
        <span class="rounded-full border border-card-border px-2.5 py-1 font-mono text-label tracking-meta uppercase text-muted">{tag}</span>
      {/each}
    </span>
  {/if}
</a>
