import { filterItemsByQuery } from '../../src/utils/searchFilter';
describe('Search Filter', () => {
  it('filters items correctly by title', () => {
    const sample = [{ title: 'Chocolate Box' }, { title: 'Teddy Bear' }];
    expect(filterItemsByQuery(sample, 'choco')).toHaveLength(1);
  });
});
