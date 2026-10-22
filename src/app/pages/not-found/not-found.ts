import { ChangeDetectionStrategy, Component, RESPONSE_INIT, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container">
      <div class="panel empty" style="margin-top: 48px">
        <h1>404 — Page not found</h1>
        <p class="muted">The page you are looking for does not exist.</p>
        <a class="btn btn-primary" routerLink="/">Back to shop</a>
      </div>
    </div>
  `,
})
export class NotFound {
  constructor() {
    inject(Title).setTitle('Page not found — Angkor Tech');
    const res = inject(RESPONSE_INIT, { optional: true });
    if (res) res.status = 404;
  }
}
