import { Order } from './models';

/**
 * Static sample orders data (stored as array in code).
 */
export const ORDERS: Order[] = [
  {
    id: 'INV-20261021-0001',
    createdAt: '2026-10-21T08:55:11.074Z',
    customer: {
      fullName: 'Sokha Chan',
      phone: '088 234 567',
      email: 'sokha.chan@example.com',
      address: 'No. 12, Street 271, Sangkat Boeung Tumpun',
      city: 'Phnom Penh',
      note: 'Please call before delivery',
    },
    payment: 'cod',
    items: [
      {
        productId: 1,
        slug: 'asus-rog-strix-g16',
        name: 'ASUS ROG Strix G16',
        unitPrice: 1899,
        qty: 1,
        lineTotal: 1899,
      },
      {
        productId: 2,
        slug: 'lenovo-legion-5i-gen-9',
        name: 'Lenovo Legion 5i Gen 9',
        unitPrice: 1449,
        qty: 1,
        lineTotal: 1449,
      },
      {
        productId: 3,
        slug: 'dell-xps-13-9350',
        name: 'Dell XPS 13 (9350)',
        unitPrice: 1399,
        qty: 1,
        lineTotal: 1399,
      },
    ],
    totals: {
      subtotal: 4747,
      vat: 474.7,
      shipping: 0,
      total: 5221.7,
    },
    status: 'pending',
  },
  {
    id: 'INV-20261021-0002',
    createdAt: '2026-10-21T09:38:28.354Z',
    customer: {
      fullName: 'Vireak Chhom',
      phone: '096 622 2611',
      email: 'vireak.chhom@example.com',
      address: 'Toul Kork',
      city: 'Phnom Penh',
    },
    payment: 'aba-khqr',
    items: [
      {
        productId: 4,
        slug: 'macbook-air-13-m4',
        name: 'MacBook Air 13" (M4)',
        unitPrice: 1099,
        qty: 1,
        lineTotal: 1099,
      },
    ],
    totals: {
      subtotal: 1099,
      vat: 109.9,
      shipping: 0,
      total: 1208.9,
    },
    status: 'paid',
  },
  {
    id: 'INV-20261022-0001',
    createdAt: '2026-10-22T19:47:57.023Z',
    customer: {
      fullName: 'Bona Rath',
      phone: '088 458 8996',
      email: 'bona.rath@example.com',
      address: 'Street 2004',
      city: 'Phnom Penh',
    },
    payment: 'bank-transfer',
    items: [
      {
        productId: 2,
        slug: 'lenovo-legion-5i-gen-9',
        name: 'Lenovo Legion 5i Gen 9',
        unitPrice: 1449,
        qty: 2,
        lineTotal: 2898,
      },
    ],
    totals: {
      subtotal: 2898,
      vat: 289.8,
      shipping: 0,
      total: 3187.8,
    },
    status: 'pending',
  },
];
