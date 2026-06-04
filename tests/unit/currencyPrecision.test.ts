import { roundToTwoDecimals } from '../../src/utils/currencyPrecision';
describe('Currency Precision', () => {
  it('rounds 19.999 to 20', () => expect(roundToTwoDecimals(19.999)).toBe(20));
  it('rounds 14.504 to 14.5', () => expect(roundToTwoDecimals(14.504)).toBe(14.5));
});
