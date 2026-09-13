<script lang="ts">
  import type { Snippet } from 'svelte';
  // LEARN: The shell no longer changes per type, but the three types stay because
  // content uses them semantically and the label still names the role.
  interface Props {
    type?: 'insight' | 'metric' | 'question';
    children?: Snippet;
  }
  let { type = 'insight', children }: Props = $props();

  const labels: Record<string, string> = {
    insight: 'Insight',
    metric: 'Key Metric',
    question: 'The Question',
  };
</script>

<aside
  class="callout my-10 md:my-16 flex flex-col gap-4 rounded-[14px] bg-syoro/5 px-[26px] py-6 dark:bg-syoro/10"
  role="note"
>
  <span class="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
    {labels[type]}
  </span>
  <div
    class={[
      'text-syoro dark:text-syoro',
      type === 'metric'
        ? 'font-sans text-3xl md:text-5xl font-bold leading-tight'
        : 'font-serif text-[22px] leading-[1.5]',
    ]}
  >
    {@render children?.()}
  </div>
</aside>
