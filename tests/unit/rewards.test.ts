import { calculatePointsEarned } from '../../src/types/rewards';
describe('Loyalty Rewards', () => {
  it('awards 5 points per 100 spent', () => expect(calculatePointsEarned(550)).toBe(25));
});
