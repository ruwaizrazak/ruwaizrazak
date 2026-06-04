<script lang="ts">
  interface Props {
    imageSrc?: string;
    message?: string;
  }

  let {
    imageSrc = "https://i.imgur.com/WSE5dB4.png",
    message = "This document is a work in progress and hence might not be researched or thought through."
  }: Props = $props();
</script>

<div class="flex items-center justify-center w-full h-96 bg-yellow-50/50 rounded-lg">
  <div class="flex flex-col items-center justify-center max-w-2xl px-6">
    <img
      src={imageSrc}
      alt="Low confidence indicator"
      class="h-40 w-52 object-contain p-3"
    />
    <p class="text-center text-stone-600 mt-4 text-lg">
      {message}
    </p>
  </div>
</div>
