import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../shared/models';

export interface ProductQuery {
  category?: string | null;
  q?: string | null;
  sort?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  list(query: ProductQuery = {}): Observable<Product[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params = params.set(key, value);
    }
    return this.http.get<Product[]>('/api/products', { params });
  }

  getBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`/api/products/${encodeURIComponent(slug)}`);
  }

  getByIds(ids: number[]): Observable<Product[]> {
    return this.http.get<Product[]>('/api/products', { params: { ids: ids.join(',') } });
  }
}
