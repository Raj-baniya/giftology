export const convertOrdersToCSV = (orders: any[]): string => {
  const headers = ['Order ID', 'Total', 'Status', 'Date'];
  const rows = orders.map(o => [o.id, o.total, o.status, o.date].join(','));
  return [headers.join(','), ...rows].join('\n');
};
