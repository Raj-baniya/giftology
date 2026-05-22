import { isLowStock } from '../../src/utils/inventoryCheck';
describe('Inventory Helper', () => {
  it('flags 3 as low stock', () => expect(isLowStock(3)).toBe(true));
  it('does not flag 10', () => expect(isLowStock(10)).toBe(false));
});
