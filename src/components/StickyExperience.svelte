<script lang="ts">
  // LEARN: Sticky stacking cards — each card uses CSS `position: sticky` with an
  // incrementing `top` value. As the user scrolls, each card "sticks" at its top
  // position and the next card slides up underneath it, creating a stacking effect.
  // (The "Visit website" link was an Astro <Link> with a metadata tooltip; Svelte
  // can't render that async component, so it's a plain external <a> now.)
  interface ExperienceEntry {
    role: string;
    company: string;
    period: string;
    website: string | URL;
    bullets: string[];
    image: string | URL;
  }

  interface Props {
    entries: ExperienceEntry[];
  }

  let { entries }: Props = $props();

  // Tweak these two to adjust the stacking behavior (see notes in git history):
  // BASE_TOP_VH = viewport % where the first card sticks; OFFSET_PX = gap per card.
  const BASE_TOP_VH = 25;
  const OFFSET_PX = 60;
</script>

<div class="sticky-experience">
  {#each entries as entry, i}
    <div
      class="sticky-card sticky bg-backgroundcolor rounded-2xl shadow-lg border border-syoro/10 dark:border-white/10 my-10 max-w-[90%] md:max-w-[60%]"
      style={`top: calc(${BASE_TOP_VH}vh + ${i * OFFSET_PX}px); z-index: ${10 + i};`}
    >
      <!-- Header bar — this ~80px strip stays visible when the next card stacks on top. -->
      <div class="card-header flex items-center justify-between gap-4 px-6 pt-5 pb-3 md:px-8 md:pt-6 md:pb-4">
        <div class="flex flex-row items-center gap-4">
          <img src={entry.image} alt={entry.company} class="w-16 aspect-square" />
          <div>
            <h3 class="text-xl md:text-2xl font-sans font-bold uppercase tracking-wide text-syoro dark:text-white">
              {entry.company}
            </h3>
            <a href={String(entry.website)} target="_blank" rel="noopener noreferrer" class="text-link hover:underline underline-offset-2">Visit website</a>
          </div>
        </div>
      </div>

      <!-- Card body — only fully visible on the topmost (most recent) stacked card -->
      <div class="card-body px-6 pb-6 md:px-8 md:pb-8">
        <h4 class="text-xl md:text-2xl text-syoro dark:text-white leading-snug mb-4">
          {entry.role} |<span class=" text-syoro/80"> {entry.period}</span>
        </h4>
        <ul class="space-y-4 list-none p-0 m-0">
          {#each entry.bullets as bullet}
            <li class="text-base md:text-lg font-serif text-syoro/80 dark:text-white/60 leading-relaxed flex gap-2">
              <span class="text-syoro/30 dark:text-white/20 mt-0.5 flex-shrink-0">·</span>
              <span>{bullet}</span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  {/each}
</div>
