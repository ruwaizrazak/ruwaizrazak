<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    description: string;
    class?: string;
    id?: string;
    titleClass?: string;
    descriptionClass?: string;
    children?: Snippet;
  }

  let { title, description, class: className, id, titleClass, descriptionClass, children }: Props = $props();
</script>

<!-- LEARN: Unified hero component — single source of truth for h1/p typography across all index and post pages.
     Pass extras (metadata, tags, images) via the default slot. Override wrapper layout via the class prop. -->
<section id={id ?? "note-hero-content"} class={["flex flex-col items-start justify-center py-5 mt-5 md:mt-20 lg:mt-30", className]}>
  <h1 class={["font-sans text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-medium text-syoro md:leading-16 lg:leading-26 -tracking-wider mb-5 w-full md:max-w-[12ch] -ml-2", titleClass]}>
    {title}
  </h1>
  <p class={["font-serif text-2xl md:text-3xl text-syoro mt-6 max-w-4xl", descriptionClass]}>
    {description}
  </p>
  {@render children?.()}
</section>
