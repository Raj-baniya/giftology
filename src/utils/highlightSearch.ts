export const highlightMatches = (text: string, query: string): string => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.trim()})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
};
