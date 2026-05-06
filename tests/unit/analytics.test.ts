import { trackAddToCart } from '../../src/utils/ecommerceAnalytics';
describe('Ecommerce Analytics', () => {
  it('dispatches add_to_cart event without crash', () => {
    expect(() => trackAddToCart('prod_123', 899)).not.toThrow();
  });
});
