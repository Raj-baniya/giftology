export const toggleWishlistItem = (ids: string[], id: string): string[] => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id];
