import { formatINR, calculateTax } from '../../src/utils/currency';
describe('Currency Helpers', () => {
  it('formats positive INR amounts correctly', () => {
    expect(formatINR(1250)).toBe('₹1,250');
  });
  it('computes 18% GST correctly', () => {
    expect(calculateTax(1000, 0.18)).toBe(180);
  });
});
