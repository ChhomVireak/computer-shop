import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Order } from '../app/shared/models';

/**
 * Very small order "database": keeps orders in memory and saves them to
 * data/orders.json so invoices survive a server restart.
 * Swap this for MySQL / PostgreSQL / MongoDB in a real project.
 */
const DATA_DIR = join(process.cwd(), 'data');
const FILE = join(DATA_DIR, 'orders.json');

const orders = new Map<string, Order>();

function load() {
  if (!existsSync(FILE)) return;
  try {
    const list = JSON.parse(readFileSync(FILE, 'utf8')) as Order[];
    list.forEach((o) => orders.set(o.id, o));
  } catch {
    console.warn('[orders] could not read data/orders.json, starting empty');
  }
}

function save() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify([...orders.values()], null, 2));
}

load();

/** INV-YYYYMMDD-0001 style invoice numbers. */
export function nextOrderId(now = new Date()): string {
  const day = now.toISOString().slice(0, 10).replaceAll('-', '');
  const prefix = `INV-${day}-`;
  const todays = [...orders.keys()].filter((id) => id.startsWith(prefix)).length;
  return prefix + String(todays + 1).padStart(4, '0');
}

export const orderStore = {
  get: (id: string) => orders.get(id),
  add(order: Order) {
    orders.set(order.id, order);
    save();
    return order;
  },
};
