export const getMaturityIcon = (
  maturity: 'seed' | 'plant' | 'tree' = 'seed'
): string => {
  const iconMap = {
    seed: '/icons/seed.gif',
    plant: '/icons/plant.gif',
    tree: '/icons/tree.gif',
  };

  return iconMap[maturity] || iconMap.seed;
};
