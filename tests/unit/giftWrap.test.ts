import { calculateGiftWrapFee } from '../../src/utils/giftWrap';
describe('Gift Wrap Calculation', () => {
  it('charges ₹49 per item', () => expect(calculateGiftWrapFee(3)).toBe(147));
});
