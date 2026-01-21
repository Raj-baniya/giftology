import { sortProducts } from '../../src/utils/productSorting';
describe('Product Sorting', () => {
  it('sorts by price asc properly', () => {
    const arr = [{ price: 400 }, { price: 150 }, { price: 900 }];
    expect(sortProducts(arr, 'PRICE_ASC')[0].price).toBe(150);
  });
});
