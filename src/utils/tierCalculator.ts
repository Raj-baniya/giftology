import { LoyaltyTier } from '../types/rewards';
export const getTierFromPoints = (points: number): LoyaltyTier => {
  if (points >= 1000) return 'PLATINUM';
  if (points >= 500) return 'GOLD';
  if (points >= 200) return 'SILVER';
  return 'BRONZE';
};
