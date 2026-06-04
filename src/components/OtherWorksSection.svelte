<script lang="ts">
  // LEARN: Island (client:visible). The getCollection() that used to live here moved
  // up to WorkLayout (Astro can fetch; Svelte can't), and `otherWorks` arrives as a
  // prop. The card pop-in (gsap timeline gated by an IntersectionObserver) runs in
  // onMount, with gsap dynamically imported so nothing GSAP touches Astro's SSR.
  import { onMount } from 'svelte';
  import WorkCardCompact from './WorkCardCompact.svelte';

  interface Props {
    otherWorks?: any[];
  }
  let { otherWorks = [] }: Props = $props();

  onMount(() => {
    let observer: IntersectionObserver | undefined;
    (async () => {
      const { default: gsap } = await import('gsap');
      const section = document.querySelector<HTMLElement>('[data-other-works]');
      const cards = section?.querySelectorAll<HTMLElement>('[data-other-works-card]');
      if (!section || !cards?.length || section.dataset.inited === '1') return;
      section.dataset.inited = '1';

      const cardDelay = 0.2;
      const cardDuration = 0.4;
      gsap.set(cards, { opacity: 0, y: 24, scale: 0.92 });

      const tl = gsap.timeline({ paused: true });
      cards.forEach((card, i) => {
        tl.to(card, { opacity: 1, y: 0, scale: 1, duration: cardDuration, ease: 'power2.out' }, `+=${i === 0 ? 0 : cardDelay}`);
      });

      observer = new IntersectionObserver(
        (entries) => {
          const e = entries[0];
          if (!e) return;
          const isAbove = section.getBoundingClientRect().top < 0;
          if (e.isIntersecting) tl.play();
          else if (isAbove) tl.reverse();
        },
        { threshold: 0.1 }
      );
      observer.observe(section);
    })();
    return () => observer?.disconnect();
  });
</script>

<div class="my-20 relative" data-other-works>
  <div
    class="w-screen max-w-[100vw] ml-[calc(50%-50vw)] bg-white dark:bg-[var(--color-cardbg)] shadow-[inset_0_1px_2px_0_rgb(0_0_0/0.05)] py-20"
  >
    <div class="w-full mx-auto py-8 px-8 md:px-20">
      <div class="w-full grid grid-cols-1 lg:grid-cols-4 justify-between gap-4 mb-20 md:py-0 items-center">
        <div class="col-span-1">
          <h2 class="font-sans border-l-2 border-syoro text-syoro pl-4 text-3xl md:text-5xl">Other works</h2>
        </div>
        <div class="col-span-1 lg:col-span-3 lg:col-start-2">
          <p class="text-xl sm:text-2xl md:text-3xl text-syoro">Here are some of the other works I can share with you.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-10">
        {#each otherWorks as entry}
          <div class="other-works-card" data-other-works-card>
            <WorkCardCompact title={entry.data.title} role={entry.data.role} company={entry.data.company} duration={entry.data.duration} heroImage={entry.data.heroImage} url={`/works/${entry.id}`} />
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
