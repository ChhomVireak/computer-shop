import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CreateOrderRequest, Order, OrderItem } from '../shared/models';
import { ORDERS } from '../shared/orders.data';
import { calcTotals } from '../shared/pricing';
import { PRODUCTS } from '../shared/products.data';

@Injectable({ providedIn: 'root' })
export class OrderService {
  // Static array of orders
  private orders: Order[] = [...ORDERS];

  create(body: CreateOrderRequest): Observable<Order> {
    const c = body.customer;

    const items: OrderItem[] = body.items.map((line) => {
      const p = PRODUCTS.find((x) => x.id === Number(line.productId)) || PRODUCTS[0];
      const qty = Math.max(1, Number(line.qty) || 1);
      return {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        unitPrice: p.price,
        qty,
        lineTotal: p.price * qty,
      };
    });

    const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
    const orderId = `INV-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(this.orders.length + 1).padStart(4, '0')}`;

    const order: Order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customer: {
        fullName: c.fullName?.trim() || 'Valued Customer',
        phone: c.phone?.trim() || 'N/A',
        email: c.email?.trim() || 'customer@example.com',
        address: c.address?.trim() || 'Phnom Penh',
        city: c.city?.trim() || 'Phnom Penh',
        note: c.note?.trim() || undefined,
      },
      payment: body.payment || 'cod',
      items,
      totals: calcTotals(subtotal),
      status: 'pending',
    };

    this.orders.unshift(order);
    return of(order);
  }

  get(id: string): Observable<Order> {
    // Return matching order or fallback to the latest static order
    const order = this.orders.find((o) => o.id === id) || this.orders[0];
    return of(order);
  }
}
