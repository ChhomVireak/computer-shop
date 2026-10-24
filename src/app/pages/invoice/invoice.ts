import { CurrencyPipe, DOCUMENT, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, RESPONSE_INIT, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { OrderService } from '../../core/order.service';
import { Order } from '../../shared/models';
import { PAYMENT_LABELS, VAT_RATE } from '../../shared/pricing';

type State = { status: 'loading' } | { status: 'found'; order: Order } | { status: 'missing' };

@Component({
  selector: 'app-invoice',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice.html',
  styleUrl: './invoice.css',
})
export class Invoice {
  /** Bound from /invoice/:id */
  readonly id = input.required<string>();

  protected readonly orders = inject(OrderService);
  private document = inject(DOCUMENT);
  private title = inject(Title);
  private responseInit = inject(RESPONSE_INIT, { optional: true });

  protected readonly payments = PAYMENT_LABELS;
  protected readonly vatRate = VAT_RATE;

  protected readonly state = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.orders.get(id).pipe(
          map((order): State => ({ status: 'found', order })),
          catchError(() => of<State>({ status: 'missing' })),
        ),
      ),
      tap((s) => {
        if (s.status === 'found') this.title.setTitle(`Invoice ${s.order.id} — Angkor Tech`);
        if (s.status === 'missing') {
          this.title.setTitle('Invoice not found — Angkor Tech');
          if (this.responseInit) this.responseInit.status = 404;
        }
      }),
    ),
    { initialValue: { status: 'loading' } as State },
  );

  protected print() {
    this.document.defaultView?.print();
  }
}
