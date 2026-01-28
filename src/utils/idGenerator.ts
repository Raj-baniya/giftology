export const generateUniqueId = (prefix = 'id'): string => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
