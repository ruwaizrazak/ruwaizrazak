<script lang="ts">
  import type { WorkCardProps } from '../utils/workCards';
  import WorkCard from './WorkCard.svelte';
  import { pageType } from '../styles/typography';

  interface Props {
    /** Already flattened + image-resolved by the .astro parent (see workCards.ts). */
    works: WorkCardProps[];
  }
  let { works }: Props = $props();
</script>

<section class="work-cards-container w-full mx-auto mt-40 mb-20" id="Works">
  <h2 class={`${pageType.sectionLabel} text-syoro dark:text-white/60 mb-10`}>Selected works</h2>
  <div class="flex flex-col gap-16 md:gap-24">
    {#each works as work (work.id)}
      <!-- LEARN: Astro's transition:name has no Svelte equivalent; this is what it
           compiles to, so the shared-element morph into /works/<slug> is unchanged. -->
      <div class="work-card-intro" style={`view-transition-name: work-${work.id.replace(/\s+/g, '-')}`}>
        <WorkCard {...work} />
      </div>
    {/each}
  </div>
</section>

<style>
  .work-cards-container {
    opacity: 0;
  }

  /* LEARN: these classes are written to <body>/<html> by the entrance-gate script
     in index.astro, which is outside this component — so they must stay :global.
     Svelte scopes @keyframes automatically and rewrites the animation reference
     below to match, so the keyframes themselves need no special handling. */
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
