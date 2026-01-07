export const sanitizePostalCode = (raw: string): string => raw.trim().replace(/[^0-9]/g, '').slice(0, 6);
export const sanitizePhone = (raw: string): string => raw.trim().replace(/[^0-9+]/g, '');
