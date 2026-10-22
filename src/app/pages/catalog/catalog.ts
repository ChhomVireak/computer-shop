import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { ProductCard } from '../../components/product-card';
import { ProductService } from '../../core/product.service';
import { CATEGORY_LABELS } from '../../shared/pricing';

@Component({
  selector: 'app-catalog',
  imports: [RouterLink, ProductCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private products = inject(ProductService);
  private title = inject(Title);
  private meta = inject(Meta);

  protected readonly sortOptions = [
    { value: '', label: 'Featured' },
    { value: 'price-asc', label: 'Price: low → high' },
    { value: 'price-desc', label: 'Price: high → low' },
    { value: 'rating', label: 'Top rated' },
  ];

  protected readonly categories =Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

  /** Filters come from the URL (?category=&q=&sort=) so every result page has its own SSR URL. */
  protected readonly filters = toSignal(
    this.route.queryParamMap.pipe(
      map((p) => ({ category: p.get('category'), q: p.get('q'), sort: p.get('sort') ?? '' })),
    ),
    { requireSync: true },
  );

  protected readonly products$ = toSignal(
    this.route.queryParamMap.pipe(
      map((p) => ({ category: p.get('category'), q: p.get('q'), sort: p.get('sort') })),
      tap((f) => this.setSeo(f.category)),
      switchMap((f) => this.products.list(f)),
    ),
  );

  protected readonly heading = computed(() => {
    const f = this.filters();
    if (f.q) return `Results for “${f.q}”`;
    return f.category ? CATEGORY_LABELS[f.category] ?? 'All computers' : 'All computers';
  });

  protected search(event: SubmitEvent) {
    event.preventDefault();
    const q = (new FormData(event.target as HTMLFormElement).get('q') as string)?.trim();
    this.router.navigate(['/'], { queryParams: { q: q || null }, queryParamsHandling: 'merge' });
  }

  protected changeSort(sort: string) {
    this.router.navigate(['/'], { queryParams: { sort: sort || null }, queryParamsHandling: 'merge' });
  }

  private setSeo(category: string | null) {
    const label = category ? CATEGORY_LABELS[category] : null;
    this.title.setTitle(label ? `${label} — Angkor Tech` : 'Angkor Tech — Laptops & Desktops in Phnom Penh');
    this.meta.updateTag({
      name: 'description',
      content: 'Buy laptops, gaming PCs, all-in-ones and mini PCs in Phnom Penh. Warranty included, free delivery over $500.',
    });
  }
}
