<script lang="ts">
  import PageHero from '../PageHero.svelte';

  interface Props {
    title: string;
    description: string;
    collection?: string;
  }
  let { title, description, collection }: Props = $props();
</script>

<PageHero {title} {description} accent={collection} />
