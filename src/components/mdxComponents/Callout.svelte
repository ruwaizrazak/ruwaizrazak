<script lang="ts">
  // LEARN: Callout provides prominent inline highlights for case study narratives —
  // distinct from SideNote (which floats right and is small). This is full-width and attention-grabbing.
  import type { Snippet } from 'svelte';

  interface Props {
    type?: 'insight' | 'metric' | 'question';
    children?: Snippet;
  }

  let { type = 'insight', children }: Props = $props();

  const borderColors: Record<string, string> = {
    insight: 'border-konpeki',
    metric: 'border-syoro',
    question: 'border-syoro/40',
  };

  const labels: Record<string, string> = {
    insight: 'Insight',
    metric: 'Key Metric',
    question: 'The Question',
  };
</script>

<aside
  class={[
    'callout my-10 md:my-16 py-6 px-6 md:px-8 border-l-4 bg-syoro/5 dark:bg-syoro/10 rounded-r-lg',
    borderColors[type],
  ]}
  role="note"
>
  <span class="block font-sans text-xs uppercase tracking-widest text-syoro/50 dark:text-syoro/40 mb-3">
    {labels[type]}
  </span>
  <div
    class={[
      'text-syoro dark:text-syoro',
      type === 'metric'
        ? 'font-sans text-3xl md:text-5xl font-bold leading-tight'
        : 'font-serif text-xl md:text-2xl leading-relaxed',
    ]}
  >
    {@render children?.()}
  </div>
</aside>
