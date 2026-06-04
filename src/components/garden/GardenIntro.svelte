<script lang="ts">
  import PageHero from '../PageHero.svelte';

  interface Props {
    title: string;
    description: string;
  }

  let { title, description }: Props = $props();
</script>

<PageHero {title} {description} />
