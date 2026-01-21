export const clampPage = (page: number, max: number): number => Math.max(1, Math.min(page, Math.max(1, max)));
