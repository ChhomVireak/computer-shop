import { Routes } from '@angular/router';

export const routes: Routes = [
  // 1. Catalog / home  — /?category=laptop&q=asus&sort=price-asc
  { path: '', loadComponent: () => import('./pages/catalog/catalog').then((m) => m.Catalog) },
  // 2. Product detail (+ add to cart)
  { path: 'product/:slug', loadComponent: () => import('./pages/product-detail/product-detail').then((m) => m.ProductDetail) },
  // 3. Cart list
  { path: 'cart', loadComponent: () => import('./pages/cart/cart').then((m) => m.Cart) },
  // 4. Checkout
  { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout) },
  // 5. Invoice (also downloadable as .html from /api/orders/:id/invoice.html)
  { path: 'invoice/:id', loadComponent: () => import('./pages/invoice/invoice').then((m) => m.Invoice) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
];
