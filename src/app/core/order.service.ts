import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { renderInvoiceHtml } from '../shared/invoice-html';
import { CreateOrderRequest, Order, OrderItem } from '../shared/models';
import { calcTotals } from '../shared/pricing';
import { PRODUCTS } from '../shared/products.data';

const STORAGE_KEY = 'computer_shop_orders';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Store orders in an in-memory array (initialized from localStorage in browser)
  private orders: Order[] = this.loadInitialOrders();

  private loadInitialOrders(): Order[] {
    if (this.isBrowser) {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          return JSON.parse(data);
        }
      } catch (err) {
        console.warn('Could not load orders from localStorage:', err);
      }
    }
    return [];
  }

  private persistOrders(): void {
    if (this.isBrowser) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
      } catch (err) {
        console.warn('Could not save orders to localStorage:', err);
      }
    }
  }

  create(body: CreateOrderRequest): Observable<Order> {
    const c = body?.customer;

    if (!c?.fullName?.trim() || !c?.phone?.trim() || !c?.email?.trim() || !c?.address?.trim() || !c?.city?.trim()) {
      return throwError(() => new Error('Please fill in all customer details.'));
    }

    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return throwError(() => new Error('Your cart is empty.'));
    }

    const items: OrderItem[] = [];
    for (const line of body.items) {
      const p = PRODUCTS.find((x) => x.id === Number(line.productId));
      const qty = Math.floor(Number(line.qty));
      if (!p || !(qty > 0)) {
        return throwError(() => new Error('Your cart contains an invalid item.'));
      }
      items.push({
        productId: p.id,
        slug: p.slug,
        name: p.name,
        unitPrice: p.price,
        qty,
        lineTotal: p.price * qty,
      });
    }

    const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);

    const now = new Date();
    const day = now.toISOString().slice(0, 10).replaceAll('-', '');
    const prefix = `INV-${day}-`;
    const count = this.orders.filter((o) => o.id.startsWith(prefix)).length;
    const orderId = `${prefix}${String(count + 1).padStart(4, '0')}`;

    const order: Order = {
      id: orderId,
      createdAt: now.toISOString(),
      customer: {
        fullName: c.fullName.trim(),
        phone: c.phone.trim(),
        email: c.email.trim(),
        address: c.address.trim(),
        city: c.city.trim(),
        note: c.note?.trim() || undefined,
      },
      payment: body.payment,
      items,
      totals: calcTotals(subtotal),
      status: 'pending',
    };

    this.orders.push(order);
    this.persistOrders();

    return of(order);
  }

  get(id: string): Observable<Order> {
    const order = this.orders.find((o) => o.id === id);
    if (!order) {
      return throwError(() => new Error('Invoice not found'));
    }
    return of(order);
  }

  invoiceUrl(id: string, download = false): string {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return '#';
    const html = renderInvoiceHtml(order);
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }
}
