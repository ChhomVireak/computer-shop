import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, REQUEST, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { renderInvoiceHtml } from '../shared/invoice-html';
import { CreateOrderRequest, Order, OrderItem } from '../shared/models';
import { calcTotals } from '../shared/pricing';
import { PRODUCTS } from '../shared/products.data';

const STORAGE_KEY = 'computer_shop_orders';
const COOKIE_KEY = 'cs_orders';

// Global in-memory store shared across requests in the current process
const memoryOrders = new Map<string, Order>();

@Injectable({ providedIn: 'root' })
export class OrderService {
  private document = inject(DOCUMENT);
  private request = inject(REQUEST, { optional: true });
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    this.syncFromStorage();
  }

  private syncFromStorage(): void {
    if (this.isBrowser) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const list: Order[] = JSON.parse(raw);
          list.forEach((o) => memoryOrders.set(o.id, o));
        }
      } catch (e) {
        console.warn('Could not read orders from localStorage', e);
      }
    } else {
      // During SSR, read orders from the cookie sent by browser
      try {
        const cookieHeader = this.request?.headers.get('cookie') ?? '';
        const cookieMatch = cookieHeader
          .split(';')
          .map((c) => c.trim())
          .find((c) => c.startsWith(COOKIE_KEY + '='));
        if (cookieMatch) {
          const raw = decodeURIComponent(cookieMatch.slice(COOKIE_KEY.length + 1));
          const list: Order[] = JSON.parse(raw);
          list.forEach((o) => memoryOrders.set(o.id, o));
        }
      } catch (e) {
        console.warn('Could not read orders from SSR cookie', e);
      }
    }
  }

  private persistOrder(order: Order): void {
    memoryOrders.set(order.id, order);

    if (this.isBrowser) {
      try {
        const all = Array.from(memoryOrders.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

        // Save last recent orders to cookie so SSR can read them on direct URL visit or refresh
        const serialized = encodeURIComponent(JSON.stringify(all.slice(-5)));
        this.document.cookie = `${COOKIE_KEY}=${serialized}; path=/; max-age=86400; SameSite=Lax`;
      } catch (e) {
        console.warn('Could not persist order', e);
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
    const count = Array.from(memoryOrders.keys()).filter((id) => id.startsWith(prefix)).length;
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

    this.persistOrder(order);
    return of(order);
  }

  get(id: string): Observable<Order> {
    this.syncFromStorage();
    const order = memoryOrders.get(id);
    if (!order) {
      return throwError(() => new Error('Invoice not found'));
    }
    return of(order);
  }

  invoiceUrl(id: string, download = false): string {
    const order = memoryOrders.get(id);
    if (!order) return '#';
    const html = renderInvoiceHtml(order);
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }
}
