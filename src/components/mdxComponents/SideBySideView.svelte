<script lang="ts">
  import type { OptimizedImg } from '../../utils/optimizeImage';
  import OptimizedImage from '../ui/OptimizedImage.svelte';

  interface SideItem {
    caption: string;
    image: OptimizedImg | null;
  }
  interface Props {
    leftItem: SideItem;
    rightItem: SideItem;
  }

  let { leftItem, rightItem }: Props = $props();
</script>

<!--
Usage Example

<SideBySide
  leftItem={{ imageSrc: "https://i.imgur.com/u3yR8I0.png", caption: "..." }}
  rightItem={{ imageSrc: "https://i.imgur.com/u3yR8I0.png", caption: "..." }}
/>
-->
<div class="flex flex-col md:flex-row items-center align-middle gap-6 my-8 bg-syoro/5 dark:bg-syoro/10 rounded-lg">
  {#each [leftItem, rightItem] as item (item.caption)}
    <div class="w-full md:w-1/2 p-4">
      <!-- LEARN: alt comes from the caption. It was hardcoded to "" here, so every
           side-by-side image was announced as decorative and skipped — 8 of the
           essay's unlabelled images were this one line, not missing content. The
           caption the author already wrote IS the description. -->
      <OptimizedImage image={item.image} alt={item.caption} class="w-full max-w-lg rounded-lg mb-4" />
      <p class="text-syoro dark:text-syoro text-base md:text-lg">{item.caption}</p>
    </div>
  {/each}
</div>
