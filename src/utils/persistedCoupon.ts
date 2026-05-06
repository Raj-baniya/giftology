const KEY = 'active_coupon_code';
export const saveActiveCoupon = (c: string) => sessionStorage.setItem(KEY, c);
export const getActiveCoupon = () => sessionStorage.getItem(KEY);
