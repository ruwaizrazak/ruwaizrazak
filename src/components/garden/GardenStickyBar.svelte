<script lang="ts">
  import Tag from '../Tag.svelte';

  interface Props {
    title: string;
    sortedTags: string[];
  }

  let { title, sortedTags }: Props = $props();
</script>

<div
  class="garden-sticky-bar sticky top-0 z-40 bg-backgroundcolor/90 backdrop-blur-sm px-10 py-3 opacity-0 pointer-events-none transition-opacity duration-200 border-b border-konpeki/10 mx-auto"
  id="garden-sticky-bar"
>
  <div class="flex items-center justify-center gap-6 flex-wrap">
    <h2 class="garden-heading-small text-konpeki whitespace-nowrap">{title}</h2>
    <div class="topics-bar flex flex-wrap gap-3">
      {#each sortedTags as tag}
        <Tag {tag} isActive={false} />
      {/each}
    </div>
  </div>
</div>
