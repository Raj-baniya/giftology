import { slugify } from '../../src/utils/slugify';
describe('Slugify Helper', () => {
  it('converts title to clean kebab-case', () => {
    expect(slugify('Birthday & Anniversary Gifts!')).toBe('birthday-anniversary-gifts');
  });
});
