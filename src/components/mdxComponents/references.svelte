<script lang="ts">
  interface Props {
    references: {
      title: string;
      url: string;
      author?: string;
      year?: string;
    }[];
  }

  let { references }: Props = $props();
</script>

<div class="references-container mt-8 pt-8 border-t border-gray-200">
  <h2 class="text-xl font-bold mb-4">References</h2>
  <ul class="space-y-4">
    {#each references as ref}
      <li class="reference-item">
        <a
          href={ref.url}
          target="_blank"
          rel="noopener noreferrer"
          class="block p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
        >
          <div class="flex flex-col gap-1">
            <span class="font-medium text-lg">{ref.title}</span>
            {#if ref.author}
              <span class="text-stone-600 text-sm">
                By {ref.author}{#if ref.year} ({ref.year}){/if}
              </span>
            {/if}
          </div>
        </a>
      </li>
    {/each}
  </ul>
</div>
