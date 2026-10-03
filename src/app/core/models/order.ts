import type { Address } from './user';
import type { CartItem, CartTotals } from './cart';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  etaDays: number;
}

export type PaymentMethodId = 'card' | 'paypal' | 'cash-on-delivery';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
}

export interface CheckoutPayload {
  email: string;
  address: Address;
  shippingMethodId: string;
  paymentMethodId: PaymentMethodId;
  notes?: string;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  items: CartItem[];
  totals: CartTotals;
  address: Address;
  shippingMethodId: string;
  paymentMethodId: PaymentMethodId;
  createdAt: string;
}
