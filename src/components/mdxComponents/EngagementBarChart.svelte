<script lang="ts">
  // LEARN: Pure SSR component — vertical paired bars per metric (before vs after),
  // each metric using its own scale so disparate units (counts, %, seconds) stay readable.
  // Heights are computed at render and inlined as style="height: X%", so zero JS ships.
  interface Metric {
    label: string;
    before: number;
    after: number;
    unit?: string;
  }

  interface Props {
    metrics: Metric[];
    caption?: string;
    beforeLabel?: string;
    afterLabel?: string;
  }

  let { metrics, caption, beforeLabel = 'Jan', afterLabel = 'Apr' }: Props = $props();

  const formatValue = (n: number, unit?: string) =>
    `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}${unit ?? ''}`;

  const formatDelta = (d: number) =>
    `${d > 0 ? '+' : ''}${d.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
</script>

<figure class="my-10 md:my-16 py-6 border-y border-syoro/10 dark:border-syoro/20">
  {#if caption}
    <figcaption class="font-serif text-xs md:text-sm text-syoro/60 dark:text-syoro/50 mb-8">
      {caption}
    </figcaption>
  {/if}
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 md:gap-10">
    {#each metrics as metric}
      <!-- LEARN: per-metric max — each column is normalized within its own scale so a
           metric peaking at 95 doesn't crush a metric peaking at 5.4. -->
      {@const rowMax = Math.max(metric.before, metric.after, 0.0001)}
      {@const beforePct = (metric.before / rowMax) * 100}
      {@const afterPct = (metric.after / rowMax) * 100}
      {@const delta = metric.before === 0 ? 0 : ((metric.after - metric.before) / metric.before) * 100}
      {@const isPositive = delta >= 0}
      <div class="flex flex-col items-center gap-2">
        <div class="flex items-end justify-center gap-3 md:gap-4 h-40 md:h-48 w-full">
          <div class="w-10 md:w-12 rounded-t bg-syoro/40 dark:bg-syoro/30" style={`height: ${beforePct}%;`}></div>
          <div
            class={['w-10 md:w-12 rounded-t', isPositive ? 'bg-konpeki dark:bg-konpeki' : 'bg-red-600/70']}
            style={`height: ${afterPct}%;`}
          ></div>
        </div>
        <div class="w-full h-px bg-syoro/20 dark:bg-syoro/25"></div>
        <div class="flex justify-center gap-3 md:gap-4 mt-1">
          <span class="w-10 md:w-12 text-center font-sans text-sm md:text-base font-bold text-syoro dark:text-syoro leading-none">
            {formatValue(metric.before, metric.unit)}
          </span>
          <span class="w-10 md:w-12 text-center font-sans text-sm md:text-base font-bold text-syoro dark:text-syoro leading-none">
            {formatValue(metric.after, metric.unit)}
          </span>
        </div>
        <div class="flex justify-center gap-3 md:gap-4">
          <span class="w-10 md:w-12 text-center font-sans text-xs uppercase tracking-wide text-syoro/50 dark:text-syoro/50">
            {beforeLabel}
          </span>
          <span class="w-10 md:w-12 text-center font-sans text-xs uppercase tracking-wide text-syoro/50 dark:text-syoro/50">
            {afterLabel}
          </span>
        </div>
        <div class="text-center mt-2">
          <div class="font-serif text-sm md:text-base text-syoro dark:text-syoro leading-tight">
            {metric.label}
          </div>
          <div class={['font-sans text-xs md:text-sm leading-none mt-1', isPositive ? 'text-konpeki dark:text-konpeki' : 'text-red-600 dark:text-red-400']}>
            {formatDelta(delta)}
          </div>
        </div>
      </div>
    {/each}
  </div>
</figure>
