import { padZero } from '../../src/utils/padZero';
describe('padZero', () => {
  it('pads single digits with zero', () => expect(padZero(7)).toBe('07'));
  it('leaves two digits unchanged', () => expect(padZero(15)).toBe('15'));
});
