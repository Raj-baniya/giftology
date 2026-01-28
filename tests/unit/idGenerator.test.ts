import { generateUniqueId } from '../../src/utils/idGenerator';
describe('ID Generator', () => {
  it('produces distinct ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateUniqueId()));
    expect(ids.size).toBe(100);
  });
});
