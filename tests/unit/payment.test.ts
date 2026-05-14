import { isSignaturePresent } from '../../src/utils/paymentVerification';
describe('Payment Verification', () => {
  it('checks signature presence', () => expect(isSignaturePresent('sig_abcdef1234567890abcdef1234567890')).toBe(true));
});
