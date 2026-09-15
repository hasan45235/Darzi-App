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

export async function migrate005OrderCustomerOptions(
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

    if (
        !(await columnExists(
            db,
            "orders",
            "design_type"
        ))
    ) {
        await db.execAsync(`
            ALTER TABLE orders
            ADD COLUMN design_type TEXT NOT NULL DEFAULT 'simple';
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

    await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS
        idx_customers_customer_number
        ON customers(customer_number);

        CREATE INDEX IF NOT EXISTS
        idx_order_items_design_type
        ON order_items(design_type);
    `);
}