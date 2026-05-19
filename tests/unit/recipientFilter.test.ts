import { filterByRecipient } from '../../src/utils/recipientFilter';
describe('Recipient Filter', () => {
  it('filters by recipient tag', () => {
    const items = [{ tags: ['for him', 'birthday'] }, { tags: ['for her'] }];
    expect(filterByRecipient(items, 'for him')).toHaveLength(1);
  });
});
