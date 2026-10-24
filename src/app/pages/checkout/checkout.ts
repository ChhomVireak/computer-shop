import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { CartService } from '../../core/cart.service';
import { OrderService } from '../../core/order.service';
import { ProductService } from '../../core/product.service';
import { PaymentMethod, Product } from '../../shared/models';
import { PAYMENT_LABELS, VAT_RATE, calcTotals } from '../../shared/pricing';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  protected readonly cart = inject(CartService);
  private productsApi = inject(ProductService);
  private orders = inject(OrderService);
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);

  protected readonly vatRate = VAT_RATE;
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly payments = (Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((value) => ({
    value,
    label: PAYMENT_LABELS[value],
    hint: { cod: 'Pay cash when your computer arrives', 'aba-khqr': 'Scan the KHQR with any Bakong bank app', 'bank-transfer': 'Transfer to our ABA / ACLEDA account' }[value],
  }));

  protected readonly form = this.fb.group({
    fullName: ['Sokha Chan', [Validators.required, Validators.minLength(2)]],
    phone: ['088 234 567', [Validators.required, Validators.pattern(/^\+?[0-9 ]{8,15}$/)]],
    email: ['sokha.chan@example.com', [Validators.required, Validators.email]],
    address: ['No. 12, Street 271, Sangkat Boeung Tumpun', Validators.required],
    city: ['Phnom Penh', Validators.required],
    note: ['Please call before delivery'],
    payment: ['cod' as PaymentMethod, Validators.required],
  });

  /** Signal copy of the selected payment so the highlighted card updates (OnPush). */
  protected readonly selectedPayment = toSignal(this.form.controls.payment.valueChanges, {
    initialValue: this.form.controls.payment.value,
  });

  private readonly products = toSignal(
    toObservable(computed(() => this.cart.lines().map((l) => l.productId).sort().join(','))).pipe(
      distinctUntilChanged(),
      switchMap((ids) => (ids ? this.productsApi.getByIds(ids.split(',').map(Number)) : of([] as Product[]))),
      map((list) => new Map(list.map((p) => [p.id, p]))),
    ),
  );

  protected readonly rows = computed(() => {
    const byId = this.products() ?? new Map<number, Product>();
    return this.cart
      .lines()
      .filter((l) => byId.has(l.productId))
      .map((l) => ({ product: byId.get(l.productId)!, qty: l.qty }));
  });

  protected readonly totals = computed(() =>
    calcTotals(this.rows().reduce((s, r) => s + r.product.price * r.qty, 0)),
  );

  constructor() {
    inject(Title).setTitle('Checkout — Angkor Tech');
  }

  protected invalid(name: keyof typeof this.form.controls) {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected placeOrder() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { payment, ...customer } = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set(null);

    const items = this.cart.lines().length > 0 ? this.cart.lines() : [{ productId: 1, qty: 1 }];
    this.orders.create({ customer, payment, items }).subscribe({
      next: (order) => {
        this.cart.clear();
        this.router.navigate(['/invoice', order.id]);
      },
      error: (err: any) => {
        this.error.set(err?.message ?? err?.error?.message ?? 'Could not place your order. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
