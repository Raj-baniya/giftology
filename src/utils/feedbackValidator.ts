export interface FeedbackPayload { rating: number; category: string; comment: string; }
export const isValidFeedback = (f: FeedbackPayload) => f.rating >= 1 && f.rating <= 5 && f.comment.trim().length >= 10;
