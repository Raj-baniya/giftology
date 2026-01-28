export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidIndianPhone = (phone: string): boolean => /^(?:\+91|91)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''));
