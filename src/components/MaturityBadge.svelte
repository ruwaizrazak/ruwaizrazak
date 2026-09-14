<script lang="ts">
  // Extracted from 4 card components where this 8-line maturity icon + label block was duplicated.
  import type { Maturity } from '../types';
  import { getMaturityIcon } from '../utils/maturityIcons';
  import { cardType } from '../styles/typography';

  interface Props {
    maturity: Maturity;
    iconClass?: string;
    textClass?: string;
  }

  let {
    maturity,
    iconClass = 'w-4 h-4',
    textClass = `${cardType.meta} text-syoro/50`,
  }: Props = $props();

  const maturityIcon = $derived(getMaturityIcon(maturity));
</script>

<span class="maturity-badge inline-flex items-center gap-[5px]">
  <img src={maturityIcon} alt="" class={iconClass} />
  <span class={textClass}>{maturity}</span>
</span>
