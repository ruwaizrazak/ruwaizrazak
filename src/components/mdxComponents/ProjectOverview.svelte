<script lang="ts">
  interface OverviewItem {
    title: string;
    content: string | string[];
    isList?: boolean;
  }

  interface Props {
    items: OverviewItem[];
  }

  let { items }: Props = $props();
</script>

<div class="w-full lg:w-[130%] lg:-mx-[10%] grid grid-cols-1 lg:grid-cols-3 lg:gap-8 mt-8 justify-between">
  {#each items as item}
    <div>
      <h3 class="text-sm lg:text-base uppercase">{item.title}</h3>
      {#if item.isList}
        <ul class="list-outside p-0 -mt-2 lg:text-lg text-base">
          {#each (item.content as string[]) as bullet}
            <li class="p-0">{bullet}</li>
          {/each}
        </ul>
      {:else}
        <p class="-mt-2 p-0 lg:text-lg text-base">{item.content}</p>
      {/if}
    </div>
  {/each}
</div>
