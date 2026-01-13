export const filterItemsByQuery = <T extends { title: string }>(items: T[], q: string): T[] => {
  const clean = q.trim().toLowerCase();
  if (!clean) return items;
  return items.filter(item => item.title.toLowerCase().includes(clean));
};
