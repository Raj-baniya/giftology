import { Product } from '../types';

export const calculatePointsForPrice = (price: number): number => {
    // Logic: Earn 1 point for every ₹10 spent (10% of value)
    return Math.floor(price / 10);
};

export const calculateCartRewardPoints = (cartItems: any[]): number => {
    return cartItems.reduce((total, item) => {
        const itemPrice = item.price * (item.quantity || 1);
        return total + calculatePointsForPrice(itemPrice);
    }, 0);
};

export const POINTS_PER_RUPEE_DISCOUNT = 1;

export const calculateDiscountFromPoints = (points: number): number => {
    // Logic: 1 Point = ₹1 Discount
    return points * POINTS_PER_RUPEE_DISCOUNT;
};
