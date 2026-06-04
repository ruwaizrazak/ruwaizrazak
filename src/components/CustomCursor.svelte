<script lang="ts">
  // LEARN: Island with no markup — it only runs the (framework-agnostic) cursor
  // setup in onMount. Mounted client:load so the custom cursor is live immediately.
  // After a View Transition the island re-mounts, re-running init like the old
  // astro:page-load hook did. custom-cursor.ts stays unchanged.
  import { onMount } from 'svelte';

  onMount(() => {
    // LEARN: dynamic import — custom-cursor.ts pulls in flubber (a CommonJS module
    // with named exports) and gsap. A top-level import would run during Astro's SSR
    // of this island and Vite can't resolve flubber's named export server-side, so
    // we load it only in the browser, inside onMount.
    import('../scripts/custom-cursor').then((m) => m.initCustomCursor());
  });
</script>
