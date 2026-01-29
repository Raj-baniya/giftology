export const getMetaTags = (title: string, desc: string) => ({
  title: `${title} | Giftology`,
  meta: [{ name: 'description', content: desc }, { property: 'og:title', content: title }]
});
