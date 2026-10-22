import { PaymentMethod, Totals } from './models';

export const VAT_RATE = 0.1; // 10% VAT
export const FREE_SHIPPING_FROM = 500; // USD
export const SHIPPING_FEE = 5; // USD

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * One pricing rule used by both the cart page (browser/SSR) and the API when it
 * creates an order, so the invoice always matches what the customer saw.
 */
export function calcTotals(subtotal: number): Totals {
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const vat = round2(subtotal * VAT_RATE);
  return {
    subtotal: round2(subtotal),
    vat,
    shipping,
    total: round2(subtotal + vat + shipping),
  };
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: 'Cash on delivery',
  'aba-khqr': 'ABA KHQR',
  'bank-transfer': 'Bank transfer',
};

export const CATEGORY_LABELS: Record<string, string> = {
  laptop: 'Laptops',
  desktop: 'Desktops',
  'all-in-one': 'All-in-One',
  'mini-pc': 'Mini PCs',
};
