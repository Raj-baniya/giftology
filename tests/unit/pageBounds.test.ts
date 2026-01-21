import { clampPage } from '../../src/utils/pageBounds';
describe('Pagination Bounds', () => {
  it('prevents page < 1', () => expect(clampPage(-5, 10)).toBe(1));
  it('prevents page > max', () => expect(clampPage(15, 10)).toBe(10));
});
