<script lang="ts">
  // LEARN: Island (client:visible). The related-posts query moved up to the
  // notesPost layout (Astro fetches; Svelte can't) and arrives as `relatedNotes`.
  // The scrub-reveal carousel (related-notes.ts, GSAP ScrollTrigger) is dynamically
  // imported in onMount so it never runs during SSR.
  import { onMount } from 'svelte';
  import ContentCard from './ContentCard.svelte';
  import DotNav from './DotNav.svelte';

  interface Props {
    relatedNotes?: any[];
  }
  let { relatedNotes = [] }: Props = $props();

  onMount(() => {
    import('../scripts/related-notes').then((m) => m.initRelatedNotes());

    // Flag clicks from RelatedNotes so the destination page uses the slide transition.
    const onClick = (e: MouseEvent) => {
      const card = (e.target as Element).closest('.related-notes-section a');
      if (card) sessionStorage.setItem('nav-from-related', '1');
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  });
</script>

{#if relatedNotes.length > 0}
  <section class="related-notes-section text-center bg-black/5 my-20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.15),inset_0_-2px_8px_rgba(0,0,0,0.15)]">
    <div class="related-reveal overflow-hidden" style="height: 0">
      <div class="mt-20 mb-10">
        <h2 class="text-syoro font-sans text-3xl mb-8 mx-auto">Also related to...</h2>
        <div class="relative overflow-hidden">
          <div class="related-track flex flex-wrap gap-6 pb-4 -mx-4 px-4 justify-center">
            {#each relatedNotes as note}
              <div class="related-card shrink-0 w-[280px] sm:w-[320px]">
                <ContentCard
                  title={note.data.title}
                  description={note.data.description}
                  pubDate={note.data.pubDate}
                  url={note.collection === 'seriesPosts' ? `/series/${note.id}/` : `/${note.collection}/${note.id}/`}
                  maturity={note.data.maturity}
                  collection={note.collection}
                  variant={note.collection === 'essays' ? 'card' : 'compact'}
                  transitionName={`card-${note.collection}-${note.id}`}
                />
              </div>
            {/each}
          </div>
        </div>
        <DotNav
          id="related-nav"
          count={relatedNotes.length}
          showArrows={true}
          class="flex items-center justify-center gap-3 mt-6 mx-auto"
        />
      </div>
    </div>
  </section>
{/if}

<style>
  :global(.related-card) {
    opacity: 0;
  }
</style>
