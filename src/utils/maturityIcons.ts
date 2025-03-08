export const getMaturityIcon = (
  maturity: 'seed' | 'plant' | 'tree' = 'seed'
) => {
  const iconMap = {
    seed: '/noteicons/seed.svg',
    plant: '/noteicons/plant.svg',
    tree: '/noteicons/tree.svg',
  };
  return iconMap[maturity] || iconMap.seed;
};
