// Types shared by the Angular app (browser + SSR) and the Express API.

export type Category = 'laptop' | 'desktop' | 'all-in-one' | 'mini-pc';

export interface Product {
  id: number;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  oldPrice?: number;
  stock: number;
  rating: number;
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
  display: string;
  os: string;
  warranty: string;
  description: string;
  highlights: string[];
  /** Accent colour used for the card/gallery background. */
  color: string;
  /** Product photo URL. */
  image: string;
}

/** What the cart cookie stores: just the product id and quantity. */
export interface CartLine {
  productId: number;
  qty: number;
}

export interface Totals {
  subtotal: number;
  vat: number;
  shipping: number;
  total: number;
}

export type PaymentMethod = 'cod' | 'aba-khqr' | 'bank-transfer';

export interface Customer {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  note?: string;
}

export interface OrderItem {
  productId: number;
  slug: string;
  name: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: Customer;
  payment: PaymentMethod;
  items: OrderItem[];
  totals: Totals;
  status: 'pending' | 'paid';
}

export interface CreateOrderRequest {
  customer: Customer;
  payment: PaymentMethod;
  items: CartLine[];
}
