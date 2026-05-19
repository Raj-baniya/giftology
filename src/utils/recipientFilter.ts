export const filterByRecipient = <T extends { tags?: string[] }>(items: T[], recipient: string): T[] => {
  if (!recipient || recipient === 'ALL') return items;
  return items.filter(i => i.tags?.includes(recipient.toLowerCase()));
};
