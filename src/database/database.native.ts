import * as SQLite from "expo-sqlite";

import { migrate001Initial } from "@/database/migrations/001_initial";
import { migrate002FixOrderSchema } from "@/database/migrations/002_fix_order_date";
import { migrate004CustomerNumberAndItemOptions } from "@/database/migrations/004_customerNumberAndItemOptions";
import { migrate005OrderCustomerOptions } from "@/database/migrations/005_orderCustomerOptions";
import { migrate006OrderStatusAndCustomerActive } from "@/database/migrations/006_orderStatusAndCustomerActive";
import { migrate007OrderItemButtonType } from "@/database/migrations/007_orderItemButtonType";

const DATABASE_NAME = "the-stitch-center.db";

// Every screen fetches its own data as soon as it mounts, and several
// fetch multiple things at once (Home, Customers, Orders all use
// Promise.all/allSettled) - each of those calls getDatabase()
// independently and near-simultaneously. Caching only the *resolved*
// database (a plain `SQLiteDatabase | null` variable) doesn't protect
// against that: two calls that both arrive before the first one
// finishes would each see the cache empty, each open their own native
// connection, and each try to run migrations at the same time - which
// can throw "duplicate column" errors (two migration runs racing) or
// lock the file against itself. Caching the in-flight *promise* instead
// closes that race, since every caller - no matter how many arrive
// before the first one settles - ends up awaiting the exact same
// open-and-migrate work and gets back the exact same connection.
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
    const database = await SQLite.openDatabaseAsync(
        DATABASE_NAME
    );

    // SQLite ignores declared FOREIGN KEY constraints unless this
    // pragma is set on every connection - without it, deleting a
    // customer silently orphans their orders instead of being blocked.
    await database.execAsync(
        "PRAGMA foreign_keys = ON;"
    );

    await runMigrations(database);

    return database;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!databasePromise) {
        // If opening or migrating fails, don't leave every future call
        // stuck permanently reusing a broken/rejected promise - clear
        // the cache so the next call starts clean instead of every
        // screen failing forever with the same error until the app is
        // fully restarted.
        databasePromise = openAndMigrate().catch((error) => {
            databasePromise = null;
            throw error;
        });
    }

    return databasePromise;
}

async function runMigrations(
    db: SQLite.SQLiteDatabase
): Promise<void> {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY NOT NULL,
            applied_at TEXT NOT NULL
        );
    `);

    let migration =
        await db.getFirstAsync<{
            version: number;
        }>(
            `
            SELECT version
            FROM schema_migrations
            ORDER BY version DESC
            LIMIT 1
            `
        );

    let currentVersion =
        migration?.version ?? 0;

    if (currentVersion < 1) {
        await migrate001Initial(db);

        await db.runAsync(
            `
            INSERT INTO schema_migrations
            (version, applied_at)
            VALUES (?, ?)
            `,
            1,
            new Date().toISOString()
        );

        currentVersion = 1;
    }

    if (currentVersion < 2) {
        await migrate002FixOrderSchema(db);

        await db.runAsync(
            `
            INSERT INTO schema_migrations
            (version, applied_at)
            VALUES (?, ?)
            `,
            2,
            new Date().toISOString()
        );

        currentVersion = 2;
    }

    if (currentVersion < 4) {
        await migrate004CustomerNumberAndItemOptions(db);

        await db.runAsync(
            `
            INSERT INTO schema_migrations
            (version, applied_at)
            VALUES (?, ?)
            `,
            4,
            new Date().toISOString()
        );

        currentVersion = 4;
    }

    if (currentVersion < 5) {
        await migrate005OrderCustomerOptions(db);

        await db.runAsync(
            `
            INSERT INTO schema_migrations
            (version, applied_at)
            VALUES (?, ?)
            `,
            5,
            new Date().toISOString()
        );

        currentVersion = 5;
    }

    if (currentVersion < 6) {
        await migrate006OrderStatusAndCustomerActive(db);

        await db.runAsync(
            `
            INSERT INTO schema_migrations
            (version, applied_at)
            VALUES (?, ?)
            `,
            6,
            new Date().toISOString()
        );

        currentVersion = 6;
    }

    if (currentVersion < 7) {
        await migrate007OrderItemButtonType(db);

        await db.runAsync(
            `
            INSERT INTO schema_migrations
            (version, applied_at)
            VALUES (?, ?)
            `,
            7,
            new Date().toISOString()
        );

        currentVersion = 7;
    }
}
