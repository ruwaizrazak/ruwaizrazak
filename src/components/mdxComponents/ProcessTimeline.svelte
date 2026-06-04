<script lang="ts">
  // LEARN: ProcessTimeline renders a simple flow diagram for showing user journeys,
  // decision trees, or design process steps. CSS-only — no JS or GSAP needed.
  interface Step {
    label: string;
    description?: string;
  }

  interface Props {
    steps: Step[];
    direction?: 'horizontal' | 'vertical';
  }

  let { steps, direction = 'vertical' }: Props = $props();
  const isHorizontal = $derived(direction === 'horizontal');
</script>

<div class={['process-timeline my-10 md:my-16', isHorizontal ? 'overflow-x-auto' : '']}>
  <div class={[isHorizontal ? 'flex flex-row items-start gap-0 min-w-max' : 'flex flex-col gap-0']}>
    {#each steps as step, i}
      <div class={['flex items-start', isHorizontal ? 'flex-row items-center' : 'flex-col']}>
        <!-- Step content -->
        <div
          class={[
            'flex items-start gap-4 p-4 md:p-5 rounded-lg border border-syoro/10 dark:border-syoro/20 bg-syoro/5 dark:bg-syoro/10',
            isHorizontal ? 'min-w-[160px] max-w-[220px]' : 'w-full',
          ]}
        >
          <span class="flex-shrink-0 w-7 h-7 rounded-full bg-syoro dark:bg-syoro text-backgroundcolor dark:text-backgroundcolor font-sans text-sm font-bold flex items-center justify-center">
            {i + 1}
          </span>
          <div class="flex flex-col gap-1">
            <span class="font-sans text-sm md:text-base font-semibold text-syoro dark:text-syoro leading-snug">
              {step.label}
            </span>
            {#if step.description}
              <span class="font-serif text-sm text-syoro/60 dark:text-syoro/50 leading-relaxed">
                {step.description}
              </span>
            {/if}
          </div>
        </div>

        <!-- Arrow connector (skip after last step) -->
        {#if i < steps.length - 1}
          <div class={['flex items-center justify-center text-syoro/30 dark:text-syoro/20', isHorizontal ? 'px-3' : 'py-2 pl-7']}>
            {#if isHorizontal}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            {:else}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
