<script lang="ts">
  // LEARN: Static markup; the walking-character animation is driven by
  // gardenAnimation.ts (wired in IndexLayout), which queries .character /
  // .character-sprite etc. Svelte keeps those original classes (adds its hash
  // alongside), so the external script still finds them. The sprite CSS is :global
  // and the keyframes use the -global- prefix because their motion states
  // (data-motion) are toggled at runtime, which Svelte's scoping/pruning can't see.
  interface Props {
    posts: any[];
  }
  let { posts }: Props = $props();

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

  function treeVisibility(i: number): string {
    if (i < 2) return '';
    if (i < 3) return 'hidden md:block';
    if (i < 6) return 'hidden lg:block';
    return 'hidden xl:block';
  }

  // Random tree index per slot (fixed at build time, like the original SSR value)
  const treeIndices = [0, 1, 2, 3, 4, 5, 6, 7].map(() => Math.floor(Math.random() * treeSrcs.length));
</script>

<div
  class="garden-strip fixed bottom-0 left-0 w-full bg-black z-50"
  style="height: 30px; border-radius: 0; overflow: visible;"
>
  <!-- Trees: tallest layer, behind everything -->
  {#each [0, 1, 2, 3, 4, 5, 6, 7] as i}
    <img
      src={treeSrcs[treeIndices[i]]}
      class={"tree-item absolute z-[0] pointer-events-none " + treeVisibility(i)}
      data-index={String(i)}
      style="left: 0; top: 0; height: calc(60px * var(--garden-scale, 1)); width: auto; transform: translate(-50%, -100%);"
      alt=""
    />
  {/each}

  <!-- Flowers: shorter, in front of trees -->
  {#each flowerSrcs as src, i}
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
    class="character absolute"
    style="top: 0; left: 20px; z-index: 4; transform: translate(0, 0);"
    data-motion="idle"
    data-facing-right="true"
  >
    <div class="character-sprite"></div>
  </div>
</div>

<style>
  :global(.character-sprite) {
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

  @keyframes -global-sprite-walk {
    to { background-position-x: var(--sprite-sheet-w); }
  }

  @keyframes -global-sprite-run {
    from { background-position: 0 var(--sprite-row-offset); }
    to { background-position: var(--sprite-sheet-w) var(--sprite-row-offset); }
  }

  :global(.character[data-motion="walk"] .character-sprite) {
    animation: sprite-walk 1s steps(9) infinite;
    background-position-y: 0;
  }

  :global(.character[data-motion="run"] .character-sprite) {
    animation: sprite-run 0.6s steps(9) infinite;
  }

  :global(.character[data-motion="idle"] .character-sprite) {
    background-position-x: calc(var(--idle-frame, 0) * calc(-28.2px * var(--s)));
    background-position-y: 0;
  }

  :global(.character[data-facing-right="false"] .character-sprite) {
    transform: scaleX(-1);
  }
</style>
