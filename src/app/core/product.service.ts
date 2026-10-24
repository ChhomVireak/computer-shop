import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Product } from '../shared/models';
import { PRODUCTS } from '../shared/products.data';

export interface ProductQuery {
  category?: string | null;
  q?: string | null;
  sort?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  // Use in-memory array data instead of fetching from an API
  private readonly products: Product[] = [...PRODUCTS];

  list(query: ProductQuery = {}): Observable<Product[]> {
    let list = [...this.products];

    if (query.category) {
      list = list.filter((p) => p.category === query.category);
    }

    if (query.q) {
      const term = query.q.toLowerCase().trim();
      list = list.filter((p) =>
        [p.name, p.brand, p.cpu, p.gpu, p.category].join(' ').toLowerCase().includes(term),
      );
    }

    if (query.sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (query.sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (query.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return of(list);
  }

  getBySlug(slug: string): Observable<Product> {
    const product = this.products.find((p) => p.slug === slug);
    if (!product) {
      return throwError(() => new Error('Product not found'));
    }
    return of(product);
  }

  getByIds(ids: number[]): Observable<Product[]> {
    const wanted = new Set(ids);
    const list = this.products.filter((p) => wanted.has(p.id));
    return of(list);
  }
}
