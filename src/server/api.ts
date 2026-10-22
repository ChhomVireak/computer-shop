import express, { Router } from 'express';
import { CreateOrderRequest, Order, OrderItem, PaymentMethod } from '../app/shared/models';
import { calcTotals } from '../app/shared/pricing';
import { PRODUCTS } from '../app/shared/products.data';
import { renderInvoiceHtml } from './invoice-html';
import { nextOrderId, orderStore } from './order-store';

/**
 * REST API used by the Angular app. During SSR, Angular calls these same
 * endpoints on the server, renders the HTML, and passes the JSON to the
 * browser (HTTP transfer cache) so it is not fetched twice.
 */
export const api = Router();
api.use(express.json());

// GET /api/products?category=laptop&q=asus&sort=price-asc&ids=1,2
api.get('/products', (req, res) => {
  const { category, q, sort, ids } = req.query as Record<string, string | undefined>;
  let list = [...PRODUCTS];

  if (ids) {
    const wanted = ids.split(',').map(Number);
    list = list.filter((p) => wanted.includes(p.id));
  }
  if (category) list = list.filter((p) => p.category === category);
  if (q) {
    const term = q.toLowerCase().trim();
    list = list.filter((p) =>
      [p.name, p.brand, p.cpu, p.gpu, p.category].join(' ').toLowerCase().includes(term),
    );
  }
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);

  res.json(list);
});

// GET /api/products/:slug
api.get('/products/:slug', (req, res) => {
  const product = PRODUCTS.find((p) => p.slug === req.params.slug);
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }
  res.json(product);
});

const PAYMENTS: PaymentMethod[] = ['cod', 'aba-khqr', 'bank-transfer'];

// POST /api/orders  — prices are recalculated here, never trusted from the browser.
api.post('/orders', (req, res) => {
  const body = req.body as CreateOrderRequest;
  const c = body?.customer;

  if (!c?.fullName?.trim() || !c?.phone?.trim() || !c?.email?.trim() || !c?.address?.trim() || !c?.city?.trim()) {
    res.status(400).json({ message: 'Please fill in all customer details.' });
    return;
  }
  if (!PAYMENTS.includes(body.payment)) {
    res.status(400).json({ message: 'Invalid payment method.' });
    return;
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    res.status(400).json({ message: 'Your cart is empty.' });
    return;
  }

  const items: OrderItem[] = [];
  for (const line of body.items) {
    const p = PRODUCTS.find((x) => x.id === Number(line.productId));
    const qty = Math.floor(Number(line.qty));
    if (!p || !(qty > 0)) {
      res.status(400).json({ message: 'Your cart contains an invalid item.' });
      return;
    }
    if (qty > p.stock) {
      res.status(409).json({ message: `Only ${p.stock} × ${p.name} left in stock.` });
      return;
    }
    items.push({ productId: p.id, slug: p.slug, name: p.name, unitPrice: p.price, qty, lineTotal: p.price * qty });
  }

  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const order: Order = {
    id: nextOrderId(),
    createdAt: new Date().toISOString(),
    customer: {
      fullName: c.fullName.trim(),
      phone: c.phone.trim(),
      email: c.email.trim(),
      address: c.address.trim(),
      city: c.city.trim(),
      note: c.note?.trim() || undefined,
    },
    payment: body.payment,
    items,
    totals: calcTotals(subtotal),
    status: 'pending',
  };

  res.status(201).json(orderStore.add(order));
});

// GET /api/orders/:id
api.get('/orders/:id', (req, res) => {
  const order = orderStore.get(req.params.id);
  if (!order) {
    res.status(404).json({ message: 'Invoice not found' });
    return;
  }
  res.json(order);
});

// GET /api/orders/:id/invoice.html  (?download=1 to save as a file)
api.get('/orders/:id/invoice.html', (req, res) => {
  const order = orderStore.get(req.params.id);
  if (!order) {
    res.status(404).send('Invoice not found');
    return;
  }
  if (req.query['download']) {
    res.setHeader('Content-Disposition', `attachment; filename="${order.id}.html"`);
  }
  res.type('html').send(renderInvoiceHtml(order));
});
