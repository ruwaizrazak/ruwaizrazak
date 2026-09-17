<script lang="ts">
  import { cardType } from '../../styles/typography';

  /**
   * A frozen copy of ContentCard.svelte's series branch for use inside MDX.
   * It is deliberately a COPY, not an import: this post needs to break the
   * layering without adding demo-only behaviour to the real card, and freezing
   * the copy keeps later production-card edits from silently changing the post.
   */
  interface Props {
    variant?: 'default' | 'swallowed';
    parts?: { title: string; description: string }[];
    caption?: string;
  }

  const DEFAULT_PARTS = [
    { title: 'Where It Starts',            description: 'The problem, before any of it was clear.' },
    { title: 'The First Attempt',          description: 'Which worked, and was wrong.' },
    { title: 'A Detour Through the Spec',  description: 'Reading the part everyone skips.' },
    { title: 'What Changed',               description: 'And what it cost.' },
    { title: 'Measuring It Properly',      description: 'Numbers, finally.' },
    { title: 'Where This Goes',            description: 'Loose ends worth pulling.' },
  ];

  let { variant = 'default', parts = DEFAULT_PARTS, caption }: Props = $props();
  let readout = $state('Nothing clicked yet.');

  const readoutId = $derived(`series-demo-readout-${variant}`);
  const resolvedCaption = $derived(
    caption ?? (variant === 'default'
      ? 'The card as it ships. Scroll the list inside it, then click a row — the readout says which link caught the click.'
      : 'The same card with the list dropped below the blanket link. Click any row: the card takes it instead.'),
  );

  function onBlanketClick(event: MouseEvent) {
    event.preventDefault();
    readout = 'the whole card';
  }

  function onRowClick(event: MouseEvent, index: number) {
    event.preventDefault();
    readout = `Part ${index + 1} — the row's own link`;
  }
</script>

<figure class="not-prose my-10 md:my-16">
  <div
    data-seriesdemo
    data-seriesdemo-variant={variant === 'default' ? undefined : variant}
  >
    <div data-seriesdemo-card class="card-shell group">
      <a
        href={`#${readoutId}`}
        data-seriesdemo-blanket
        class="absolute inset-0 z-10"
        aria-label="View the An Invented Series series"
        onclick={onBlanketClick}
      ></a>

      <div class="flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-b-card-border bg-syoro/5 md:aspect-auto md:w-[48%] md:shrink-0 md:border-r md:border-r-card-border md:border-b-0">
        <span
          class="series-demo-band-icon bg-syoro/30"
          style="--card-icon: url('/icons/series.svg')"
          aria-hidden="true"
        ></span>
      </div>

      <div class="flex min-w-0 flex-1 flex-col p-5">
        <span class="card-eyebrow">
          <span
            class="card-collection-icon"
            style="--card-icon: url('/icons/series.svg')"
            aria-hidden="true"
          ></span>
          <span>Series · 6 parts</span>
        </span>
        <h3 class={`${cardType.title} mt-3 text-syoro md:text-[30px] md:leading-[1.15]`}>
          An Invented Series
        </h3>
        <p class={`${cardType.description} mt-2 text-syoro/88`}>
          Not a real series. The parts are filler, so the card has something to scroll.
        </p>

        <h4 class="mt-5 mb-2.5 font-sans text-[14px] font-medium tracking-eyebrow uppercase text-syoro">
          Posts in this series
        </h4>
        <ul
          data-seriesdemo-list
          class={[
            'series-demo-list relative flex max-h-[50vh] min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 md:max-h-none',
            { 'z-20': variant === 'default', 'z-0': variant === 'swallowed' },
          ]}
        >
          {#each parts as part, index (part.title)}
            <li>
              <a
                href={`#${readoutId}`}
                data-seriesdemo-row={index}
                class="series-demo-row group/row flex items-center gap-3.5 rounded-xl bg-syoro/5 p-3.5 transition-[background-color] duration-150 ease-[ease]"
                onclick={(event) => onRowClick(event, index)}
              >
                <span class="shrink-0 font-mono text-[11px] tracking-meta text-muted">
                  Part {index + 1}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block overflow-hidden font-serif text-[17px] font-medium text-ellipsis whitespace-nowrap text-syoro">
                    {part.title}
                  </span>
                  <span class="mt-0.5 block font-serif text-[14px] text-muted">
                    {part.description}
                  </span>
                </span>
                <svg class="series-demo-arrow size-[18px] shrink-0 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
            </li>
          {/each}
        </ul>

        <footer class="relative z-20 mt-[18px] flex items-center justify-between gap-4">
          <p class="card-meta uppercase">Started Jan 2026 · Updated Sep 2026 · 6 posts</p>
          <a
            href={`#${readoutId}`}
            class="shrink-0 rounded-full bg-konpeki px-[22px] py-3 font-sans text-base font-medium tracking-[0.08em] uppercase text-white transition-[transform,opacity] duration-150 ease-snappy motion-reduce:transition-none active:scale-[0.97] motion-reduce:active:scale-100"
            onclick={onBlanketClick}
          >View all</a>
        </footer>
      </div>
    </div>

    <p
      data-seriesdemo-readout
      id={readoutId}
      aria-live="polite"
      class="mt-3 font-mono text-xs text-konpeki"
    >{readout}</p>
  </div>

  <figcaption class="mt-2 font-serif text-xs text-syoro/60 md:text-sm dark:text-syoro/50">
    {resolvedCaption}
  </figcaption>
</figure>

<style>
  [data-seriesdemo-card] {
    position: relative;
    display: flex;
    min-height: 34rem;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
    padding: 0;
  }

  @media (min-width: 768px) {
    [data-seriesdemo-card] {
      min-height: 0;
      height: 470px;
      flex-direction: row;
    }
  }

  .series-demo-list {
    -webkit-mask-image: linear-gradient(to bottom, black calc(100% - 1.5rem), transparent);
    mask-image: linear-gradient(to bottom, black calc(100% - 1.5rem), transparent);
  }

  .series-demo-band-icon {
    width: 34px;
    height: 34px;
    -webkit-mask: var(--card-icon) center / contain no-repeat;
    mask: var(--card-icon) center / contain no-repeat;
  }

  .series-demo-arrow {
    transition: transform 200ms var(--ease-snappy), color 150ms ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .series-demo-row:hover {
      background: color-mix(in srgb, var(--color-syoro) 10%, transparent);
    }

    .series-demo-row:hover .series-demo-arrow {
      transform: translateX(3px);
      color: var(--color-konpeki);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .series-demo-arrow { transition: none; }
    .series-demo-row:hover .series-demo-arrow { transform: none; }
  }
</style>
