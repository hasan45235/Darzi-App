import type { SQLiteDatabase } from "expo-sqlite";

export async function migrate001Initial(
    db: SQLiteDatabase
): Promise<void> {
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      photo_uri TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number INTEGER NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      creation_date TEXT NOT NULL,
      delivery_date TEXT NOT NULL,
      notes TEXT,
      total REAL NOT NULL DEFAULT 0,
      paid REAL NOT NULL DEFAULT 0,
      remaining REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      notes TEXT,

      FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customers_name
      ON customers(name);

    CREATE INDEX IF NOT EXISTS idx_customers_phone
      ON customers(phone);

    CREATE INDEX IF NOT EXISTS idx_orders_customer_id
      ON orders(customer_id);

    CREATE INDEX IF NOT EXISTS idx_orders_delivery_date
      ON orders(delivery_date);

    CREATE INDEX IF NOT EXISTS idx_order_items_order_id
      ON order_items(order_id);
  `);
}