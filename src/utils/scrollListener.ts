export const addPassiveScrollListener = (handler: () => void) => {
  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
};
