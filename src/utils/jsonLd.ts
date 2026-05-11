export const getProductJsonLd = (p: { title: string; price: number; image?: string; desc?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: p.title,
  image: p.image,
  description: p.desc,
  offers: { '@type': 'Offer', price: p.price, priceCurrency: 'INR', availability: 'https://schema.org/InStock' }
});
