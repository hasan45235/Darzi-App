import type { SQLiteDatabase } from "expo-sqlite";

async function columnExists(
    db: SQLiteDatabase,
    tableName: string,
    columnName: string
): Promise<boolean> {
    const columns = await db.getAllAsync<{
        name: string;
    }>(`PRAGMA table_info(${tableName})`);

    return columns.some(
        (column) => column.name === columnName
    );
}

// Adds a per-item button style (simple / fancy) - a separate concern
// from design_type (plain vs. custom design work), since a garment can
// have a custom design but plain buttons, or vice versa. Guarded the
// same way as migrations 004/005/006 so a re-entered run can't crash on
// "duplicate column name".
export async function migrate007OrderItemButtonType(
    db: SQLiteDatabase
): Promise<void> {
    if (
        !(await columnExists(
            db,
            "order_items",
            "button_type"
        ))
    ) {
        await db.execAsync(`
            ALTER TABLE order_items
            ADD COLUMN button_type TEXT NOT NULL DEFAULT 'simple';
        `);
    }

    await db.execAsync(`
        CREATE INDEX IF NOT EXISTS
        idx_order_items_button_type
        ON order_items(button_type);
    `);
}
