<script lang="ts">
  import type { Snippet } from 'svelte';
  import { pageType } from '../styles/typography';
  import { ACCENT_COLLECTIONS } from '../consts';

  interface Props {
    title: string;
    description: string;
    class?: string;
    id?: string;
    /** A collection key; when it is one of ACCENT_COLLECTIONS the band takes its accent. */
    accent?: string;
    titleClass?: string;
    descriptionClass?: string;
    children?: Snippet;
  }

  let {
    title,
    description,
    class: className,
    id = 'note-hero-content',
    accent,
    titleClass,
    descriptionClass,
    children,
  }: Props = $props();

  const isAccented = $derived(accent != null && (ACCENT_COLLECTIONS as readonly string[]).includes(accent));
</script>

<!-- LEARN: Unified hero component — single source of truth for h1/p typography across all index and post pages.
     Pass extras (metadata, tags, images) via the default slot. Override wrapper layout via the class prop. -->
<!-- LEARN: w-screen + ml-[calc(50%-50vw)] breaks out of a padded parent to full viewport width;
     inner px-* keeps text aligned with the main container below -->
<section
  {id}
  data-accent={isAccented ? accent : undefined}
  class={[
    'flex flex-col items-start justify-center pb-5 pt-10 my-5 md:pt-20 lg:pt-30 lg:pb-20 md:pb-10 w-screen max-w-[100vw] ml-[calc(50%-50vw)] px-6 md:px-12 lg:px-20',
    isAccented ? 'bg-card-accent/6 dark:bg-card-accent/10' : 'bg-syoro/5',
    className,
  ]}
>
  <h1 class={[pageType.header, 'text-syoro mb-5 w-full lg:max-w-[12ch] xl:max-w-[20ch] -ml-2', titleClass]}>
    {title}
  </h1>
  <p class={[pageType.description, 'text-syoro mt-6 max-w-4xl lg:max-w-5xl', descriptionClass]}>
    {description}
  </p>
  {@render children?.()}
</section>
