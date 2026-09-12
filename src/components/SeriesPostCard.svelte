<script lang="ts">
  import { cardType } from '../styles/typography';

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
  }

  let { post }: Props = $props();

  // LEARN: mirror ContentCard's view-transition naming (`card-${collection}-${id}`) so a
  // series part animates as its own element across navigations, like every other card.
  const transitionName = $derived(`card-seriesPosts-${post.id}`);
</script>

<!-- LEARN: match ContentCard's card hover pattern — the `group` wrapper owns the
     hover:scale-95 + ease-snappy press feel and lets the title's group-hover:text-link
     (which had no `group` ancestor before, so never fired) actually trigger. -->
<!-- LEARN: Astro's `transition:name` directive doesn't exist in Svelte. Setting the
     view-transition-name CSS property directly is exactly what that directive compiles
     to, so the shared-element morph across navigations behaves identically. -->
<div
  class="group hover:scale-95 transition-transform duration-200 ease-snappy"
  style="view-transition-name: {transitionName}"
>
  <a
    href={`/series/${post.id}`}
    class="block p-5 rounded-xl border border-card-border hover:bg-syoro/5 transition-colors duration-200 cursor-pointer"
  >
    <div class="flex items-center gap-3 mb-3">
      <span class={`${cardType.meta} text-konpeki`}>
        Part {post.data.seriesOrder}
      </span>
      <span class={`${cardType.meta} text-syoro/40`}>·</span>
      <span class={`${cardType.date} text-syoro/40`}>{post.data.pubDate.toLocaleDateString()}</span>
    </div>

    <h2 class={`${cardType.title} text-syoro group-hover:text-link mb-4`}>
      {post.data.title}
    </h2>
    <p class={`${cardType.description} text-syoro/90 mb-4`}>{post.data.description}</p>

    {#if post.data.tags.length > 0}
      <div class="flex flex-wrap items-center gap-2 mb-2">
        {#each post.data.tags as tag (tag)}
          <span class={`${cardType.meta} px-2 py-1 text-syoro/50 border border-card-border`}>
            {tag}
          </span>
        {/each}
      </div>
    {/if}
  </a>
</div>
