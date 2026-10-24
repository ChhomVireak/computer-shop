import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { Product } from '../shared/models';
import { CATEGORY_LABELS } from '../shared/pricing';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let p = product();
    <article class="card">
      <a class="media" [routerLink]="['/product', p.slug]" [style.--accent]="p.color">
        <img [src]="p.image" [alt]="p.name" loading="lazy" />
        @if (p.oldPrice) {
          <span class="sale">-{{ discount(p) }}%</span>
        }
      </a>
      <div class="body">
        <div class="eyebrow">{{ p.brand }} · {{ categories[p.category] }}</div>
        <h3><a [routerLink]="['/product', p.slug]">{{ p.name }}</a></h3>
        <ul class="specs">
          <li>{{ p.cpu.split('(')[0].trim() }}</li>
          <li>{{ p.ram }} · {{ p.storage.split(' PCIe')[0].split(' NVMe')[0] }}</li>
        </ul>
        <div class="foot">
          <div class="price">
            <strong>{{ p.price | currency: 'USD' : 'symbol' : '1.0-0' }}</strong>
            @if (p.oldPrice) {
              <s>{{ p.oldPrice | currency: 'USD' : 'symbol' : '1.0-0' }}</s>
            }
          </div>
          <button class="btn btn-primary btn-sm" type="button" (click)="add(p)" [attr.aria-label]="'Add ' + p.name + ' to cart'">
            Add to cart
          </button>
        </div>
      </div>
    </article>
  `,
  styleUrl: './product-card.css',
})
export class ProductCard {
  readonly product = input.required<Product>();
  protected readonly categories = CATEGORY_LABELS;
  private cart = inject(CartService);
  private router = inject(Router);

  protected discount(p: Product) {
    return Math.round((1 - p.price / (p.oldPrice ?? p.price)) * 100);
  }

  protected add(p: Product) {
    this.cart.add(p.id);
    this.router.navigate(['/cart']);
  }
}
