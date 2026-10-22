import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, RESPONSE_INIT, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { ProductCard } from '../../components/product-card';
import { CartService } from '../../core/cart.service';
import { ProductService } from '../../core/product.service';
import { ToastService } from '../../core/toast.service';
import { Product } from '../../shared/models';
import { CATEGORY_LABELS } from '../../shared/pricing';

type State = { status: 'loading' } | { status: 'found'; product: Product; related: Product[] } | { status: 'missing' };

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe, ProductCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail {
  /** Bound from the route /product/:slug (withComponentInputBinding). */
  readonly slug = input.required<string>();

  private products = inject(ProductService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private title = inject(Title);
  private meta = inject(Meta);
  private responseInit = inject(RESPONSE_INIT, { optional: true }); // SSR only

  protected readonly categories = CATEGORY_LABELS;
  protected readonly qty = signal(1);

  protected readonly state = toSignal(
    toObservable(this.slug).pipe(
      tap(() => this.qty.set(1)),
      switchMap((slug) =>
        this.products.getBySlug(slug).pipe(
          switchMap((product) =>
            this.products.list({ category: product.category }).pipe(
              map((list): State => ({
                status: 'found',
                product,
                related: list.filter((p) => p.id !== product.id).slice(0, 3),
              })),
            ),
          ),
          catchError(() => of<State>({ status: 'missing' })),
        ),
      ),
      tap((s) => this.setSeo(s)),
    ),
    { initialValue: { status: 'loading' } as State },
  );

  protected specs(p: Product) {
    return [
      ['Processor', p.cpu],
      ['Memory', p.ram],
      ['Storage', p.storage],
      ['Graphics', p.gpu],
      ['Display', p.display],
      ['Operating system', p.os],
      ['Warranty', p.warranty],
    ];
  }

  protected step(delta: number, max: number) {
    this.qty.update((q) => Math.max(1, Math.min(max, q + delta)));
  }

  protected addToCart(p: Product, goToCart = false) {
    this.cart.add(p.id, this.qty());
    if (goToCart) {
      this.router.navigate(['/cart']);
    } else {
      this.toast.show(`${this.qty()} × ${p.name} added to cart`);
    }
  }

  private setSeo(s: State) {
    if (s.status === 'found') {
      const p = s.product;
      this.title.setTitle(`${p.name} — Angkor Tech`);
      this.meta.updateTag({ name: 'description', content: `${p.name}: ${p.cpu}, ${p.ram}, ${p.storage}. ${p.description}` });
      this.meta.updateTag({ property: 'og:title', content: p.name });
    } else if (s.status === 'missing') {
      this.title.setTitle('Product not found — Angkor Tech');
      if (this.responseInit) this.responseInit.status = 404; // real 404 status from the server
    }
  }
}
