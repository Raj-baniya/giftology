import { convertOrdersToCSV } from '../../src/utils/csvExport';
describe('CSV Export', () => {
  it('formats headers and rows', () => {
    const csv = convertOrdersToCSV([{ id: '1', total: 500, status: 'OK', date: '2026-05-21' }]);
    expect(csv).toContain('Order ID,Total,Status,Date');
  });
});
