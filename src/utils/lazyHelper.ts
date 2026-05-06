import { lazy } from 'react';
export const lazyWithRetry = (importFn: () => Promise<any>) => lazy(async () => {
  try { return await importFn(); } catch (e) { window.location.reload(); throw e; }
});
