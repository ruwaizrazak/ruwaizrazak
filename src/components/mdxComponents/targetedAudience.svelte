<script lang="ts">
  interface Props {
    label?: string;
    description: string;
  }
  let { label = 'Targeted Audience', description }: Props = $props();
</script>

<!--
Usage Example

<TargetedAudience
  description="This document is targeted at UX designers and product managers working on gaming products."
/>
-->
<div class="flex items-center justify-center w-full bg-cardbg border-1 border-stone-100 shadow-sm p-6 rounded-lg">
  <div class="flex flex-col md:flex-row w-ful items-start md:items-center">
    <div class="md:w-1/4">
      <!-- LEARN: a <p>, not an <h4>. "Targeted Audience" labels the box; it is not a
           section of the document, and as an h4 appearing before the first h2 it
           produced an h1->h4 jump in the outline. -->
      <p class="font-sans uppercase not-prose text-konpeki !important text-lg">{label}</p>
    </div>
    <div class="md:w-3/4">
      <p class="text-syoro text-lg">{description}</p>
    </div>
  </div>
</div>
