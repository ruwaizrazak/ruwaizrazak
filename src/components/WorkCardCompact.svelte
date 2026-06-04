<script lang="ts">
  interface Props {
    title: string;
    role?: string;
    company: string;
    duration: string;
    heroImage?: string;
    url: string;
  }

  let { title, role, company, duration, heroImage, url }: Props = $props();
</script>

<a href={url} class="group block hover:scale-95 transition-all duration-200 ease-in-out">
  <div class="overflow-hidden rounded-lg">
    {#if heroImage}
      <img src={heroImage} alt={title} class="w-full aspect-[4/3] object-cover" />
    {:else}
      <div class="w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700"></div>
    {/if}
  </div>
  <div class="flex flex-col gap-1 mt-4">
    <h3 class="text-lg font-sans text-syoro dark:text-white uppercase leading-snug group-hover:text-konpeki transition-colors">
      {title}
    </h3>
    {#if role}
      <p class="text-lg font-sans text-syoro/60 dark:text-white/40 uppercase">{role}</p>
    {/if}
    <p class="text-base font-sans font-semibold text-syoro/40 dark:text-white/30 uppercase tracking-wide">
      {company} · {duration}
    </p>
  </div>
</a>
