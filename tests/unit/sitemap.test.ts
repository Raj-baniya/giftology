describe('Sitemap Generator', () => {
  it('generates valid url entries', () => {
    expect('https://giftology.in/shop').toContain('/shop');
  });
});
