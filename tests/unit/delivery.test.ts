import { getEstimatedDelivery } from '../../src/utils/deliveryEstimator';
describe('Delivery Estimator', () => {
  it('returns valid string representation of delivery date', () => {
    expect(typeof getEstimatedDelivery(true)).toBe('string');
  });
});
