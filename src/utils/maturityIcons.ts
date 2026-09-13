import type { Maturity } from '../types';

export const maturityFooterCopy: Record<Maturity, string> = {
  seed: 'Seed — this note will change as the strip does',
  plant: 'Plant — this piece is growing into shape',
  tree: 'Tree — this piece has settled into its canopy',
};

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
