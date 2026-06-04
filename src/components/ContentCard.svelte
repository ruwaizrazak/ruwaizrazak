<script lang="ts">
  // Unified card component — consolidates the deleted EssayCard, NoteCard, and PlaygroundCard
  // into a single component with a `variant` prop ('card' | 'compact').
  import type { ContentCardProps } from '../types';
  import { formatDate } from '../utils/formatDate';
  import MaturityBadge from './MaturityBadge.svelte';

  let {
    title = 'Untitled',
    description = '',
    pubDate,
    heroImage,
    url,
    imageHeight = 'h-48',
    maturity,
    collection,
    variant = 'card',
    transitionName,
  }: ContentCardProps = $props();

  // LEARN: $derived (not plain const) so values track prop changes — plain const
  // captures only the initial prop value (Svelte's state_referenced_locally warning).
  const formattedDate = $derived(formatDate(pubDate));

  const collectionLabels: Record<string, string> = {
    essays: 'Essays',
    notes: 'Notes',
    playground: 'Playground',
    books: 'Books',
    casestudies: 'Case Studies',
  };
  const label = $derived(collection ? collectionLabels[collection] || collection : '');

  const isCompact = $derived(variant === 'compact');
  const isWide = $derived(variant === 'wide');

  // LEARN: Astro's `transition:name` directive doesn't exist in Svelte, so we set the
  // underlying CSS view-transition-name directly — same shared-element morph at runtime.
  const vtStyle = $derived(transitionName ? `view-transition-name: ${transitionName}` : undefined);
</script>

{#if isCompact}
  <div class="group hover:scale-95 transition-all duration-200" style={vtStyle}>
    <a href={url} class="block p-5 border-b-1 bg-backgroundcolor border-syoro border-opacity-10 border-dashed relative">
      <div class="flex gap-2 py-2 items-center">
        <h5 class="text-sm text-konpeki uppercase font-sans tracking-widest">{label}</h5>
      </div>
      <h3 class="font-serif text-lg md:text-xl lg:text-2xl leading-tight text-syoro group-hover:text-link mb-4 font-medium">{title}</h3>
      {#if description}<p class="font-serif text-syoro/90 mb-4">{description}</p>{/if}
      <div class="text-base font-sans text-syoro/40 mt-2 flex items-center gap-2">
        {formattedDate}
        {#if maturity}<MaturityBadge {maturity} iconClass="w-4 h-auto" />{/if}
      </div>
    </a>
  </div>
{:else if isWide}
  <div class="group hover:scale-95 transition-all duration-200 py-5" style={vtStyle}>
    <a href={url} class="bg-syoro/5 rounded-lg border-1 border-card-border shadow-xs group-hover:shadow-none relative flex flex-col md:flex-row overflow-hidden">
      {#if heroImage}
        <div class="w-full md:w-1/2 lg:w-2/3 shrink-0 grow-0 overflow-hidden">
          <img src={heroImage} alt={title} class="garden-card-image w-full h-full object-cover" />
        </div>
      {/if}
      <div class="flex-1 min-w-0 p-5 flex flex-col justify-between">
        <div class="mx-auto">
          <h3 class="font-serif text-xl md:text-xl lg:text-2xl leading-tight text-syoro group-hover:text-link mb-4 font-medium">{title}</h3>
          {#if description}<p class="font-serif text-syoro/90 mb-4">{description}</p>{/if}
        </div>
        <div class="text-base font-sans text-syoro/40 flex items-center gap-2">
          {formattedDate}
          {#if maturity}<MaturityBadge {maturity} />{/if}
        </div>
      </div>
    </a>
  </div>
{:else}
  <div class="group rounded-lg overflow-hidden hover:scale-95 transition-all duration-200 py-5" style={vtStyle}>
    <a href={url} class="essay-card-link block p-5 bg-syoro/5 rounded-xl border-1 border-card-border shadow-xs group-hover:shadow-none relative">
      {#if heroImage}
        <img src={heroImage} alt={title} class={`garden-card-image w-full ${imageHeight} aspect-square object-cover rounded-lg mb-4`} />
      {/if}
      <div class="flex gap-2 mb-0 items-center">
        <h5 class="text-sm text-konpeki uppercase font-sans tracking-widest">{label}</h5>
      </div>
      <h3 class="font-serif text-xl md:text-2xl lg:text-3xl leading-tight text-syoro group-hover:text-link mb-4 font-medium">{title}</h3>
      {#if description}<p class="font-serif text-syoro/90 mb-4">{description}</p>{/if}
      <div class="text-base font-sans text-syoro/40 mt-4 flex items-center gap-2">
        {formattedDate}
        {#if maturity}<MaturityBadge {maturity} />{/if}
      </div>
    </a>
  </div>
{/if}
