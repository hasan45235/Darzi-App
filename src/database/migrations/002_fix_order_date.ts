import type { SQLiteDatabase } from "expo-sqlite";

export async function migrate002FixOrderSchema(
  db: SQLiteDatabase
): Promise<void> {
  await db.execAsync(`
    ALTER TABLE orders
    RENAME COLUMN creation_date TO order_date;

    ALTER TABLE orders
    ADD COLUMN tailoring_details TEXT;
  `);
}