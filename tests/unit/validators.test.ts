import { isValidEmail, isValidIndianPhone } from '../../src/utils/validators';
describe('Validators', () => {
  it('accepts correct emails', () => expect(isValidEmail('test@example.com')).toBe(true));
  it('rejects malformed emails', () => expect(isValidEmail('test@.com')).toBe(false));
});
