import { toggleWishlistItem } from '../../src/utils/wishlist';
describe('Wishlist Toggle', () => {
  it('adds item if not present', () => expect(toggleWishlistItem(['a'], 'b')).toEqual(['a', 'b']));
  it('removes item if present', () => expect(toggleWishlistItem(['a', 'b'], 'a')).toEqual(['b']));
});
