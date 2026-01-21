export type SortOption = 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST' | 'RATING';
export const sortProducts = <T extends { price: number; createdAt?: string }>(items: T[], opt: SortOption): T[] => {
  const cloned = [...items];
  if (opt === 'PRICE_ASC') return cloned.sort((a, b) => a.price - b.price);
  if (opt === 'PRICE_DESC') return cloned.sort((a, b) => b.price - a.price);
  return cloned;
};
