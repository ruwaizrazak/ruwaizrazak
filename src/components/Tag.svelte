<script lang="ts">
  interface Props {
    tag: string;
    isActive?: boolean;
  }
  let { tag, isActive = false }: Props = $props();
</script>

<!-- LEARN: Astro's class:list becomes a plain `class` array in Svelte 5.16+,
     which accepts strings, arrays and objects — same conditional-class ergonomics. -->
<a
  href={`/tags/${tag}`}
  data-tag={tag}
  class={[
    'px-4 py-2 text-sm border transition-transform duration-200 ease-snappy hover:-skew-x-6 active:scale-[0.97] text-syoro border-syoro',
    { active: isActive },
  ]}
>
  {tag}
</a>
