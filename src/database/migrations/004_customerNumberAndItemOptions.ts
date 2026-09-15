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

// Guarded the same way migration 005 is: ALTER TABLE ADD COLUMN throws
// "duplicate column name" if the column is already there, so every
// statement here is idempotent. Without this, a database that somehow
// re-enters this migration (e.g. its recorded schema_migrations version
// fell behind its actual columns) would crash instead of just skipping
// the columns it already has.
export async function migrate004CustomerNumberAndItemOptions(
    db: SQLiteDatabase
): Promise<void> {
    if (
        !(await columnExists(
            db,
            "customers",
            "customer_number"
        ))
    ) {
        await db.execAsync(`
            ALTER TABLE customers
            ADD COLUMN customer_number INTEGER;
        `);
    }

    if (
        !(await columnExists(
            db,
            "order_items",
            "design_type"
        ))
    ) {
        await db.execAsync(`
            ALTER TABLE order_items
            ADD COLUMN design_type TEXT NOT NULL DEFAULT 'simple';
        `);
    }

    if (
        !(await columnExists(
            db,
            "orders",
            "discount"
        ))
    ) {
        await db.execAsync(`
            ALTER TABLE orders
            ADD COLUMN discount REAL NOT NULL DEFAULT 0;
        `);
    }

    if (
        !(await columnExists(
            db,
            "orders",
            "addition"
        ))
    ) {
        await db.execAsync(`
            ALTER TABLE orders
            ADD COLUMN addition REAL NOT NULL DEFAULT 0;
        `);
    }
}
