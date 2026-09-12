import { getDatabase } from "@/database/database.native";
import { Setting } from "@/types/settings";

export async function getSetting(
    key: string
): Promise<string | null> {
    const db = await getDatabase();

    const result = await db.getFirstAsync<Setting>(
        `
    SELECT
      key,
      value
    FROM settings
    WHERE key = ?
    `,
        key
    );

    return result?.value ?? null;
}

export async function setSetting(
    key: string,
    value: string
): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
        `
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key)
    DO UPDATE SET value = excluded.value
    `,
        key,
        value
    );
}

export async function getAllSettings(): Promise<Setting[]> {
    const db = await getDatabase();

    return db.getAllAsync<Setting>(
        `
    SELECT
      key,
      value
    FROM settings
    ORDER BY key ASC
    `
    );
}

export async function deleteSetting(
    key: string
): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
        `
    DELETE FROM settings
    WHERE key = ?
    `,
        key
    );
}