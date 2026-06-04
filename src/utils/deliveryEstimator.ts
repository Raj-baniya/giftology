export const getEstimatedDelivery = (isExpress = false) => {
  const daysToAdd = isExpress ? 2 : 5;
  const d = new Date();
  d.setDate(d.getDate() + daysToAdd);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
};
