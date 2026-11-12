
import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Vercel's project files are read-only; its only writable place is the temp folder.
// There the database is per server instance and is re-seeded when an instance starts.
const dataDirectory = process.env.VERCEL
  ? path.join(os.tmpdir(), "leashpay")
  : path.join(process.cwd(), "data");

fs.mkdirSync(dataDirectory, { recursive: true });

const db = new Database(
  path.join(dataDirectory, "leashpay.db")
);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS mandates (
    id INTEGER PRIMARY KEY,
    budget INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    allowed_categories TEXT NOT NULL,
    max_quantity INTEGER NOT NULL DEFAULT 2,
    require_approval INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    stock INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paypal_order_id TEXT UNIQUE,
    status TEXT NOT NULL,
    total INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const seedProducts = [
  {
    id: "headphones-1",
    name: "Soundcore Life Q30",
    category: "Electronics",
    price: 249900,
    stock: 10,
    rating: 4.6,
    description: "Wireless headphones for gym and everyday use."
  },
  {
    id: "headphones-2",
    name: "Sony WH-CH520",
    category: "Electronics",
    price: 429000,
    stock: 8,
    rating: 4.5,
    description: "Lightweight wireless headphones."
  },
  {
    id: "headphones-3",
    name: "JBL Tune 770NC",
    category: "Electronics",
    price: 599900,
    stock: 6,
    rating: 4.7,
    description: "Wireless noise cancelling headphones."
  },
  {
    id: "monitor-1",
    name: "Demo 4K Monitor",
    category: "Electronics",
    price: 4000000,
    stock: 3,
    rating: 4.8,
    description: "Premium demo monitor."
  },
  {
    id: "shoes-1",
    name: "Running Shoes",
    category: "Fashion",
    price: 199900,
    stock: 5,
    rating: 4.3,
    description: "Demo running shoes."
  }
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products
  (id, name, category, price, stock, rating, description)
  VALUES (
    @id, @name, @category, @price,
    @stock, @rating, @description
  )
`);

const seed = db.transaction(() => {
  for (const product of seedProducts) {
    insertProduct.run(product);
  }

  db.prepare(`
    INSERT OR IGNORE INTO mandates
    (id, budget, currency, allowed_categories, max_quantity, require_approval)
    VALUES (1, 50, 'USD', '["Electronics"]', 2, 1)
  `).run();
});

seed();
// Keep the demo mandate at $50 (5000 cents).
db.prepare(`
  UPDATE mandates
  SET budget = 5000,
      currency = 'USD',
      allowed_categories = '["Electronics","Fashion"]'
  WHERE id = 1
`).run();
// One-time USD price correction for existing demo products.
const correctPrices = db.transaction(() => {
  const prices = [
    ["headphones-1", 3000],
    ["headphones-2", 4290],
    ["headphones-3", 5999],
    ["monitor-1", 50000],
    ["shoes-1", 1999],
  ] as const;

  const update = db.prepare(
    "UPDATE products SET price = ?, currency = 'USD' WHERE id = ?"
  );

  for (const [id, price] of prices) {
    update.run(price, id);
  }
});

correctPrices();
export type StoredMandate = {
  id: number;
  budget: number;
  currency: "USD";
  allowed_categories: string;
  max_quantity: number;
  require_approval: number;
};

export function getMandate(): StoredMandate | undefined {
  return db.prepare(
    "SELECT * FROM mandates WHERE id = 1"
  ).get() as StoredMandate | undefined;
}

export function getCatalogProducts() {
  return db.prepare(
    "SELECT * FROM products ORDER BY name"
  ).all();
}

export function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => "?").join(",");

  return db.prepare(
    `SELECT * FROM products WHERE id IN (${placeholders})`
  ).all(...ids);
}

export default db;

// Older local databases were created before orders stored their items.
const orderColumns = db.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>;
if (!orderColumns.some((column) => column.name === "items")) {
  db.exec("ALTER TABLE orders ADD COLUMN items TEXT NOT NULL DEFAULT '[]'");
}

export function insertPendingOrder(order: {
  paypalOrderId: string;
  total: number;
  currency: "USD";
  items: Array<{ productId: string; quantity: number }>;
}) {
  db.prepare(`
    INSERT INTO orders (paypal_order_id, status, total, currency, items)
    VALUES (?, 'PENDING', ?, ?, ?)
  `).run(order.paypalOrderId, order.total, order.currency, JSON.stringify(order.items));
}

export type StoredOrder = {
  id: number;
  paypal_order_id: string;
  status: string;
  total: number;
  currency: string;
  items: string;
  created_at: string;
};

export function getRecentOrders(limit = 50): StoredOrder[] {
  return db.prepare(
    "SELECT id, paypal_order_id, status, total, currency, items, created_at FROM orders ORDER BY id DESC LIMIT ?"
  ).all(limit) as StoredOrder[];
}
