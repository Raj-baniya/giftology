const pages = ['/', '/shop', '/gift-guide', '/cart', '/checkout'];
const xml = pages.map(p => `<url><loc>https://giftology.in${p}</loc></url>`).join('');
console.log(xml);
