<script lang="ts">
  interface SideItem {
    imageSrc: string;
    caption: string;
  }

  interface Props {
    leftItem: SideItem;
    rightItem: SideItem;
  }

  let { leftItem, rightItem }: Props = $props();
</script>

<div class="flex flex-col md:flex-row items-center align-middle gap-6 my-8 bg-syoro/5 dark:bg-syoro/10 rounded-lg">
  <div class="w-full md:w-1/2 p-4">
    <img src={leftItem.imageSrc} alt="" class="w-full max-w-lg rounded-lg mb-4" />
    <p class="text-syoro dark:text-syoro text-base md:text-lg">{leftItem.caption}</p>
  </div>
  <div class="w-full md:w-1/2 p-4">
    <img src={rightItem.imageSrc} alt="" class="w-full max-w-lg rounded-lg mb-4" />
    <p class="text-syoro dark:text-syoro text-base md:text-lg">{rightItem.caption}</p>
  </div>
</div>
