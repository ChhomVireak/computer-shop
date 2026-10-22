import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateOrderRequest, Order } from '../shared/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);

  create(body: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>('/api/orders', body);
  }

  get(id: string): Observable<Order> {
    return this.http.get<Order>(`/api/orders/${encodeURIComponent(id)}`);
  }

  invoiceUrl(id: string, download = false): string {
    return `/api/orders/${encodeURIComponent(id)}/invoice.html${download ? '?download=1' : ''}`;
  }
}
