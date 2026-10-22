import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { CartService } from '../../core/cart.service';
import { ProductService } from '../../core/product.service';
import { Product } from '../../shared/models';
import { FREE_SHIPPING_FROM, VAT_RATE, calcTotals } from '../../shared/pricing';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  protected readonly cart = inject(CartService);
  private productsApi = inject(ProductService);

  protected readonly vatRate = VAT_RATE;
  protected readonly freeFrom = FREE_SHIPPING_FROM;

  /** Load product details for the ids in the cart (refetch only when ids change). */
  private readonly products = toSignal(
    toObservable(computed(() => this.cart.lines().map((l) => l.productId).sort().join(','))).pipe(
      distinctUntilChanged(),
      switchMap((ids) => (ids ? this.productsApi.getByIds(ids.split(',').map(Number)) : of([] as Product[]))),
      map((list) => new Map(list.map((p) => [p.id, p]))),
    ),
  );

  protected readonly loaded = computed(() => this.products() !== undefined);

  protected readonly rows = computed(() => {
    const byId = this.products() ?? new Map<number, Product>();
    return this.cart
      .lines()
      .filter((l) => byId.has(l.productId))
      .map((l) => {
        const product = byId.get(l.productId)!;
        return { product, qty: l.qty, lineTotal: product.price * l.qty };
      });
  });

  protected readonly totals = computed(() => calcTotals(this.rows().reduce((s, r) => s + r.lineTotal, 0)));
  protected readonly toFreeShipping = computed(() => Math.max(0, FREE_SHIPPING_FROM - this.totals().subtotal));

  constructor() {
    inject(Title).setTitle('Your cart — Angkor Tech');
  }
}
