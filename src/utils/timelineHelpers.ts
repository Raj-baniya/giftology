import { OrderStatus } from '../types/orders';
export const getTimelineStep = (status: OrderStatus): number => {
  const steps: Record<OrderStatus, number> = { PENDING: 1, CONFIRMED: 2, PACKED: 3, DISPATCHED: 4, DELIVERED: 5, CANCELLED: 0 };
  return steps[status] || 0;
};
