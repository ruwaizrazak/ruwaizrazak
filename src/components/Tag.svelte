<script lang="ts">
  interface Props {
    tag: string;
    isActive?: boolean;
  }

  let { tag, isActive = false }: Props = $props();
</script>

<a
  href={`/tags/${tag}`}
  data-tag={tag}
  class={`px-4 py-2 text-sm border transition-all duration-200 hover:-skew-x-6 text-syoro border-syoro ${isActive ? 'active' : ''}`}
>
  {tag}
</a>
