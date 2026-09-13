<script lang="ts">
  import type { OptimizedImg } from '../../utils/optimizeImage';
  import LinkView from '../mdxComponents/LinkView.svelte';
  import OptimizedImage from '../ui/OptimizedImage.svelte';

  export interface ResolvedEntry {
    role: string;
    company: string;
    period: string;
    website: string;
    bullets: string[];
    logo: OptimizedImg | null;
    websiteTooltip: string;
  }

  interface Props {
    entries: ResolvedEntry[];
  }

  let { entries }: Props = $props();
</script>

<div data-experience-ledger>
  {#each entries as entry (entry.company + entry.period)}
    <article
      data-experience-row
      class="grid grid-cols-[44px_minmax(0,1fr)] gap-5 border-t border-card-border py-[26px]"
    >
      <div
        data-experience-logo
        class="flex size-11 items-center justify-center overflow-hidden rounded-[10px] border border-card-border bg-cardbg"
      >
        <OptimizedImage
          image={entry.logo}
          alt={`${entry.company} logo`}
          class="rounded-none object-cover aspect-square"
        />
      </div>

      <div class="min-w-0">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 class="font-serif text-[22px] font-medium text-syoro">{entry.role}</h3>
          <span
            data-experience-company
            class="font-sans text-[17px] font-medium uppercase tracking-[0.12em] text-konpeki"
          >
            {entry.company}
          </span>
          <span class="flex-1" aria-hidden="true"></span>
          <span class="font-sans text-base uppercase tracking-[0.1em] text-muted">{entry.period}</span>
        </div>

        <ul class="mt-4 flex max-w-[68ch] list-none flex-col gap-3 p-0">
          {#each entry.bullets as bullet (bullet)}
            <li class="flex gap-3 font-serif text-[17px] leading-[1.6] text-syoro">
              <span class="shrink-0 text-syoro/35" aria-hidden="true">·</span>
              <span>{bullet}</span>
            </li>
          {/each}
        </ul>

        <div class="mt-5">
          <LinkView
            href={entry.website}
            tooltipHTML={entry.websiteTooltip}
            isExternal
            class="!font-sans !text-[15px] !font-normal uppercase tracking-[0.08em]"
          >
            Visit website
          </LinkView>
        </div>
      </div>
    </article>
  {/each}
</div>
