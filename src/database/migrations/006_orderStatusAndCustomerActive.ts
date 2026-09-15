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

// Adds order workflow status (waiting / in progress / completed /
// cancelled) and a customer soft-delete flag. Guarded the same way as
// migrations 004/005 so a re-entered run can't crash on "duplicate
// column name".
export async function migrate006OrderStatusAndCustomerActive(
    db: SQLiteDatabase
): Promise<void> {
    if (
        !(await columnExists(
            db,
            "orders",
            "status"
        ))
    ) {
        // SQLite fills this default into every existing row too, so
        // orders created before this column existed become "waiting"
        // automatically - nothing else to backfill.
        await db.execAsync(`
            ALTER TABLE orders
            ADD COLUMN status TEXT NOT NULL DEFAULT 'waiting';
        `);
    }

    if (
        !(await columnExists(
            db,
            "customers",
            "is_active"
        ))
    ) {
        // Soft-delete flag: an inactive customer is hidden from the
        // main Customers list but their record and order history stay
        // intact until someone permanently deletes them from Settings.
        await db.execAsync(`
            ALTER TABLE customers
            ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
        `);
    }

    await db.execAsync(`
        CREATE INDEX IF NOT EXISTS
        idx_orders_status
        ON orders(status);

        CREATE INDEX IF NOT EXISTS
        idx_customers_is_active
        ON customers(is_active);
    `);
}
