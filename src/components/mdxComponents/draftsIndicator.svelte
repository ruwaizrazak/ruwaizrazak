<script lang="ts">
  // LEARN: Static (no island). The stamp/fade-in classes are present in the markup,
  // so the CSS animations play on render — the old IntersectionObserver re-added the
  // same classes (a no-op), so it was dropped. Svelte scopes the keyframes here.
  interface Props {
    imageSrc?: string;
    message?: string;
  }

  let {
    imageSrc = "https://i.imgur.com/GRwJGSM.png",
    message = "The following portion of this document is a draft. There is a high probability that this will be modified in the near or far future",
  }: Props = $props();
</script>

<div class="items-center px-2 text-red-800">
  <div>
    <div class="w-1/3 items-center mx-auto">
      <img
        src={imageSrc}
        alt="Draft indicator"
        class="h-[75px] w-[100px] sm:h-[100px] sm:w-[150px] object-contain mb-[-10px] opacity-0 stamp-animation"
      />
    </div>
  </div>
  <p class="text-sm sm:text-base mx-auto w-[90%] text-center opacity-0 text-animation">
    {message}
  </p>
</div>

<style>
  @keyframes stamp {
    0% { transform: scale(5); opacity: 0; }
    50% { transform: scale(0.9); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .stamp-animation {
    animation: stamp 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  }
  .text-animation {
    animation: fadeIn 0.5s ease-in forwards;
    animation-delay: 0.8s;
  }
</style>
