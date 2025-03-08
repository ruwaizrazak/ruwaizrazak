export const getMaturityIcon = (
  maturity: 'seed' | 'plant' | 'tree' = 'seed'
): string => {
  const iconMap = {
    seed: '/icons/seed.svg',
    plant: '/icons/plant.svg',
    tree: '/icons/tree.svg',
  };

  return iconMap[maturity] || iconMap.seed;
};
