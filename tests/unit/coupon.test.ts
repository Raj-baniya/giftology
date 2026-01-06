import { validateCoupon } from '../../src/utils/couponValidator';
describe('Coupon Validation', () => {
  it('rejects coupon if subtotal is below minimum spend', () => {
    const res = validateCoupon({ code: 'SAVE10', discountPercent: 10, minSpend: 500 }, 350);
    expect(res.valid).toBe(false);
  });
});
