<script lang="ts">
  import type { CollectionEntry } from 'astro:content';
  import WorkCard from './WorkCard.svelte';

  interface Props {
    works: CollectionEntry<'works'>[];
  }

  let { works }: Props = $props();
</script>

<section class="work-cards-container w-full mx-auto mt-40 mb-20" id="Works">
  <h2 class="text-xl font-sans font-semibold text-syoro dark:text-white/60 uppercase tracking-widest mb-10">Selected works</h2>
  <div class="flex flex-col gap-16 md:gap-24">
    {#each works as entry}
      <!-- LEARN: Astro `transition:name` → CSS view-transition-name for the same morph. -->
      <div class="work-card-intro" style={`view-transition-name: work-${entry.id.replace(/\s+/g, '-')}`}>
        <WorkCard {entry} />
      </div>
    {/each}
  </div>
</section>

<style>
  .work-cards-container {
    opacity: 0;
  }

  :global(body.animate-in) .work-cards-container {
    animation: selectedSectionIntro 0.7s ease-in-out 0.3s forwards;
    animation-delay: 0.8s;
  }

  :global(html.returned-from-work) .work-cards-container,
  :global(body.returned-from-work) .work-cards-container {
    animation: none;
    opacity: 1;
    transform: none;
  }

  @keyframes selectedSectionIntro {
    from {
      opacity: 0;
      transform: translateY(70px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
