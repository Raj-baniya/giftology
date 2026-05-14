export interface PaymentVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
export interface PaymentStatusResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
}
