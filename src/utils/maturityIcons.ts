import type { Maturity } from '../types';

export const getMaturityIcon = (
  maturity: Maturity = 'seed'
): string => {
  const iconMap = {
    seed: '/icons/seed.svg',
    plant: '/icons/plant.svg',
    tree: '/icons/tree.svg',
  };

  return iconMap[maturity] || iconMap.seed;
};
