import type { SQLiteDatabase } from "expo-sqlite";

export async function migrate003AddTailoringDetails(
    db: SQLiteDatabase
): Promise<void> {
    await db.execAsync(`
    ALTER TABLE orders
    ADD COLUMN tailoring_details TEXT;
  `);
}