<script lang="ts">
  interface Props {
    id: string;
    count: number;
    showArrows?: boolean;
    showPlayPause?: boolean;
    showProgress?: boolean;
    class?: string;
  }

  let {
    id,
    count,
    showArrows = true,
    showPlayPause = false,
    showProgress = false,
    class: className,
  }: Props = $props();

  const dots = $derived(Array.from({ length: count }, (_, i) => i));
</script>

<div {id} class={["dot-nav", className]} data-dot-count={count}>
  <div class="dot-nav-dots">
    {#if showArrows}
      <button class="dot-nav-arrow dot-nav-prev" aria-label="Previous">
        <span aria-hidden="true">&larr;</span>
      </button>
    {/if}
    {#each dots as i}
      <button class="dot-nav-dot" data-dot-index={i} aria-label={`Page ${i + 1}`}>
        {#if showProgress}<span class="dot-nav-progress"></span>{/if}
      </button>
    {/each}
    {#if showArrows}
      <button class="dot-nav-arrow dot-nav-next" aria-label="Next">
        <span aria-hidden="true">&rarr;</span>
      </button>
    {/if}
  </div>
  {#if showPlayPause}
    <button class="dot-nav-playpause" aria-label="Pause auto-play"></button>
  {/if}
</div>
