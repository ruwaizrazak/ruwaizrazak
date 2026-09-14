<script lang="ts">
  import WorkCardCompact from './WorkCardCompact.svelte';
  import { intersect } from '../lib/actions/intersect';
  import type { WorkCardCompactProps } from '../utils/workCards';

  /**
   * "Other works" card stagger-reveal for work detail pages.
   *
   * LEARN: replaces scripts/otherWorksAnimation.ts and DROPS GSAP from this path
   * entirely. That module built a paused GSAP timeline, gsap.set() the cards to
   * their hidden state, then played/reversed the timeline from an
   * IntersectionObserver — about 45 lines and a 45KB dependency to fade three
   * cards in. A CSS transition with a per-card delay does the same thing, and
   * reverses for free simply by removing the class.
   *
   * It also needed a `section.dataset.inited` guard because initOnLoad fired it
   * twice; there is nothing to guard here.
   */
  interface Props {
    cards: WorkCardCompactProps[];
  }
  let { cards }: Props = $props();

  let shown = $state(false);

  // Play on enter; reverse when the section has scrolled back above the viewport.
  function onChange(entry: IntersectionObserverEntry) {
    if (entry.isIntersecting) shown = true;
    else if (entry.boundingClientRect.top < 0) shown = false;
  }
</script>

<div class="relative" data-other-works>
  <div
    class="w-screen max-w-[100vw] ml-[calc(50%-50vw)] bg-white dark:bg-[var(--color-cardbg)] shadow-[inset_0_1px_2px_0_rgb(0_0_0/0.05)] pt-20"
  >
    <div class="w-full mx-auto py-8 px-8 md:px-20">
      <div class="w-full grid grid-cols-1 lg:grid-cols-4 justify-between gap-4 mb-10 md:py-0 items-center">
        <div class="col-span-1">
          <h2 class="font-sans border-l-2 border-syoro text-syoro pl-4 text-3xl md:text-5xl">Other works</h2>
        </div>
        <div class="col-span-1 lg:col-span-3 lg:col-start-2">
          <p class="text-xl sm:text-2xl md:text-3xl text-syoro">
            Here are some of the other works I can share with you.
          </p>
        </div>
      </div>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 gap-10"
        use:intersect={{ threshold: 0.1, onChange }}
      >
        {#each cards as card, i (card.url)}
          <div
            class={[
              'other-works-card transition-[opacity,transform] duration-400 [transition-timing-function:cubic-bezier(0.33,1,0.68,1),cubic-bezier(0.33,1,0.68,1)] motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none',
              {
                'transform-[translateY(24px)_scale(0.92)] opacity-0': !shown,
                'is-shown transform-[translateY(0)_scale(1)] opacity-100': shown,
              },
            ]}
            data-other-works-card
            style={`transition-delay: ${i * 200}ms`}
          >
            <WorkCardCompact {...card} />
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
