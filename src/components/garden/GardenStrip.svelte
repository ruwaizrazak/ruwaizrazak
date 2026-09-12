<script lang="ts">
  import { onMount } from 'svelte';
  import type { CharacterMotion } from '../../scripts/garden/gardenAnimation';

  /**
   * LEARN: the sprite's data-motion / data-facing-right attributes used to be
   * written imperatively by gardenAnimation.ts. They are state here, so Svelte is
   * their single owner and the CSS below (which keys off them) stays scoped —
   * no :global() escape hatch needed.
   */
  let motion = $state<CharacterMotion>('idle');
  let facingRight = $state(true);

  let stripEl = $state<HTMLDivElement>();
  let characterEl = $state<HTMLDivElement>();

  const treeSrcs = [
    '/siteAssets/trees/Tree1.svg', '/siteAssets/trees/Tree2.svg', '/siteAssets/trees/Tree3.svg',
    '/siteAssets/trees/Tree4.svg', '/siteAssets/trees/Tree5.svg', '/siteAssets/trees/Tree6.svg',
    '/siteAssets/trees/Tree7.svg', '/siteAssets/trees/Tree8.svg', '/siteAssets/trees/Tree9.svg',
    '/siteAssets/trees/Tree11.svg', '/siteAssets/trees/Tree12.svg', '/siteAssets/trees/Tree13.svg',
    '/siteAssets/trees/Tree14.svg', '/siteAssets/trees/Tree15.svg', '/siteAssets/trees/Tree16.svg',
    '/siteAssets/trees/Tree17.svg', '/siteAssets/trees/Tree18.svg', '/siteAssets/trees/Tree19.svg',
    '/siteAssets/trees/Tree20.svg', '/siteAssets/trees/Tree21.svg', '/siteAssets/trees/Tree22.svg',
    '/siteAssets/trees/Tree23.svg', '/siteAssets/trees/Tree24.svg',
  ];
  const flowerSrcs = [
    '/siteAssets/trees/flower/flower1.svg',
    '/siteAssets/trees/flower/flower2.svg',
    '/siteAssets/trees/flower/grass2.svg',
  ];

  interface Props {
    /** Tree index per slot, chosen at build time so SSR and client agree. */
    treeIndices: number[];
  }
  let { treeIndices }: Props = $props();

  function treeVisibility(i: number): string {
    if (i < 2) return '';
    if (i < 3) return 'hidden md:block';
    if (i < 6) return 'hidden lg:block';
    return 'hidden xl:block';
  }

  onMount(() => {
    if (!stripEl || !characterEl) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;

    // LEARN: dynamic import is REQUIRED, not an optimisation — gardenAnimation.ts
    // calls gsap.registerPlugin(ScrollTrigger) at module scope, and ScrollTrigger
    // needs `window`. A top-level import is evaluated during SSR and crashes the
    // build with "gsap.registerPlugin is not a function".
    (async () => {
      const { initGarden } = await import('../../scripts/garden/gardenAnimation');
      if (cancelled || !stripEl || !characterEl) return;
      dispose = initGarden({
        strip: stripEl,
        character: characterEl,
        triggerSelector: '.garden-cards-section',
        onMotion: (m) => (motion = m),
        onFacing: (right) => (facingRight = right),
      });
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  });
</script>

<div
  bind:this={stripEl}
  class="garden-strip fixed bottom-0 left-0 w-full bg-black z-50"
  style="height: 30px; border-radius: 0; overflow: visible;"
>
  <!-- Trees: tallest layer, behind everything -->
  {#each treeIndices as treeIndex, i (i)}
    <img
      src={treeSrcs[treeIndex]}
      class={'tree-item absolute z-[0] pointer-events-none ' + treeVisibility(i)}
      data-index={String(i)}
      style="left: 0; top: 0; height: calc(60px * var(--garden-scale, 1)); width: auto; transform: translate(-50%, -100%);"
      alt=""
    />
  {/each}

  <!-- Flowers: shorter, in front of trees -->
  {#each flowerSrcs as src, i (src)}
    <img
      {src}
      class="flower-item absolute z-[0] pointer-events-none"
      data-index={String(i)}
      style="left: 0; top: 0; height: calc(30px * var(--garden-scale, 1)); width: auto; transform: translate(-50%, -100%);"
      alt=""
    />
  {/each}

  <!-- Grass: procedural canvas blades along the curve -->
  <canvas
    class="grass-canvas absolute left-0 w-full z-[2] pointer-events-none"
    style="bottom: -80px; height: calc(125px * var(--garden-scale, 1));"
  ></canvas>

  <!-- Character: walks along the curve via GSAP, animated via sprite sheet -->
  <div
    bind:this={characterEl}
    class="character absolute"
    style="top: 0; left: 20px; z-index: 4; transform: translate(0, 0);"
    data-motion={motion}
    data-facing-right={String(facingRight)}
  >
    <div class="character-sprite"></div>
  </div>
</div>

<style>
  .character-sprite {
    --s: var(--garden-scale, 1);
    --sprite-w: calc(28.2px * var(--s));
    --sprite-h: calc(50px * var(--s));
    --sprite-row-offset: calc(-50px * var(--s));
    --sprite-sheet-w: calc(-254px * var(--s));
    width: var(--sprite-w);
    height: var(--sprite-h);
    background-image: url('/siteAssets/characterSpriteSheet.png');
    background-size: 900% 200%;
    background-position: 0 0;
    background-repeat: no-repeat;
  }

  @keyframes sprite-walk {
    to { background-position-x: var(--sprite-sheet-w); }
  }

  @keyframes sprite-run {
    from { background-position: 0 var(--sprite-row-offset); }
    to { background-position: var(--sprite-sheet-w) var(--sprite-row-offset); }
  }

  .character[data-motion="walk"] .character-sprite {
    animation: sprite-walk 1s steps(9) infinite;
    background-position-y: 0;
  }

  .character[data-motion="run"] .character-sprite {
    animation: sprite-run 0.6s steps(9) infinite;
  }

  .character[data-motion="idle"] .character-sprite {
    background-position-x: calc(var(--idle-frame, 0) * calc(-28.2px * var(--s)));
    background-position-y: 0;
  }

  .character[data-facing-right="false"] .character-sprite {
    transform: scaleX(-1);
  }
</style>
