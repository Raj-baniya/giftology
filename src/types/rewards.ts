export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export interface LoyaltyAccount {
  points: number;
  tier: LoyaltyTier;
  cashbackBalance: number;
}
export const calculatePointsEarned = (orderTotal: number): number => Math.floor(orderTotal / 100) * 5;
