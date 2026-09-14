import type { SQLiteDatabase } from "expo-sqlite";

export async function migrate004CustomerNumberAndItemOptions(
    db: SQLiteDatabase
): Promise<void> {
    await db.execAsync(`
    ALTER TABLE customers
    ADD COLUMN customer_number INTEGER;

    ALTER TABLE order_items
    ADD COLUMN design_type TEXT NOT NULL DEFAULT 'simple';

    ALTER TABLE orders
    ADD COLUMN discount REAL NOT NULL DEFAULT 0;

    ALTER TABLE orders
    ADD COLUMN addition REAL NOT NULL DEFAULT 0;
  `);
}