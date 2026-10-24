import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, REQUEST, computed, inject, signal } from '@angular/core';
import { CartLine } from '../shared/models';

const COOKIE = 'cart';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * The cart lives in a cookie (e.g. "1:2,7:1" = product 1 × 2, product 7 × 1).
 * A cookie — not localStorage — because the server can read it too, so the
 * cart badge and the cart page are already correct in the server-rendered HTML.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private document = inject(DOCUMENT);
  private request = inject(REQUEST, { optional: true }); // only exists during SSR
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _lines = signal<CartLine[]>(this.readCookie());
  readonly lines = this._lines.asReadonly();
  readonly count = computed(() => this._lines().reduce((sum, l) => sum + l.qty, 0));

  add(productId: number, qty = 1) {
    this.update((lines) => {
      const existing = lines.find((l) => l.productId === productId);
      return existing
        ? lines.map((l) => (l.productId === productId ? { ...l, qty: Math.min(l.qty + qty, 99) } : l))
        : [...lines, { productId, qty }];
    });
  }

  setQty(productId: number, qty: number) {
    if (qty <= 0) return this.remove(productId);
    this.update((lines) => lines.map((l) => (l.productId === productId ? { ...l, qty: Math.min(qty, 99) } : l)));
  }

  remove(productId: number) {
    this.update((lines) => lines.filter((l) => l.productId !== productId));
  }

  clear() {
    this.update(() => []);
  }

  private update(fn: (lines: CartLine[]) => CartLine[]) {
    this._lines.update(fn);
    this.writeCookie(this._lines());
  }

  private readCookie(): CartLine[] {
    const header = this.isBrowser ? this.document.cookie : (this.request?.headers.get('cookie') ?? '');
    const raw = header
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(COOKIE + '='))
      ?.slice(COOKIE.length + 1);
    if (!raw) return [{ productId: 1, qty: 1 }];
    return decodeURIComponent(raw)
      .split(',')
      .map((pair) => pair.split(':').map(Number))
      .filter(([id, qty]) => id > 0 && qty > 0)
      .map(([productId, qty]) => ({ productId, qty }));
  }

  private writeCookie(lines: CartLine[]) {
    if (!this.isBrowser) return;
    const value = encodeURIComponent(lines.map((l) => `${l.productId}:${l.qty}`).join(','));
    this.document.cookie = lines.length
      ? `${COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
      : `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}
