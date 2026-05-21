export const isSubmittingLocked = (lastSubmitTime: number, thresholdMs = 1500) => (Date.now() - lastSubmitTime) < thresholdMs;
