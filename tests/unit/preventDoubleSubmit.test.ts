import { isSubmittingLocked } from '../../src/utils/preventDoubleSubmit';
describe('Double Submit Guard', () => {
  it('locks when called immediately', () => expect(isSubmittingLocked(Date.now())).toBe(true));
});
