import { Order } from '../app/shared/models';
import { PAYMENT_LABELS, VAT_RATE } from '../app/shared/pricing';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

/**
 * Builds a standalone invoice .html file (inline CSS, no JavaScript) that the
 * customer can download, open offline, print or e-mail.
 */
export function renderInvoiceHtml(order: Order): string {
  const date = new Date(order.createdAt).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Phnom_Penh',
  });
  const c = order.customer;
  const rows = order.items
    .map(
      (it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(it.name)}</td>
        <td class="num">${it.qty}</td>
        <td class="num">${usd(it.unitPrice)}</td>
        <td class="num">${usd(it.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invoice ${esc(order.id)} — Angkor Tech</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #eef1f6; font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
  .page { max-width: 820px; margin: 32px auto; background: #fff; padding: 48px; border-radius: 12px; box-shadow: 0 10px 30px rgba(15,23,42,.08); }
  header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #0f172a; padding-bottom: 20px; }
  .brand { font-size: 22px; font-weight: 800; letter-spacing: -.02em; }
  .brand span { color: #2563eb; }
  .muted { color: #64748b; }
  h1 { margin: 0; font-size: 28px; letter-spacing: .08em; text-align: right; }
  .meta { text-align: right; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 28px 0; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #64748b; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; border-bottom: 1px solid #cbd5e1; padding: 8px 6px; }
  td { padding: 10px 6px; border-bottom: 1px solid #e2e8f0; }
  .num { text-align: right; white-space: nowrap; }
  .totals { margin-left: auto; width: 300px; margin-top: 16px; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 10px; font-size: 18px; font-weight: 800; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; }
  footer { margin-top: 40px; font-size: 12px; color: #64748b; text-align: center; }
  @media print { body { background: #fff; } .page { box-shadow: none; margin: 0; padding: 0; } }
  @media (max-width: 600px) { .page { padding: 20px; margin: 0; border-radius: 0; } .grid { grid-template-columns: 1fr; } header { flex-direction: column; } h1, .meta { text-align: left; } .totals { width: 100%; } }
</style>
</head>
<body>
<div class="page">
  <header>
    <div>
      <div class="brand">Angkor<span>Tech</span></div>
      <div class="muted">Computer Store · Street 271, Phnom Penh<br>+855 12 345 678 · sales@angkortech.example</div>
    </div>
    <div class="meta">
      <h1>INVOICE</h1>
      <div><strong>${esc(order.id)}</strong></div>
      <div class="muted">${esc(date)}</div>
    </div>
  </header>

  <div class="grid">
    <div>
      <div class="label">Bill to</div>
      <strong>${esc(c.fullName)}</strong><br>
      ${esc(c.address)}, ${esc(c.city)}<br>
      ${esc(c.phone)} · ${esc(c.email)}
    </div>
    <div>
      <div class="label">Payment</div>
      ${esc(PAYMENT_LABELS[order.payment])}<br>
      <span class="badge">${order.status === 'paid' ? 'Paid' : 'Awaiting payment'}</span>
      ${c.note ? `<div style="margin-top:10px"><div class="label">Note</div>${esc(c.note)}</div>` : ''}
    </div>
  </div>

  <table>
    <thead><tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${usd(order.totals.subtotal)}</span></div>
    <div><span>VAT (${VAT_RATE * 100}%)</span><span>${usd(order.totals.vat)}</span></div>
    <div><span>Shipping</span><span>${order.totals.shipping ? usd(order.totals.shipping) : 'Free'}</span></div>
    <div class="grand"><span>Total</span><span>${usd(order.totals.total)}</span></div>
  </div>

  <footer>Thank you for shopping with Angkor Tech. Goods sold are covered by the manufacturer warranty listed on each product.</footer>
</div>
</body>
</html>`;
}
