export const getWhatsAppOrderLink = (orderId: string, phone = '919876543210') => {
  const msg = encodeURIComponent(`Hi, I would like to inquire about my order #${orderId}`);
  return `https://wa.me/${phone}?text=${msg}`;
};
