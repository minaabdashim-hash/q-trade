export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новый',
  confirmed: 'Подтверждён',
  shipped: 'Отгружен',
  cancelled: 'Отменён',
};

export interface OrderItem {
  productId: string;
  model: string;
  title: string;
  price: number;
  quantity: number;
}

/** Prices and the total are fixed by the API from the database at order time. */
export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  currency: string;
  comment: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderPayload {
  items: { productId: string; model: string; quantity: number }[];
  comment?: string;
}
