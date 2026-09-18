<script lang="ts">
  import type { GardenCollection, ReferenceInput } from '../../types';
  import { groupReferences } from '../../utils/references';

  interface Props {
    references: ReferenceInput[];
  }
  let { references }: Props = $props();

  const groups = $derived(groupReferences(references));

  // LEARN: Tailwind 4.0 has no mask-* utilities, so each icon is an arbitrary
  // property. They live in this literal table because Tailwind only emits classes
  // it can read verbatim; a template string would compile to nothing.
  const MASK = {
    book: '[mask:url(/icons/book.svg)_center/contain_no-repeat]',
    garden: '[mask:url(/icons/garden.svg)_center/contain_no-repeat]',
    notes: '[mask:url(/icons/notes.svg)_center/contain_no-repeat]',
    essays: '[mask:url(/icons/essays.svg)_center/contain_no-repeat]',
    series: '[mask:url(/icons/series.svg)_center/contain_no-repeat]',
    playground: '[mask:url(/icons/playground.svg)_center/contain_no-repeat]',
  } as const;

  const gardenMask = (collection: GardenCollection | null) => MASK[collection ?? 'garden'];

  const rowClass =
    'group grid items-center gap-3 rounded-[10px] px-2.5 py-[11px] transition-[background-color] duration-150 ease-[ease] hover:bg-link/5 motion-reduce:transition-none';
  const rowTitleClass =
    'truncate font-serif text-base font-medium text-syoro transition-[color] duration-150 ease-[ease] group-hover:text-konpeki';
  const labelClass = 'font-mono text-label tracking-[0.12em] uppercase text-muted/70';
</script>

<!-- Usage (MDX; the component is registered in map.ts, so no import):

<References
  references={[
    { title: "The Design of Everyday Things", author: "Don Norman", year: "1988", publisher: "Basic Books", isbn: "9780465050659" },
    { title: "Notes on prompting", url: "/notes/prompting/" },
    { title: "A Brief History of the Digital Garden", url: "https://maggieappleton.com/garden-history", author: "Maggie Appleton", year: "2021" },
  ]}
/>

No URL → Books · a link to this site → From the garden · anything else → On the web.
Pass `kind` to override, `isbn` for an Open Library cover. -->

{#snippet groupLabel(label: string, mask: string | null)}
  <div class="flex items-center gap-[9px]">
    {#if mask}
      <span class={['size-3.5 shrink-0 bg-konpeki', mask]} aria-hidden="true"></span>
    {:else}
      <svg class="size-3.5 shrink-0 text-konpeki" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
        <path d="M3 12h18M12 3c2.6 2.4 2.6 15.6 0 18M12 3c-2.6 2.4-2.6 15.6 0 18" stroke="currentColor" stroke-width="1.8" />
      </svg>
    {/if}
    <span class="font-sans text-[14px] font-medium tracking-eyebrow uppercase text-konpeki">{label}</span>
    <span class="h-px flex-1 bg-syoro/12" aria-hidden="true"></span>
  </div>
{/snippet}

{#snippet refMark(external: boolean)}
  <svg
    class="size-3.75 text-muted/70 opacity-45 [transition:opacity_150ms_ease,translate_200ms_var(--ease-snappy)] group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d={external ? 'M8 16 16 8M10 8h6v6' : 'M5 12h14M13 6l6 6-6 6'}
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{/snippet}

<!-- LEARN: `not-prose` opts out of @tailwindcss/typography, whose compound
     selectors would otherwise out-specify these utilities on h2, p, a and img. -->
<section class="references not-prose mt-10 rounded-[26px] border border-card-border bg-cardbg p-5 md:p-7" data-references>
  <!-- One h2 per page, so it keeps its place in the TOC pill (AGENTS.md exception). -->
  <h2 id="references" class="mb-1 font-sans text-[26px] font-medium tracking-[0.02em] text-syoro">References</h2>
  <p class="mb-[22px] font-serif text-[14px] text-muted">What this piece was built on, and where to go next.</p>

  <div class="flex flex-col gap-6">
    {#if groups.books.length > 0}
      <div class="flex flex-col gap-2.5" data-reference-group="books">
        {@render groupLabel('Books', MASK.book)}
        <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {#each groups.books as book, i (i)}
            <svelte:element
              this={book.href ? 'a' : 'div'}
              href={book.href ?? undefined}
              target={book.href ? '_blank' : undefined}
              rel={book.href ? 'noopener noreferrer' : undefined}
              class="group grid grid-cols-[--spacing(13)_minmax(0,1fr)] items-start gap-3.5 rounded-[14px] border border-card-border bg-cardbg px-4 py-3.5 transition-[border-color,translate] duration-200 ease-snappy hover:-translate-y-0.5 hover:border-link/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              data-reference-item
            >
              <!-- A div, not an <img>: global.css has an unlayered `img` rule that beats size
                   utilities. Remote Open Library covers skip Astro <Image /> by an
                   explicit exception (AGENTS.md → Gotchas). -->
              {#if book.cover}
                <div
                  class="h-19 w-13 rounded bg-syoro/5 bg-cover bg-center shadow-sm shadow-syoro/20"
                  style={`background-image: url('${book.cover}')`}
                  role="img"
                  aria-label={`${book.title} cover`}
                ></div>
              {:else}
                <div class="flex h-19 w-13 items-center justify-center rounded bg-syoro/5" aria-hidden="true">
                  <span class={['size-5 bg-syoro/30', MASK.book]}></span>
                </div>
              {/if}
              <span class="flex min-w-0 flex-col gap-1">
                <span class="font-serif text-base leading-[1.3] font-medium text-syoro transition-[color] duration-150 ease-[ease] group-hover:text-konpeki">{book.title}</span>
                {#if book.author}<span class="font-serif text-micro text-muted">{book.author}</span>{/if}
                {#if book.meta}<span class="font-mono text-label tracking-meta uppercase text-muted/70">{book.meta}</span>{/if}
              </span>
            </svelte:element>
          {/each}
        </div>
      </div>
    {/if}

    {#if groups.garden.length > 0}
      <div class="flex flex-col gap-2.5" data-reference-group="garden">
        {@render groupLabel('From the garden', MASK.garden)}
        <div class="flex flex-col">
          {#each groups.garden as entry, i (i)}
            <a href={entry.href} class={[rowClass, 'grid-cols-[--spacing(4.5)_minmax(0,1fr)_auto_--spacing(3.75)]']} data-reference-item>
              <span class={['size-4 bg-syoro/40', gardenMask(entry.collection)]} aria-hidden="true"></span>
              <span class={rowTitleClass}>{entry.title}</span>
              <span class={labelClass}>{entry.label}</span>
              {@render refMark(false)}
            </a>
          {/each}
        </div>
      </div>
    {/if}

    {#if groups.web.length > 0}
      <div class="flex flex-col gap-2.5" data-reference-group="web">
        {@render groupLabel('On the web', null)}
        <div class="flex flex-col">
          {#each groups.web as entry, i (i)}
            <a
              href={entry.href}
              target="_blank"
              rel="noopener noreferrer"
              class={[rowClass, 'grid-cols-[minmax(0,1fr)_--spacing(3.75)] sm:grid-cols-[minmax(0,1fr)_auto_--spacing(3.75)]']}
              data-reference-item
            >
              <span class="flex min-w-0 flex-col gap-0.5">
                <span class={rowTitleClass}>{entry.title}</span>
                {#if entry.byline}<span class="font-serif text-micro text-muted">{entry.byline}</span>{/if}
              </span>
              <span class="hidden font-mono text-label tracking-meta text-muted/70 sm:inline">{entry.host}</span>
              {@render refMark(true)}
            </a>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>
