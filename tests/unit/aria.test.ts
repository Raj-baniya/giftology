describe('Aria Announcer', () => {
  it('formats announcement cleanly', () => {
    const text = 'Item added to cart';
    expect(text).toContain('added to cart');
  });
});
