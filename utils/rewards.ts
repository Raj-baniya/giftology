export const REWARD_RULES = {
    TIER_1_LIMIT: 100,
    TIER_2_MIN: 500,
    TIER_2_MAX: 1000,
    TIER_3_MIN: 1000,

    POINTS_FLAT_LOW: 50, // < 100
    POINTS_PER_100_MID: 60, // 500-1000
    POINTS_PER_100_HIGH: 80, // > 1000

    // Handling the gap (100-500): defaulting to standard linear or flat?
    // User spec was: <100 (50pts), 500-1000 (60/100), >1000 (80/100).
    // Implicitly, 100-500 is undefined. We will be generous and apply a base rate of 5 pts per 10 (50pts/100) to keep it consistent.
    POINTS_PER_100_BASE: 50,

    REDEMPTION_RATIO: 10, // 10 Points = 1 Rupee
};

export const calculatePointsEarned = (price: number): number => {
    // Logic: 60 points for every 100 spent
    const POINTS_PER_100 = 60;
    return Math.floor((price / 100) * POINTS_PER_100);
};

export const calculatePointsValue = (points: number): number => {
    return Math.floor(points / REWARD_RULES.REDEMPTION_RATIO);
};

export interface Coupon {
    code: string;
    discountPercent: number;
    validUntil: string;
}

export const getCouponValidityDate = (): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    return date.toISOString();
};
