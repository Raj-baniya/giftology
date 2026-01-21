export const parseSafeInt = (val: any, fallback = 0): number => {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
};
