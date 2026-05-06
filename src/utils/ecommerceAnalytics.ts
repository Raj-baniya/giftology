import { trackEvent } from './analytics';
export const trackAddToCart = (id: string, price: number) => trackEvent('add_to_cart', { item_id: id, value: price, currency: 'INR' });
export const trackBeginCheckout = (total: number) => trackEvent('begin_checkout', { value: total, currency: 'INR' });
