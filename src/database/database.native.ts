import * as SQLite from "expo-sqlite";

import { migrate001Initial } from "@/database/migrations/001_initial";
import { migrate002FixOrderSchema } from "@/database/migrations/002_fix_order_date";
import { migrate003AddTailoringDetails } from "@/database/migrations/003_add_tailoring_details";

const DATABASE_NAME = "the-stitch-center.db";

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (database) {
        return database;
    }

    database = await SQLite.openDatabaseAsync(DATABASE_NAME);

    await runMigrations(database);

    return database;
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

    const migration = await db.getFirstAsync<{
        version: number;
    }>(
        "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1"
    );

    const currentVersion = migration?.version ?? 0;

    if (currentVersion < 1) {
        await migrate001Initial(db);

        await db.runAsync(
            `
        INSERT INTO schema_migrations (version, applied_at)
        VALUES (?, ?)
      `,
            1,
            new Date().toISOString()
        );
    }
    if (currentVersion < 2) {
        await migrate002FixOrderSchema(db);

        await db.runAsync(
            `INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)`,
            2,
            new Date().toISOString()
        );
    }
    if (currentVersion < 3) {
        await migrate003AddTailoringDetails(db);

        await db.runAsync(
            `INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)`,
            3,
            new Date().toISOString()
        );
    }
}